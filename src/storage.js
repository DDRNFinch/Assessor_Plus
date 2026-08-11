const DB='assessor-plus-v01',VERSION=3;
const STORES={learners:'id',assessments:'id',media:'id',settings:'key',profileAssets:'key',professionalDocuments:'id',reviews:'id'};
let promise;

export function openDB(){
 if(!promise)promise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,VERSION);let settled=false;
  const fail=error=>{if(settled)return;settled=true;promise=undefined;reject(error)};
  request.onupgradeneeded=()=>{const db=request.result;for(const[name,keyPath]of Object.entries(STORES))if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath})};
  request.onblocked=()=>fail(Object.assign(new Error('The Assessor+ data upgrade is blocked by another open app window.'),{name:'BlockedError'}));
  request.onerror=()=>fail(request.error||new Error('IndexedDB could not be opened.'));
  request.onsuccess=()=>{
   if(settled){request.result.close();return}
   settled=true;const db=request.result;
   db.onversionchange=()=>{db.close();promise=undefined};
   resolve(db);
  };
 }).catch(error=>{promise=undefined;throw error});
 return promise;
}

/** Optional V0.5 profile data must never prevent core learner data from opening. */
export async function optionalRead(read,fallback,label){
 try{return await read()}catch(error){console.warn(`Assessor+ could not load optional ${label}.`,error);return fallback}
}
export async function all(store){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});}
export async function get(store,key){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});}
export async function put(store,value){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>res(value);tx.onerror=()=>rej(tx.error)});}
export async function remove(store,key){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});}
export const nextId=(prefix,items)=>`${prefix}-${String(Math.max(0,...items.map(x=>Number(x.id?.split('-')[1])||0))+1).padStart(4,'0')}`;

/** Targeted local deletion. Media is selected by assessmentId as well as metadata IDs so orphaned blobs cannot remain. */
export async function deleteAssessmentCascade(assessmentId){
 const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(['assessments','media'],'readwrite'),assessments=tx.objectStore('assessments'),media=tx.objectStore('media');assessments.delete(assessmentId);const request=media.openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const value=cursor.value;if(value.assessmentId===assessmentId)cursor.delete();cursor.continue()};tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)});
}
export async function deleteLearnerCascade(learnerId){
 const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(['learners','assessments','media','reviews'],'readwrite'),learners=tx.objectStore('learners'),assessments=tx.objectStore('assessments'),media=tx.objectStore('media'),reviews=tx.objectStore('reviews'),assessmentIds=new Set();learners.delete(learnerId);const rr=reviews.openCursor();rr.onsuccess=()=>{const cursor=rr.result;if(!cursor)return;if(cursor.value.learnerId===learnerId)cursor.delete();cursor.continue()};const ar=assessments.openCursor();ar.onsuccess=()=>{const cursor=ar.result;if(!cursor){const mr=media.openCursor();mr.onsuccess=()=>{const item=mr.result;if(!item)return;if(assessmentIds.has(item.value.assessmentId))item.delete();item.continue()};return}if(cursor.value.learnerId===learnerId){assessmentIds.add(cursor.value.id);cursor.delete()}cursor.continue()};tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)});
}
/** Pure selectors shared by deletion tests and the IndexedDB cascade contract. */
export const assessmentBelongsToLearner=(assessment,learnerId)=>assessment.learnerId===learnerId;
export const mediaBelongsToAssessments=(media,assessmentIds)=>assessmentIds.has(media.assessmentId);
export const reviewBelongsToLearner=(review,learnerId)=>review.learnerId===learnerId;
