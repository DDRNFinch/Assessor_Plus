import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generateFeedback} from '../src/feedback.js';
import {assessmentPdfText} from '../src/pdf.js';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('V0.6 release metadata, shell and offline cache are consistent',async()=>{
  const [pkg,index,manifest,sw,app]=await Promise.all([read('package.json'),read('index.html'),read('manifest.webmanifest'),read('sw.js'),read('src/app.js')]);
  assert.equal(JSON.parse(pkg).version,'0.6.3');
  assert.match(index,/V0\.6\.3/);
  assert.equal(JSON.parse(manifest).version,'0.6.3');
  assert.match(sw,/assessor-plus-v0\.6\.3/);
  assert.match(sw,/src\/feedback\.js/);
  assert.match(app,/beforeinstallprompt/);
  assert.match(app,/display-mode: standalone/);
});

test('manifest is standalone, branded, and all declared icon dimensions are real',async()=>{
  const manifest=JSON.parse(await read('manifest.webmanifest'));
  assert.equal(manifest.name,'Assessor+');assert.equal(manifest.short_name,'Assessor+');assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
  for(const icon of manifest.icons){const file=new Uint8Array(await readFile(new URL(icon.src,root)));await stat(new URL(icon.src,root));assert.equal(file[0],0x89);const width=new DataView(file.buffer,file.byteOffset,file.byteLength).getUint32(16);const height=new DataView(file.buffer,file.byteOffset,file.byteLength).getUint32(20);assert.equal(`${width}x${height}`,icon.sizes)}
  assert.ok(manifest.icons.some(x=>x.sizes==='192x192'));assert.ok(manifest.icons.some(x=>x.sizes==='512x512'));assert.ok(manifest.icons.some(x=>x.purpose==='maskable'));
});

test('authoritative course file is byte-identical to the V0.1 git baseline',async()=>{
  const current=await readFile(new URL('level3-trowel-6570-05-FULL-course-data.json',root));
  const digest=createHash('sha256').update(current).digest('hex');
  assert.equal(digest,'cf08b58a6154cf2dee20e7632d88ba81620be590ba494577ca635501a243f03e');
});

const learner={name:'Alex Morgan'},unit={id:'235',title:'Erecting masonry structures in the workplace'};
const assessment={id:'OBS-0001',learnerId:'L1',primaryUnit:'235',date:'2026-08-11',assessor:'Pat',selected:{practical:['1.1','1.2'],knowledge:[]},selectedPracticalWording:['interpret and extract relevant information','comply with information and instructions'],mappings:{practical:[{decision:'automatic'}],knowledge:[]},notes:'Alex interpreted the drawing and followed the recorded instructions.',hasDiscussion:false,discussionNotes:'',media:[],outcome:'Competent evidence demonstrated',signature:'Pat',signatureDate:'2026-08-11'};

test('local feedback uses selected evidence and never invents professional discussion',()=>{
  const text=generateFeedback(assessment,learner,unit);
  assert.match(text,/Alex Morgan/);assert.match(text,/interpret and extract/);assert.match(text,/recorded instructions/);assert.doesNotMatch(text,/professional discussion/i);assert.doesNotMatch(text,/qualification completion/i);
});

test('feedback includes discussion only when it exists',()=>{
  const text=generateFeedback({...assessment,hasDiscussion:true,selected:{...assessment.selected,knowledge:['2.1']},selectedKnowledgeWording:['explain how hazards are identified'],discussionNotes:'The learner explained the recorded hazard controls.'},learner,unit);
  assert.match(text,/During the professional discussion/);assert.match(text,/hazards are identified/);
});

test('Further evidence required cannot produce a competent conclusion',()=>{
  const text=generateFeedback({...assessment,outcome:'Further evidence required'},learner,unit);
  assert.match(text,/Further evidence required/);assert.match(text,/does not yet support a competent outcome/);assert.doesNotMatch(text,/sufficient to demonstrate competent/i);
});

test('saved edited feedback is emitted verbatim into PDF text',()=>{
  const feedback='Assessor-edited final feedback retained exactly.';
  const course={course:{title:'Qualification'},units:[unit]};
  assert.match(assessmentPdfText({...assessment,feedback},learner,course),new RegExp(feedback));
});

test('compact UI wires details, pending decisions, ignored review and replacement confirmation',async()=>{
  const app=await read('src/app.js');
  assert.match(app,/data-detail/);assert.match(app,/map-chip pending/);assert.match(app,/data-sheet-decision/);assert.match(app,/Review ignored/);assert.doesNotMatch(app,/Replace your current feedback|data-generate/);
  const index=await read('index.html');
  const nav=index.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)[0];
  assert.match(nav,/>Learners</);assert.match(nav,/>Assessments</);assert.doesNotMatch(nav,/Home|Reviews|Settings|Admin/);
});
