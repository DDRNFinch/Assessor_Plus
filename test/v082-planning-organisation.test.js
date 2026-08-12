import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBackup,validateBackup} from '../src/backup.js';
import {monthCalendarDates,rollingFiveDays,visitsForDate,compareLearnersByFirstName,groupLearnersByCourse,VISIT_TYPES,learnerPlanningStatus,learnerAvailability,visitWork,workStatus} from '../src/planning.js';

test('month cells are fixed real dates across mid-week month and year boundaries',()=>{
 const august=monthCalendarDates('2026-08'),december=monthCalendarDates('2026-12');
 assert.equal(august.filter(Boolean).length,31);assert.deepEqual(august.filter(Boolean).slice(0,3),['2026-08-01','2026-08-02','2026-08-03']);
 assert.equal(august.indexOf('2026-08-03')%7,0);assert.deepEqual(december.filter(Boolean).slice(-2),['2026-12-30','2026-12-31']);
 assert.equal(monthCalendarDates('2027-01').filter(Boolean)[0],'2027-01-01');
});

test('zero, one, many and deleted visits cannot alter calendar date cells',()=>{
 const fixed=monthCalendarDates('2026-08'),visits=[{id:'1',date:'2026-08-15',type:'review'},{id:'2',date:'2026-08-15',type:'observation'},{id:'3',date:'2026-09-01',type:'combined'}];
 assert.deepEqual(monthCalendarDates('2026-08'),fixed);assert.equal(visitsForDate(visits,'2026-08-15').length,2);
 visits.pop();assert.deepEqual(monthCalendarDates('2026-08'),fixed);visits.splice(0,1);assert.deepEqual(monthCalendarDates('2026-08'),fixed);
 assert.equal(fixed.indexOf('2026-08-14')+1,fixed.indexOf('2026-08-15'));assert.equal(fixed.indexOf('2026-08-15')+1,fixed.indexOf('2026-08-16'));
});

test('rolling view remains today through today plus four independently of visits',()=>{
 const expected=['2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03'],visits=[{date:'2026-12-31',type:'review'},{date:'2027-01-01',type:'combined'}];
 assert.deepEqual(rollingFiveDays(new Date(2026,11,30)),expected);assert.equal(visitsForDate(visits,expected[1]).length,1);assert.deepEqual(rollingFiveDays(new Date(2026,11,30)),expected);
});

test('learners group by actual course and pathway then sort by trimmed first name with stable ties',()=>{
 const courseA={course:{title:'Carpentry',pathways:[{id:'site',title:'Site Carpenter'},{id:'joiner',title:'Architectural Joiner'}]}},courseB={course:{title:'Bricklayer'}},courses={a:courseA,b:courseB};
 const learners=[{id:'4',name:' Joe Bloggs ',courseId:'b'},{id:'3',name:'adam Zed',courseId:'b'},{id:'2',name:'Adam Able',courseId:'b'},{id:'5',name:'Brad Smith',courseId:'a',pathwayId:'site'},{id:'1',name:'Chris Brown',courseId:'a',pathwayId:'joiner'}];
 const groups=groupLearnersByCourse(learners,l=>courses[l.courseId]);
 assert.deepEqual(groups.map(x=>x.title),['Bricklayer','Carpentry — Architectural Joiner','Carpentry — Site Carpenter']);
 assert.deepEqual(groups[0].learners.map(x=>x.id),['2','3','4']);assert.ok(compareLearnersByFirstName({name:' Adam Zed '},{name:'brad Able'})<0);
});

test('availability remains Plan a Visit data and status dots retain all planned colours',()=>{
 const learner={annualLeave:[{startDate:'2026-08-15',endDate:'2026-08-15'}],collegeDays:{dates:['2026-08-16']}};
 assert.deepEqual(learnerAvailability(learner,'2026-08-15').labels,['Annual Leave']);assert.deepEqual(learnerAvailability(learner,'2026-08-16').labels,['College Day']);
 assert.equal(visitsForDate([], '2026-08-15').length,0);assert.equal(learnerPlanningStatus(learner,[],new Date('2026-08-15T10:00:00Z')),'annual-leave');
 assert.deepEqual(Object.values(VISIT_TYPES).map(x=>x.colour),['blue','red','purple','amber']);
});

