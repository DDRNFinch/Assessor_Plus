import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWording} from '../src/comparison.js';
import {deriveUnitProgress} from '../src/progress.js';
import {generateMappings} from '../src/mapping.js';

const course=JSON.parse(await readFile(new URL('../level3-trowel-6570-05-FULL-course-data.json',import.meta.url)));
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const learner={id:'L1',optionalUnitId:'690'};
const base={id:'OBS-1',learnerId:'L1',primaryUnit:'235',selected:{practical:['1.1'],knowledge:[]},mappings:{practical:[{sourceUnit:'235',sourceAC:'1.1',targetUnit:'234',targetAC:'1.1',decision:'automatic'}],knowledge:[]}};

test('compact selector consumes existing unit progress, shows percentages, and keeps observed units selectable',()=>{
 const rows=deriveUnitProgress(course,learner,[base]);
 assert.equal(rows.find(x=>x.unit.id==='235').observed,true);
 assert.equal(rows.find(x=>x.unit.id==='234').observed,false,'holistic-only evidence is not a primary observation');
 assert.ok(rows.find(x=>x.unit.id==='235').percentage>0);
 assert.match(app,/progress=deriveUnitProgress\(course,l,assessments\)/);
 assert.match(app,/p\.percentage}%/);
 assert.match(app,/p\.observed\?'<small class=observed>OBSERVED ✓/);
 assert.match(app,/type=radio name=unit/);
 assert.doesNotMatch(app,/p\.observed[^\n]{0,100}disabled/);
});

test('selector retains learner active-unit filtering and excludes inactive optionals',()=>{
 const ids=deriveUnitProgress(course,learner,[]).map(x=>x.unit.id);
 assert.deepEqual(ids,[...course.course.mandatoryUnitIds,'690']);
 assert.ok(!ids.includes('828'));
 assert.match(app,/availableUnits\(course,l\)/);
});

test('display comparison preserves authoritative text and marks words occurrence-aware',()=>{
 const primary='Use Drawings, drawings safely.';
 const possible='use drawings and measurements safely';
 const result=compareWording(primary,possible);
 assert.equal(result.primary.map(x=>x.text).join(' '),primary);
 assert.equal(result.possible.map(x=>x.text).join(' '),possible);
 assert.deepEqual(result.primary.map(x=>x.state),['match','match','difference','match']);
 assert.deepEqual(result.possible.map(x=>x.state),['match','match','difference','difference','match']);
 assert.equal(result.primary[0].state,'match','matching is case-insensitive');
 assert.equal(result.primary[1].state,'match','punctuation does not create a false difference');
 assert.match(app,/PRIMARY AC/);assert.match(app,/POSSIBLE MATCH/);
 assert.match(app,/word-match/);assert.match(app,/word-difference/);
});

test('mapping engine inventory, scores, thresholds and decisions remain unchanged',async()=>{
 const mappings=generateMappings(course);
 assert.equal(mappings.filter(x=>x.mappingType==='automatic').length,1468);
 assert.equal(mappings.filter(x=>x.mappingType==='confirm').length,388);
 const mappingSource=await readFile(new URL('../src/mapping.js',import.meta.url),'utf8');
 assert.match(mappingSource,/score>=\.7\?'automatic':'confirm'/);
 assert.match(mappingSource,/if\(score<\.4\)return null/);
 assert.match(app,/recordDecision\(a,\.\.\.parts,decision\)/);
 assert.match(app,/decision==='confirmed'\?'Mapping confirmed':'Mapping ignored'/);
});
