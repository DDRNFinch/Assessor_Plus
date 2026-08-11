const DB='assessor-plus-v01';
export const STORES=Object.freeze({learners:'id',assessments:'id',media:'id',settings:'key',profileAssets:'key',professionalDocuments:'id',reviews:'id',visits:'id'});
let promise;

const missingStores=db=>Object.keys(STORES).filter(name=>!db.objectStoreNames.contains(name));
const attachVersionChange=db=>{db.onversionchange=()=>{db.close();promise=undefined};return db};

function inspectExistingDB(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open(DB);
 request.onerror=()=>reject(request.error||new Error('IndexedDB could not be opened.'));
 request.onblocked=()=>reject(Object.assign(new Error('Assessor+ local data is temporarily busy in another window.'),{name:'BlockedError'}));
 request.onsuccess=()=>resolve(request.result);
})}

function upgradeMissingStores(version){return new Promise((resolve,reject)=>{
 const request=indexedDB.open(DB,version);let settled=false;
 const fail=error=>{if(settled)return;settled=true;reject(error)};
 request.onupgradeneeded=()=>{const db=request.result;for(const[name,keyPath]of Object.entries(STORES))if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath})};
 request.onblocked=()=>fail(Object.assign(new Error('Assessor+ needs another open app window to close before local data can be upgraded.'),{name:'BlockedError'}));
 request.onerror=()=>fail(request.error||new Error('IndexedDB could not be upgraded.'));
 request.onsuccess=()=>{if(settled){request.result.close();return}settled=true;resolve(attachVersionChange(request.result))};
})}

async function openCompatibleDB(){
 const current=await inspectExistingDB();
 const missing=missingStores(current);
 if(!missing.length)return attachVersionChange(current);
 // Never request a fixed historical version. Existing devices may already have a
 // higher IndexedDB version from an earlier release; upgrades must always move
 // forward from the version actually stored on that device.
 const targetVersion=current.version+1;
 current.close();
 return upgradeMissingStores(targetVersion);
}

export function openDB(){
 if(!promise)promise=openCompatibleDB().catch(error=>{promise=undefined;throw error});
 return promise;
}

/** Optional profile data must never prevent core learner data from opening. */
export async function optionalRead(read,fallback,label){
 try{return await read()}catch(error){console.warn(`Assessor+ could not load optional ${label}.`,error);return fallback}
}
export async function all(store){const db=await openDB();return new Promise((res,rej)=>{let r;try{r=db.transaction(store).objectStore(store).getAll()}catch(error){rej(error);return}r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});}
export async function get(store,key){const db=await openDB();return new Promise((res,rej)=>{let r;try{r=db.transaction(store).objectStore(store).get(key)}catch(error){rej(error);return}r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});}
export async function put(store,value){const db=await openDB();return new Promise((res,rej)=>{let tx;try{tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value)}catch(error){rej(error);return}tx.oncomplete=()=>res(value);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('IndexedDB write was aborted.'))});}
export async function remove(store,key){const db=await openDB();return new Promise((res,rej)=>{let tx;try{tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key)}catch(error){rej(error);return}tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('IndexedDB delete was aborted.'))});}
export async function readAllStores(){const entries=await Promise.all(Object.keys(STORES).map(async name=>[name,await all(name)]));return Object.fromEntries(entries)}

export const nextId=(prefix,items)=>`${prefix}-${String(Math.max(0,...items.map(x=>Number(x.id?.split('-')[1])||0))+1).padStart(4,'0')}`;

/** Targeted local deletion. Media is selected by assessmentId as well as metadata IDs so orphaned blobs cannot remain. */
export async function deleteAssessmentCascade(assessmentId){
 const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(['assessments','media'],'readwrite'),assessments=tx.objectStore('assessments'),media=tx.objectStore('media');assessments.delete(assessmentId);const request=media.openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const value=cursor.value;if(value.assessmentId===assessmentId)cursor.delete();cursor.continue()};tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)});
}
export async function deleteLearnerCascade(learnerId){
 const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(['learners','assessments','media','reviews','visits'],'readwrite'),learners=tx.objectStore('learners'),assessments=tx.objectStore('assessments'),media=tx.objectStore('media'),reviews=tx.objectStore('reviews'),visits=tx.objectStore('visits'),assessmentIds=new Set();learners.delete(learnerId);const vr=visits.openCursor();vr.onsuccess=()=>{const cursor=vr.result;if(!cursor)return;if(cursor.value.learnerId===learnerId)cursor.delete();cursor.continue()};const rr=reviews.openCursor();rr.onsuccess=()=>{const cursor=rr.result;if(!cursor)return;if(cursor.value.learnerId===learnerId)cursor.delete();cursor.continue()};const ar=assessments.openCursor();ar.onsuccess=()=>{const cursor=ar.result;if(!cursor){const mr=media.openCursor();mr.onsuccess=()=>{const item=mr.result;if(!item)return;if(assessmentIds.has(item.value.assessmentId))item.delete();item.continue()};return}if(cursor.value.learnerId===learnerId){assessmentIds.add(cursor.value.id);cursor.delete()}cursor.continue()};tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)});
}
/** Pure selectors shared by deletion tests and the IndexedDB cascade contract. */
export const assessmentBelongsToLearner=(assessment,learnerId)=>assessment.learnerId===learnerId;
export const mediaBelongsToAssessments=(media,assessmentIds)=>assessmentIds.has(media.assessmentId);
export const reviewBelongsToLearner=(review,learnerId)=>review.learnerId===learnerId;
