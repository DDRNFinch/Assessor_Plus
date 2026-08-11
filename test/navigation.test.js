import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createNavigation,swipeBackDecision,SWIPE_EDGE_PX,SWIPE_DISTANCE_PX} from '../src/navigation.js';

const plainTarget={closest:()=>null};
const blockedTarget={closest:selector=>selector.includes('canvas')?{}:null};
const gesture=(overrides={})=>({startX:10,startY:100,endX:110,endY:108,target:plainTarget,canGoBack:true,...overrides});

test('top-level navigation has no internal Back state',()=>{for(const view of ['learners','assessments','toolkit']){const n=createNavigation();n.navigate({view},{topLevel:true});assert.equal(n.canGoBack(),false)}});
test('nested Learner Profile, Observation, Evidence Matrix, Unit Detail, Settings, General and Profile retain Back history',()=>{const n=createNavigation();for(const state of [{view:'learnerProfile',id:'L1'},{view:'matrix',id:'L1'},{view:'unitDetail',id:'L1|235'},{view:'observation',id:'OBS-1'}])n.navigate(state);assert.equal(n.history().length,4);const settings=createNavigation({view:'toolkit'});for(const view of ['settings','general','assessorProfileView'])settings.navigate({view});assert.equal(settings.history().length,3)});
test('Back follows internal history and preserves learner context',()=>{const n=createNavigation();n.navigate({view:'learnerProfile',id:'L1'});n.navigate({view:'matrix',id:'L1'});n.navigate({view:'unitDetail',id:'L1|235'});assert.deepEqual(n.back(),{view:'matrix',id:'L1'});assert.deepEqual(n.back(),{view:'learnerProfile',id:'L1'});assert.deepEqual(n.back(),{view:'learners'})});
test('Settings context survives Back',()=>{const n=createNavigation({view:'toolkit'});n.navigate({view:'settings'});n.navigate({view:'general'});n.navigate({view:'assessorProfileView'});assert.equal(n.back().view,'general');assert.equal(n.back().view,'settings');assert.equal(n.back().view,'toolkit')});
test('left-edge swipe triggers Back at documented thresholds',()=>{assert.equal(SWIPE_EDGE_PX,30);assert.equal(SWIPE_DISTANCE_PX,80);assert.equal(swipeBackDecision(gesture()),true)});
test('swipe starting away from left edge does not trigger',()=>assert.equal(swipeBackDecision(gesture({startX:31})),false));
test('too-short swipe does not trigger',()=>assert.equal(swipeBackDecision(gesture({endX:89})),false));
test('vertical scrolling does not trigger',()=>assert.equal(swipeBackDecision(gesture({endX:100,endY:220})),false));
test('right-to-left swipe does not trigger',()=>assert.equal(swipeBackDecision(gesture({endX:0})),false));
test('signature-pad gestures do not trigger Back',()=>assert.equal(swipeBackDecision(gesture({target:blockedTarget})),false));
test('audio, video and form-control gestures do not trigger Back',()=>{for(const tag of ['audio','video','input','textarea','select','button'])assert.equal(swipeBackDecision(gesture({target:{closest:selector=>selector.includes(tag)?{}:null}})),false)});
test('top-level swipe cannot leave the app',()=>assert.equal(swipeBackDecision(gesture({canGoBack:false})),false));
test('application uses one modal-first and unsaved-safe Back path for button and swipe',async()=>{const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');assert.match(app,/function goBack\(\).*?sheet.*?closeSheet\(\)/s);assert.match(app,/hasUnsavedAssessment\(\).*?confirm\('Discard unsaved changes\?'\)/s);assert.match(app,/dataset\.back.*?goBack\(\)/s);assert.match(app,/swipeBackDecision\(gesture\).*?goBack\(\)/s)});
test('Back is accessible and dark teal while top-level rendering omits it',async()=>{const [app,css]=await Promise.all([readFile(new URL('../src/app.js',import.meta.url),'utf8'),readFile(new URL('../styles.css',import.meta.url),'utf8')]);assert.match(app,/<button type="button" class="back-button" data-back aria-label="Back">Back<\/button>/);assert.match(app,/TOP_LEVEL_VIEWS\.has\(route\.view\).*backButton/);assert.match(css,/\.back-button\{[^}]*background:#173f4f[^}]*color:#fff/);assert.match(css,/\.back-button:focus-visible/)});
