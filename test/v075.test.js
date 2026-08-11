import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {COURSE_FILES,activeKSBs,courseForLearner,validateCourse,DEFAULT_COURSE_ID} from '../src/course.js';
import {deriveKsbProgress,validKsbEvidence} from '../src/progress.js';
import {previousKsbEvidence} from '../src/observation-evidence.js';
import {assessmentPdfText,evidenceExportFiles} from '../src/pdf.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const course=JSON.parse(await read('property-maintenance-operative-st0171-v1.1-course-data.json'));
const learner={id:'PMO',name:'Alex',courseId:course.course.id};
const record=(overrides={})=>({id:'OBS-PMO',learnerId:learner.id,courseId:course.course.id,date:'2026-08-11',assessor:'Pat',selectedKSBs:[],theoryKnowledge:{professionalDiscussion:[],supportingFiles:[]},hasDiscussion:false,discussionNotes:'',media:[],knowledgeEvidence:[],feedback:'Saved manual feedback',...overrides});
const refs=(prefix,n)=>Array.from({length:n},(_,i)=>`${prefix}${i+1}`);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('ST0171 authoritative identity, totals, exact inventories and wording are fixed',()=>{
 assert.deepEqual(course.course,{id:'st0171-v1.1-property-maintenance-operative',courseId:'st0171-v1.1-property-maintenance-operative',courseType:'KSB',title:'Property Maintenance Operative - ST0171 - Version 1.1 - Level 2',reference:'ST0171',version:'1.1',level:2,typicalDurationMonths:24});
 assert.equal(course.course.pathways,undefined);assert.deepEqual(validateCourse(course),{valid:true,counts:{knowledge:31,skills:25,behaviours:6,total:62},errors:[]});
 assert.deepEqual(course.knowledge.map(x=>x.reference),refs('K',31));assert.deepEqual(course.skills.map(x=>x.reference),refs('S',25));assert.deepEqual(course.behaviours.map(x=>x.reference),refs('B',6));
 assert.deepEqual([digest(course.knowledge),digest(course.skills),digest(course.behaviours)],['ba35d2a96c239f99bd225c6d2a6bd6752e95915734dfc942c87de445ee65c262','c271b91299c6c798f982b6a382f56c1e1e11986cc5954aaf6902ee9fb4fd4714','c18eba2186b5364ffa7d217544e5fe588ee09de1b3b1f91513524ba7f7de1afd']);
});

test('generic Theory UI contains one shared Knowledge renderer and no method-specific KSB lists',async()=>{
 const app=await read('src/app.js'),start=app.indexOf('function knowledgeRows('),end=app.indexOf('\nfunction ksbObservation',start),rows=app.slice(start,end),observation=app.slice(end,app.indexOf('\nfunction fresh',end));
 assert.equal((rows.match(/activeKSBs\(course,learner,'knowledge'\)\.map/g)||[]).length,1);assert.equal((observation.match(/\$\{knowledgeRows\(a\)\}/g)||[]).length,1);
 assert.doesNotMatch(app,/knowledgeRows\(a,'professionalDiscussion'\)|knowledgeRows\(a,'supportingFiles'\)/);assert.match(rows,/professionalDiscussion\|\$\{k\.reference\}/);assert.match(rows,/supportingFiles\|\$\{k\.reference\}/);assert.match(rows,/current\?'selected':entries\.length\?'previously-evidenced'/);
 for(const [file,pathwayId,count] of [['bricklayer-st0095-v1.2-course-data.json','',31],['carpentry-joinery-st0264-v1.4-course-data.json','site-carpentry',30],['carpentry-joinery-st0264-v1.4-course-data.json','architectural-joinery',31],['property-maintenance-operative-st0171-v1.1-course-data.json','',31]]){const c=JSON.parse(await read(file));assert.equal(activeKSBs(c,{pathwayId},'knowledge').length,count)}
});

test('discussion, file and combined associations persist with explicit evidence validity',()=>{
 const both=record({hasDiscussion:true,theoryKnowledge:{professionalDiscussion:['K5','K12'],supportingFiles:['K8','K12']},knowledgeEvidence:[{id:'audio',kind:'audio',name:'discussion.webm',type:'audio/webm'},{id:'file',kind:'document',name:'support.pdf',type:'application/pdf',knowledgeKSBs:['K8','K12']}]});
 assert.deepEqual(validKsbEvidence(both).filter(x=>x.reference==='K12').map(x=>x.method),['Professional Discussion','Supporting File']);assert.deepEqual(structuredClone(both).theoryKnowledge,both.theoryKnowledge);
 const prior=previousKsbEvidence(course,learner,[both]);assert.deepEqual(prior.get('K12').map(x=>x.method),['Professional Discussion','Supporting File']);
 assert.deepEqual(validKsbEvidence(record({selectedKSBs:['K1'],theoryKnowledge:{professionalDiscussion:['K2'],supportingFiles:['K3']},knowledgeEvidence:[{kind:'audio',knowledgeKSBs:['K2']},{kind:'document',knowledgeKSBs:[]}]})),[]);
});