test('planning markup nests visits in fixed cells and keeps initials unboxed',async()=>{
 const [app,css]=await Promise.all([readFile('src/app.js','utf8'),readFile('styles.css','utf8')]);
 assert.match(app,/data-date-cell="\$\{date\}"[\s\S]*calendar-date[\s\S]*calendar-visits/);assert.match(app,/data-rolling-date="\$\{date\}"[\s\S]*rolling-visits/);
 assert.match(app,/calendar-visits>\$\{visitsForDate/);assert.doesNotMatch(app,/calendar-day[^`]*visit-initials[^`]*<\/button>`/);
 assert.match(css,/\.calendar-day\{display:flex;flex-direction:column;align-items:flex-start/);assert.match(css,/\.calendar-date\{[^}]*align-self:flex-start/);
 assert.match(css,/\.visit-initials\{[^}]*border:0[^}]*border-radius:0[^}]*background:transparent/);
 for(const [colour,hex] of [['blue','#1769c2'],['red','#c52f3a'],['purple','#7137a8'],['amber','#a76500']])assert.match(css,new RegExp(`\\.visit-initials\\.${colour}\\{color:${hex}`));
});

test('Upcoming Visits has text left and four stable accessible 2x2 actions right',async()=>{
 const [app,css]=await Promise.all([readFile('src/app.js','utf8'),readFile('styles.css','utf8')]),card=app.slice(app.indexOf('function visitCard'),app.indexOf('\nfunction planning'));
 assert.match(card,/visit-details[\s\S]*visit-actions/);assert.match(css,/\.visit-card\{display:grid;grid-template-columns/);assert.match(css,/\.visit-actions\{display:grid;grid-template-columns:repeat\(2,44px\);grid-template-rows:repeat\(2,44px\)/);
 for(const label of ['Directions','Open Visit','View learner','Edit visit'])assert.match(card,new RegExp(label,'i'));
 assert.match(card,/disabled aria-disabled="true" aria-label=/);assert.match(card,/location missing/);assert.match(card,/data-open-visit/);assert.match(card,/data-profile/);assert.match(card,/data-edit-visit/);assert.match(css,/\.icon-action:focus-visible/);
});

test('planned work resolves stable review and observation IDs with explicit statuses',()=>{
 const visit={id:'V1',type:'combined',reviewId:'R1',assessmentId:'O1'},reviews=[{id:'OLD',status:'Completed'},{id:'R1',status:'Draft'}],assessments=[{id:'O1',status:'Completed'}],work=visitWork(visit,reviews,assessments);
 assert.equal(work.review.id,'R1');assert.equal(work.observation.id,'O1');assert.equal(workStatus(), 'Not Started');assert.equal(workStatus(work.review),'Draft');assert.equal(workStatus(work.observation),'Complete');
 assert.deepEqual(visitWork(visit,reviews,assessments),work);
});

test('Open Visit reuses existing systems before future dates and exposes combined chooser',async()=>{
 const app=await readFile('src/app.js','utf8'),open=app.slice(app.indexOf('async function openPlannedVisit'),app.indexOf('\nfunction visitCard'));
 assert.match(open,/v\.type==='combined'&&!part.*showVisitChooser/);assert.match(open,/v\.type==='review'\|\|v\.type==='catchup'/);assert.match(open,/createReview/);assert.match(open,/createCatchUpReview/);assert.match(open,/reviews\.find\(x=>x\.id===v\.reviewId\)/);assert.match(open,/assessments\.find\(x=>x\.id===v\.assessmentId\)/);
 assert.doesNotMatch(open,/new Date|visit date|>=|<=/);assert.match(app,/data-open-visit-work/);assert.match(app,/Review[\s\S]*Observation/);assert.match(app,/data-save-review-draft/);assert.match(app,/r\.status='Draft'/);assert.match(app,/a\.status=a\.outcome/);
});

test('Learner Profile Next Visit and Planning use the identical visit resolver',async()=>{
 const app=await readFile('src/app.js','utf8');assert.match(app,/next-visit-card data-open-visit="\$\{v\.id\}"/);assert.match(app,/icon-action data-open-visit="\$\{v\.id\}"/);assert.equal((app.match(/await openPlannedVisit\(b\.dataset\.openVisit\)/g)||[]).length,1);
});

test('learner profile content header is normal-flow and learner groups retain status dots',async()=>{
 const [app,css]=await Promise.all([readFile('src/app.js','utf8'),readFile('styles.css','utf8')]);
 assert.match(css,/\.learner-profile>\.learner-profile-header\{position:static/);assert.doesNotMatch(css,/\.learner-profile-header\{[^}]*position:sticky/);
 assert.match(app,/groupLearnersByCourse\(learners,learnerCourse\)/);assert.match(app,/learner-group/);assert.match(app,/status-dot \$\{learnerPlanningStatus/);
});


test('Backup and Restore preserves visit-to-record relationships without duplicates',async()=>{
 const linked={learners:[{id:'L1'}],assessments:[{id:'O1',learnerId:'L1',visitId:'V1',status:'Draft'}],reviews:[{id:'R1',learnerId:'L1',visitId:'V1',status:'Draft'}],visits:[{id:'V1',learnerId:'L1',type:'combined',reviewId:'R1',assessmentId:'O1'}],media:[],settings:[],profileAssets:[],professionalDocuments:[]};
 const restored=(await validateBackup((await createBackup(linked)).blob)).data;
 assert.equal(restored.visits[0].reviewId,'R1');assert.equal(restored.visits[0].assessmentId,'O1');assert.equal(restored.reviews[0].visitId,'V1');assert.equal(restored.assessments[0].visitId,'V1');assert.equal(restored.reviews.length,1);assert.equal(restored.assessments.length,1);
});
