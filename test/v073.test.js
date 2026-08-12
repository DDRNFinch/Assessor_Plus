import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=file=>readFile(file,'utf8');
const json=async file=>JSON.parse(await read(file));

test('V0.8.0 qualification display titles are exact and optional units remain separate',async()=>{
 const [l2,l3,ksb,app]=await Promise.all([json('level2-trowel-6570-04-FULL-course-data.json'),json('level3-trowel-6570-05-FULL-course-data.json'),json('bricklayer-st0095-v1.2-course-data.json'),read('src/app.js')]);
 assert.equal(l2.course.title,'Trowel Occupations - City & Guilds - 6570-04 - Level 2');
 assert.equal(l3.course.title,'Trowel Occupations - City & Guilds - 6570-05 - Level 3');
 assert.equal(ksb.course.title,'Bricklayer - ST0095 - Version 1.2 - Level 2');
 const l2base=JSON.parse((await import('node:child_process')).execFileSync('git',['show','HEAD:level2-trowel-6570-04-FULL-course-data.json'],{encoding:'utf8'}));
 const l3base=JSON.parse((await import('node:child_process')).execFileSync('git',['show','HEAD:level3-trowel-6570-05-FULL-course-data.json'],{encoding:'utf8'}));
 assert.deepEqual(l2.course.optionalUnitIds,l2base.course.optionalUnitIds);
 assert.deepEqual(l3.course.optionalUnitIds,l3base.course.optionalUnitIds);
 assert.doesNotMatch(app,/<small>Optional Unit/);
 assert.doesNotMatch(app,/course\.course\.title\s*\+\s*.*optionalUnit/);
});

test('learner-scoped secondary workflows have deterministic return navigation',async()=>{
 const app=await read('src/app.js');
 assert.match(app,/data-back-learner/);
 assert.match(app,/backToLearnerButton\(l\.id\).*New Holistic Observation/);
 assert.match(app,/backToLearnerButton\(l\.id\).*New Observation/);
 assert.match(app,/backToLearnerButton\(l\.id\).*assessment-heading/);
 assert.match(app,/backToLearnerButton\(l\.id\).*KSB Evidence Matrix/);
 assert.match(app,/backToLearnerButton\(l\.id\).*Evidence Matrix/);
 assert.match(app,/learnerId\?backToLearnerButton\(learnerId\)/);
 assert.match(app,/go\('learnerProfile',learnerId\)/);
 assert.doesNotMatch(app,/history\.(?:back|go)/);
});

test('new back controls protect only genuinely unsaved observation work',async()=>{
 const app=await read('src/app.js');
 assert.match(app,/observationHasUnsavedChanges/);
 assert.match(app,/materialAssessmentChanged\(saved,a\)/);
 assert.match(app,/Discard unsaved changes\?/);
 assert.match(app,/data-close-sheet>Cancel/);
 assert.match(app,/data-confirm-learner-return/);
 assert.match(app,/if\(observationHasUnsavedChanges\(a\)\).*openDiscardConfirmation/);
 assert.match(app,/go\('learnerProfile',learnerId\)/);
});

test('V0.8.0 metadata, build and all offline qualifications are consistent',async()=>{
 const [pkg,manifest,index,sw,build]=await Promise.all(['package.json','manifest.webmanifest','index.html','sw.js','scripts/build.js'].map(read));
 assert.equal(JSON.parse(pkg).version,'0.8.0'); assert.equal(JSON.parse(manifest).version,'0.8.0');
 assert.match(index,/V0\.8\.0(?:-[a-z0-9-]+)?/); assert.match(build,/V0\.8\.0(?:-[a-z0-9-]+)?/);
 assert.match(sw,/const CACHE='assessor-plus-v0\.8\.0(?:-[a-z0-9-]+)?'/);
 for(const file of ['level2-trowel-6570-04-FULL-course-data.json','level3-trowel-6570-05-FULL-course-data.json','bricklayer-st0095-v1.2-course-data.json']){assert.match(sw,new RegExp(file.replaceAll('.','\\.')));assert.match(build,new RegExp(file.replaceAll('.','\\.')))}
});
