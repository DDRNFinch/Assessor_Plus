import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {previousEvidenceMatrix,previousEvidenceFor} from '../src/observation-evidence.js';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const course={course:{mandatoryUnitIds:['100'],optionalUnitIds:['200','300']},units:[
 {id:'100',learningOutcomes:[{id:'1',criteria:[{id:'1.1',evidenceClass:'practical'},{id:'1.2',evidenceClass:'knowledge'},{id:'1.3',evidenceClass:'practical'}]}]},
 {id:'200',learningOutcomes:[{id:'1',criteria:[{id:'1.1',evidenceClass:'practical'}]}]},
 {id:'300',learningOutcomes:[{id:'1',criteria:[{id:'1.1',evidenceClass:'practical'}]}]}
]};
const learner={id:'L1',optionalUnitId:'200'};
const assessment=(id,overrides={})=>({id,learnerId:'L1',primaryUnit:'100',date:'2026-08-11',assessor:'Pat',selected:{practical:[],knowledge:[]},mappings:{practical:[],knowledge:[]},media:[],...overrides});

test('saved primary Practical and Professional Discussion evidence share the authoritative matrix state',()=>{
 const matrix=previousEvidenceMatrix(course,learner,[assessment('OBS0001',{selected:{practical:['1.1'],knowledge:['1.2']}})],'OBS0002');
 assert.equal(previousEvidenceFor(matrix,'100','1.1')[0].method,'practical');
 assert.equal(previousEvidenceFor(matrix,'100','1.2')[0].method,'knowledge');
 assert.deepEqual(previousEvidenceFor(matrix,'100','1.3'),[]);
});

test('automatic and assessor-confirmed holistic evidence count; pending and ignored do not',()=>{
 const mappings={practical:[
  {sourceUnit:'100',sourceAC:'1.1',targetUnit:'200',targetAC:'1.1',decision:'automatic'},
  {sourceUnit:'100',sourceAC:'1.1',targetUnit:'100',targetAC:'1.2',decision:'confirmed'},
  {sourceUnit:'100',sourceAC:'1.1',targetUnit:'100',targetAC:'1.3',decision:'pending'},
  {sourceUnit:'100',sourceAC:'1.1',targetUnit:'100',targetAC:'9.9',decision:'ignored'}
 ],knowledge:[]};
 const matrix=previousEvidenceMatrix(course,learner,[assessment('OBS0001',{mappings})]);
 assert.equal(previousEvidenceFor(matrix,'200','1.1')[0].mappingSource,'AUTOMATIC HOLISTIC MATCH');
 assert.equal(previousEvidenceFor(matrix,'100','1.2')[0].mappingSource,'ASSESSOR-CONFIRMED HOLISTIC MATCH');
 assert.deepEqual(previousEvidenceFor(matrix,'100','1.3'),[]);
 assert.deepEqual(previousEvidenceFor(matrix,'100','9.9'),[]);
});

test('inactive optional units, the current/deleted record and nonexistent records do not contribute',()=>{
 const inactive=assessment('OBS0001',{primaryUnit:'300',selected:{practical:['1.1'],knowledge:[]}});
 const current=assessment('OBS0002',{selected:{practical:['1.1'],knowledge:[]}});
 const matrix=previousEvidenceMatrix(course,learner,[inactive,current],'OBS0002');
 assert.deepEqual(previousEvidenceFor(matrix,'300','1.1'),[]);
 assert.deepEqual(previousEvidenceFor(matrix,'100','1.1'),[]);
 assert.deepEqual(previousEvidenceFor(matrix,'100','404'),[]);
});

test('AC presentation has subtle evidenced, outstanding and stronger selectable current states with traceability',async()=>{
 const [app,css]=await Promise.all([read('src/app.js'),read('styles.css')]);
 assert.match(app,/selected\?'selected':evidenced\?'previously-evidenced'/);
 assert.match(app,/type=checkbox data-ac=/);
 assert.doesNotMatch(app,/disabled[^>]*data-ac|>EVIDENCED</);
 assert.match(app,/class=evidence-tick[^>]*>✓</);
 assert.match(css,/\.criterion\.previously-evidenced\{background:#f0fbfa/);
 assert.match(css,/\.criterion\.selected\{background:#d9f2f0/);
 assert.match(app,/PREVIOUS EVIDENCE/);
 assert.match(app,/assessmentId/);
 assert.match(app,/Professional Discussion/);
});

test('media controls hide but retain native inputs, attributes, handlers and existing previews',async()=>{
 const [app,css,pkg]=await Promise.all([read('src/app.js'),read('styles.css'),read('package.json')]);
 for(const label of ['Camera','Video','Gallery','Record Audio','Files'])assert.match(app,new RegExp(label));
 assert.equal((app.match(/class=\"visually-hidden practical-media\" type=file/g)||[]).length,6);
 assert.match(app,/accept=\"image\/\*\" capture=environment/);
 assert.match(app,/accept=\"video\/\*\" capture=environment/);
 assert.match(app,/accept=\"image\/\*,video\/\*\" multiple/);
 assert.match(app,/class=\"visually-hidden knowledge-files\" type=file accept=\"audio\/\*,\.pdf,\.doc,\.docx,\.txt\" multiple/);
 assert.match(css,/\.visually-hidden\{position:absolute!important/);
 assert.doesNotMatch(css,/\.visually-hidden\{[^}]*display:none/);
 assert.match(app,/document\.querySelectorAll\('\.practical-media'\)/);
 assert.match(app,/document\.querySelectorAll\('\.knowledge-files'\)/);
 assert.match(app,/data-record-audio/);
 assert.match(app,/media-grid/);
 assert.match(app,/knowledge-list/);
 assert.match(app,/URL\.createObjectURL\(file\)/);
 assert.match(app,/<svg viewBox=/);
 assert.match(css,/stroke:currentColor/);
 assert.doesNotMatch(pkg,/fontawesome|lucide|heroicons/i);
});

test('V0.7.5 cache includes the evidence projection module',async()=>{
 const sw=await read('sw.js');
 assert.match(sw,/assessor-plus-v0\.7\.5/);
 assert.match(sw,/\.\/src\/observation-evidence\.js/);
});
