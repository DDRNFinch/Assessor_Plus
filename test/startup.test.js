import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

class StoreNames extends Array { contains(name){return this.includes(name)} }

function v1Database(){
 const records={
  learners:new Map([['learner-existing',{id:'learner-existing',name:'Existing learner'}]]),
  assessments:new Map([['assessment-existing',{id:'assessment-existing',learnerId:'learner-existing'}]]),
  media:new Map(),settings:new Map()
 };
 const keys={learners:'id',assessments:'id',media:'id',settings:'key'};
 const state={version:1,records,keys,creates:[]};
 const connection=()=>({
  get objectStoreNames(){return new StoreNames(...Object.keys(state.keys))},
  createObjectStore(name,{keyPath}){state.creates.push(name);state.keys[name]=keyPath;state.records[name]=new Map();return{}},
  close(){this.closed=true},onversionchange:null,
  transaction(name){
   const names=Array.isArray(name)?name:[name];
   for(const candidate of names)if(!state.records[candidate])throw Object.assign(Error(`Missing store: ${candidate}`),{name:'NotFoundError'});
   return {objectStore(store){return{
    get(key){return request(()=>state.records[store].get(key))},
    getAll(){return request(()=>[...state.records[store].values()])}
   }}};
  }
 });
 const request=operation=>{const result={};queueMicrotask(()=>{try{result.result=operation();result.onsuccess?.()}catch(error){result.error=error;result.onerror?.()}});return result};
 const indexedDB={open(name,version){
  const result={};queueMicrotask(()=>{const db=connection();result.result=db;if(version>state.version){result.oldVersion=state.version;state.version=version;result.onupgradeneeded?.({oldVersion:1,newVersion:version})}result.onsuccess?.()});return result;
 }};
 return {indexedDB,state};
}

test('a populated V1 database upgrades additively to V2 exactly once',async()=>{
 const fake=v1Database();globalThis.indexedDB=fake.indexedDB;
 const storage=await import(`../src/storage.js?upgrade=${Date.now()}`);
 const db=await storage.openDB();
 assert.equal(fake.state.version,2);
 assert.deepEqual([...db.objectStoreNames].sort(),['assessments','learners','media','professionalDocuments','profileAssets','settings']);
 assert.deepEqual(fake.state.creates,['profileAssets','professionalDocuments']);
 assert.equal((await storage.all('learners'))[0].name,'Existing learner');
 assert.equal((await storage.all('assessments'))[0].learnerId,'learner-existing');
 assert.equal(await storage.get('settings','assessor-profile'),undefined);
 assert.equal(await storage.get('profileAssets','signature'),undefined);
 assert.equal(await storage.get('profileAssets','provider-logo'),undefined);
 assert.deepEqual(await storage.all('professionalDocuments'),[]);
 await storage.openDB();
 assert.deepEqual(fake.state.creates,['profileAssets','professionalDocuments']);
});

test('optional profile failures return safe defaults and report diagnostics',async()=>{
 const {optionalRead}=await import('../src/storage.js');
 const original=console.warn,warnings=[];console.warn=(...args)=>warnings.push(args);
 try{
  assert.equal(await optionalRead(()=>Promise.reject(Error('asset failure')),null,'provider logo'),null);
  assert.deepEqual(await optionalRead(()=>Promise.reject(Error('document failure')),[],'professional documents'),[]);
 }finally{console.warn=original}
 assert.equal(warnings.length,2);
});

test('a blocked IndexedDB open rejects promptly and remains retryable',async()=>{
 let opens=0;
 globalThis.indexedDB={open(){const request={};queueMicrotask(()=>{opens++;if(opens===1)request.onblocked?.();else{request.result={close(){},onversionchange:null,objectStoreNames:new StoreNames('learners','assessments','media','settings','profileAssets','professionalDocuments')};request.onsuccess?.()}});return request}};
 const storage=await import(`../src/storage.js?blocked=${Date.now()}`);
 await assert.rejects(storage.openDB(),error=>error.name==='BlockedError');
 await storage.openDB();
 assert.equal(opens,2);
});

test('startup failure has a non-technical recoverable UI and blocked upgrades are diagnosed',async()=>{
 const [app,storage]=await Promise.all([readFile(new URL('../src/app.js',import.meta.url),'utf8'),readFile(new URL('../src/storage.js',import.meta.url),'utf8')]);
 assert.match(app,/Assessor\+ could not finish loading\./);
 assert.match(app,/id="retry-startup">Retry/);
 assert.doesNotMatch(app,/startup-error[^;]*<pre>/);
 assert.match(storage,/request\.onblocked/);
 assert.match(storage,/db\.onversionchange=\(\)=>\{db\.close\(\)/);
 assert.doesNotMatch(storage,/deleteDatabase|clear\(\)/);
});
