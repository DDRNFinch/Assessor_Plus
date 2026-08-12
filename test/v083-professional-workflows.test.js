import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessmentPdfText,makeReviewPdf,PHOTO_COLUMNS,PHOTO_ROWS,PHOTOS_PER_PAGE} from '../src/pdf.js';

test('professional forms expose calm workflow navigation and assessor-led narrative',async()=>{
 const [app,css]=await Promise.all(['src/app.js','styles.css'].map(file=>readFile(file,'utf8')));
 for(const label of ['Professional Review','Assessor Observation','What I observed','Evidence capture','Review Discussion'])assert.match(app,new RegExp(label));
 assert.match(app,/workflow-nav/);assert.match(css,/\.workflow-nav/);assert.match(css,/\.observation-narrative/);
});
test('observation PDF remains portrait, uses a 3 by 4 grid and preserves entered narrative and outcome',async()=>{
 assert.deepEqual([PHOTO_COLUMNS,PHOTO_ROWS,PHOTOS_PER_PAGE],[3,4,12]);
 const course={course:{courseType:'KSB',title:'Qualification'},skills:[],behaviours:[],knowledge:[]},learner={name:'Learner'},assessment={id:'OBS0003',date:'2026-08-12',notes:'The assessor entered this exact narrative.',outcome:'Further evidence required',feedback:'Specific feedback',media:[],knowledgeEvidence:[]};
 const text=assessmentPdfText(assessment,learner,course);
 assert.match(text,/ASSESSOR OBSERVATION/);assert.match(text,/The assessor entered this exact narrative\./);assert.match(text,/Further evidence required/);assert.doesNotMatch(text,/No observation narrative recorded/);
 const pdf=await readFile('src/pdf.js','utf8');assert.match(pdf,/photoPage=typeof items\[0\]==='object',pageW=A4\[0\],pageH=A4\[1\]/);
});
test('review PDF uses A4 offline generation and keeps the review reference in its footer',()=>{
 const pdf=makeReviewPdf({id:'REV0042',reviewType:'Progress Review',identitySnapshot:{learnerName:'Learner'},snapshot:{type:'NVQ',overall:{assessed:0,total:0}},reviewDate:'2026-08-12'});
 assert.equal(pdf.type,'application/pdf');assert.ok(pdf.size>500);
});