test('ST0171 progress uses KSB terminology and exact 31/25/6/62 denominators',()=>{
 assert.deepEqual(deriveKsbProgress(course,learner,[]),{knowledge:{assessed:0,total:31},skills:{assessed:0,total:25},behaviours:{assessed:0,total:6},overall:{assessed:0,total:62}});
});

test('ST0171 PDF emits Knowledge once with actual methods and ZIP inputs retain originals',()=>{
 const a=record({selectedKSBs:['S1','B1'],hasDiscussion:true,theoryKnowledge:{professionalDiscussion:['K12'],supportingFiles:['K12']},knowledgeEvidence:[{id:'a',kind:'audio',name:'talk.webm',type:'audio/webm'},{id:'d',kind:'document',name:'proof.pdf',type:'application/pdf',knowledgeKSBs:['K12']}]}),text=assessmentPdfText(a,learner,course);
 assert.equal((text.match(/^K12 - /gm)||[]).length,1);assert.match(text,/K12[\s\S]*Professional Discussion[\s\S]*Supporting File/);assert.match(text,/PRACTICAL EVIDENCE[\s\S]*THEORY EVIDENCE/);assert.doesNotMatch(text,/\b(?:UNIT|LO|AC)\b|EPA[- ]?pass/i);assert.deepEqual(evidenceExportFiles(a).map(x=>x.name),['OBS-PMO_Audio_01.webm','OBS-PMO_Document_01.pdf']);
});

test('course selection, legacy resolution, course isolation and offline/build inventories include ST0171',async()=>{
 assert.equal(COURSE_FILES[course.course.id],'property-maintenance-operative-st0171-v1.1-course-data.json');const courses=new Map([[DEFAULT_COURSE_ID,{course:{id:DEFAULT_COURSE_ID}}],[course.course.id,course]]);assert.equal(courseForLearner(courses,{}).course.id,DEFAULT_COURSE_ID);assert.equal(courseForLearner(courses,learner),course);
 const other={...record({hasDiscussion:true,theoryKnowledge:{professionalDiscussion:['K1'],supportingFiles:[]}}),courseId:'st0095-v1.2-bricklayer'};assert.equal(deriveKsbProgress(course,learner,[other]).knowledge.assessed,0);
 for(const source of [await read('sw.js'),await read('scripts/build.js')])for(const file of Object.values(COURSE_FILES))assert.match(source,new RegExp(file.replace(/[.]/g,'\\.')));
});

test('V0.7.5 metadata is consistent and protected course data and mapping inventories are unchanged',async()=>{
 assert.equal(JSON.parse(await read('package.json')).version,'0.7.5');assert.equal(JSON.parse(await read('manifest.webmanifest')).version,'0.7.5');assert.match(await read('index.html'),/V0\.7\.5/);assert.match(await read('src/app.js'),/Assessor\+ V0\.7\.5/);assert.match(await read('src/pdf.js'),/ASSESSOR\+ V0\.7\.5/);assert.match(await read('sw.js'),/const CACHE='assessor-plus-v0\.7\.5'/);assert.match(await read('scripts/build.js'),/V0\.7\.5/);
 for(const file of ['level2-trowel-6570-04-FULL-course-data.json','level3-trowel-6570-05-FULL-course-data.json','bricklayer-st0095-v1.2-course-data.json','carpentry-joinery-st0264-v1.4-course-data.json'])assert.equal(await read(file),execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'}));
 const {generateMappings}=await import('../src/mapping.js');for(const [file,automatic,confirm] of [['level2-trowel-6570-04-FULL-course-data.json',1630,558],['level3-trowel-6570-05-FULL-course-data.json',1468,388]]){const mappings=generateMappings(JSON.parse(await read(file)));assert.deepEqual([mappings.filter(x=>x.mappingType==='automatic').length,mappings.filter(x=>x.mappingType==='confirm').length],[automatic,confirm])}
});
