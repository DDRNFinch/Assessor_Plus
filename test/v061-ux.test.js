import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deriveUnitProgress} from '../src/progress.js';
import {availableUnits} from '../src/course.js';
import {generateMappings} from '../src/mapping.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const course=JSON.parse(await read('level3-trowel-6570-05-FULL-course-data.json'));
const learner={id:'L1',optionalUnitId:'690'};
const assessment={id:'OBS-1',learnerId:'L1',primaryUnit:'235',selected:{practical:['1.1'],knowledge:[]},mappings:{practical:[],knowledge:[]}};

test('compact selector reuses learner progress, displays percentage and keeps observed units selectable',async()=>{
  const app=await read('src/app.js');
  assert.match(app,/function setup\([\s\S]*deriveUnitProgress\(course,l,assessments\)/);
  assert.match(app,/name=unit value=.*p\.unit\.id/);
  assert.match(app,/conciseUnitTitle\(p\.unit\)/);
  assert.match(app,/p\.percentage}%/);
  assert.match(app,/assessmentBars\(l,course\)/);
  assert.doesNotMatch(app,/p\.observed[^\n]{0,100}disabled/);
  const progress=deriveUnitProgress(course,learner,[assessment]);
  assert.equal(progress.find(p=>p.unit.id==='235').observed,true);
  assert.equal(progress.find(p=>p.unit.id==='234').observed,false);
});

test('selector retains active-unit filtering and excludes inactive optional units',()=>{
  const expected=availableUnits(course,learner).map(unit=>unit.id);
  const actual=deriveUnitProgress(course,learner,[assessment]).map(row=>row.unit.id);
  assert.deepEqual(actual,expected);
  assert.ok(actual.includes('690'));
  for(const inactive of course.course.optionalUnitIds.filter(id=>id!=='690'))assert.ok(!actual.includes(inactive));
});

test('word highlighting comparison presentation is removed',async()=>{
  const [app,css,sw]=await Promise.all(['src/app.js','styles.css','sw.js'].map(read));
  for(const source of [app,css,sw])assert.doesNotMatch(source,/compareWording|comparison-legend|word-match|word-different|comparison\.js/);
});

test('mapping scores, thresholds and inventory remain authoritative',async()=>{
  const mappingSource=await read('src/mapping.js');
  assert.match(mappingSource,/score<\.4/);
  assert.match(mappingSource,/score>=\.7\?'automatic':'confirm'/);
  const mappings=generateMappings(course);
  assert.equal(mappings.filter(row=>row.mappingType==='automatic').length,1468);
  assert.equal(mappings.filter(row=>row.mappingType==='confirm').length,388);
  const before=generateMappings(course).map(({similarity,mappingType})=>[similarity,mappingType]);
  assert.deepEqual(generateMappings(course).map(({similarity,mappingType})=>[similarity,mappingType]),before);
});

test('V0.8.0 identifiers and unique cache agree exactly',async()=>{
  const [pkg,manifest,index,pdf,build,sw]=await Promise.all(['package.json','manifest.webmanifest','index.html','src/pdf.js','scripts/build.js','sw.js'].map(read));
  assert.equal(JSON.parse(pkg).version,'0.8.0');
  assert.equal(JSON.parse(manifest).version,'0.8.0');
  assert.match(index,/V0\.8\.0(?:-[a-z0-9-]+)?/);
  assert.match(pdf,/ASSESSOR\+ V0\.8\.0(?:-[a-z0-9-]+)?/);
  assert.match(build,/Built Assessor\+ V0\.8\.0(?:-[a-z0-9-]+)?/);
  assert.match(sw,/const CACHE='assessor-plus-v0\.8\.0(?:-[a-z0-9-]+)?'/);
  assert.doesNotMatch(sw,/assessor-plus-v0\.6(?:'|-date-hotfix)/);
});
