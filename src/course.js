export const isKsbCourse=course=>course?.course?.courseType==='KSB';
export const pathwayForLearner=(course,learner)=>course?.course?.pathways?.find(pathway=>pathway.id===learner?.pathwayId);
export const activeKSBs=(course,learner,collection)=>{const rows=course?.[collection]||[],pathway=pathwayForLearner(course,learner);return pathway?rows.filter(row=>pathway[collection].includes(row.reference)):rows};
export const flattenKSBs=(course,learner)=>['knowledge','skills','behaviours'].flatMap(collection=>activeKSBs(course,learner,collection).map(ksb=>({...ksb,collection,key:`${course.course.id}:${ksb.reference}`})));
export function flattenCourse(course){return (course.units||[]).flatMap(unit=>unit.learningOutcomes.flatMap(lo=>lo.criteria.map(ac=>({unit,lo,ac,key:`${unit.id}.${ac.id}`}))));}
export function validateCourse(course){
 if(isKsbCourse(course))return validateKsbCourse(course);
 const errors=[], units=course?.units||[], los=units.flatMap(u=>u.learningOutcomes||[]), rows=flattenCourse({units});
 const counts={units:units.length,learningOutcomes:los.length,criteria:rows.length,practical:rows.filter(x=>x.ac.evidenceClass==='practical').length,knowledge:rows.filter(x=>x.ac.evidenceClass==='knowledge').length,ambiguous:rows.filter(x=>!['practical','knowledge'].includes(x.ac.evidenceClass)).length};
 const expected=course?.course?.id==='cg-6570-04-l2-trowel'?{units:11,learningOutcomes:72,criteria:331,practical:126,knowledge:205,ambiguous:0}:course?.course?.id==='cg-6570-05-l3-trowel'?{units:12,learningOutcomes:75,criteria:335,practical:128,knowledge:207,ambiguous:0}:null;
 if(expected)for(const [k,want] of Object.entries(expected)) if(counts[k]!==want) errors.push(`${k}: expected ${want}, found ${counts[k]}`);
 const ids=new Set(units.map(u=>u.id)); for(const id of [...course.course.mandatoryUnitIds,...course.course.optionalUnitIds]) if(!ids.has(id)) errors.push(`Missing declared unit ${id}`);
 for(const u of units){const seen=new Set(); for(const lo of u.learningOutcomes||[]){if(!lo.id||!lo.wording) errors.push(`Invalid LO in ${u.id}`); for(const ac of lo.criteria||[]){if(seen.has(ac.id))errors.push(`Duplicate ${u.id}.${ac.id}`);seen.add(ac.id);if(!ac.wording?.trim())errors.push(`Missing wording ${u.id}.${ac.id}`);if(!ac.operativeVerb?.trim())errors.push(`Missing operativeVerb ${u.id}.${ac.id}`);if(!ac.evidenceClass)errors.push(`Missing evidenceClass ${u.id}.${ac.id}`);}}}
 return {valid:errors.length===0,counts,errors};
}
export function validateKsbCourse(course){
 const st0264=course?.course?.reference==='ST0264',errors=[],identity=st0264?{id:'st0264-v1.4-carpentry-joinery',courseId:'st0264-v1.4-carpentry-joinery',courseType:'KSB',title:'Carpentry and Joinery - ST0264 - Version 1.4 - Level 2',reference:'ST0264',version:'1.4',level:2}:{id:'st0095-v1.2-bricklayer',courseId:'st0095-v1.2-bricklayer',courseType:'KSB',title:'Bricklayer - ST0095 - Version 1.2 - Level 2',reference:'ST0095',version:'1.2',level:2,typicalDurationMonths:24};
 for(const [field,want] of Object.entries(identity))if(course?.course?.[field]!==want)errors.push(`${field}: expected ${want}, found ${course?.course?.[field]}`);
 const expected=st0264?{knowledge:40,skills:30,behaviours:5}:{knowledge:31,skills:22,behaviours:6},all=[];
 for(const [collection,count] of Object.entries(expected)){const rows=course?.[collection]||[];if(rows.length!==count)errors.push(`${collection}: expected ${count}, found ${rows.length}`);const prefix=collection[0].toUpperCase();for(let i=1;i<=count;i++)if(!rows.some(x=>x.reference===`${prefix}${i}`))errors.push(`Missing ${prefix}${i}`);all.push(...rows)}
 const seen=new Set();for(const ksb of all){if(seen.has(ksb.reference))errors.push(`Duplicate ${ksb.reference}`);seen.add(ksb.reference);if(!ksb.wording?.trim())errors.push(`Missing wording ${ksb.reference}`)}
 if(st0264){const expectedPathways={'site-carpentry':{knowledge:[...Array(29)].map((_,i)=>`K${i+1}`).concat('K40'),skills:[...Array(22)].map((_,i)=>`S${i+1}`),behaviours:[...Array(5)].map((_,i)=>`B${i+1}`)},'architectural-joinery':{knowledge:[...Array(20)].map((_,i)=>`K${i+1}`).concat([...Array(11)].map((_,i)=>`K${i+30}`)),skills:[...Array(13)].map((_,i)=>`S${i+1}`).concat([...Array(8)].map((_,i)=>`S${i+23}`)),behaviours:[...Array(5)].map((_,i)=>`B${i+1}`)}};if(course.course.pathways?.length!==2)errors.push('pathways: expected 2');for(const [id,want] of Object.entries(expectedPathways)){const actual=course.course.pathways?.find(x=>x.id===id);if(!actual)errors.push(`Missing pathway ${id}`);else for(const key of Object.keys(want))if(JSON.stringify(actual[key])!==JSON.stringify(want[key]))errors.push(`${id} ${key} inventory is invalid`)}}
 return{valid:errors.length===0,counts:{knowledge:(course?.knowledge||[]).length,skills:(course?.skills||[]).length,behaviours:(course?.behaviours||[]).length,total:all.length},errors};
}
export const availableUnits=(course,learner)=>isKsbCourse(course)?[]:(()=>{const mandatory=course.course.mandatoryUnitIds.map(id=>course.units.find(u=>u.id===id)).filter(Boolean),optional=course.units.find(u=>u.id===learner.optionalUnitId);return optional?[...mandatory,optional]:mandatory})();

export const DEFAULT_COURSE_ID='cg-6570-05-l3-trowel';
export const COURSE_FILES={
 'cg-6570-04-l2-trowel':'level2-trowel-6570-04-FULL-course-data.json',
 [DEFAULT_COURSE_ID]:'level3-trowel-6570-05-FULL-course-data.json',
 'st0095-v1.2-bricklayer':'bricklayer-st0095-v1.2-course-data.json',
 'st0264-v1.4-carpentry-joinery':'carpentry-joinery-st0264-v1.4-course-data.json'
};
export const learnerCourseId=learner=>learner?.courseId||DEFAULT_COURSE_ID;
export const courseForLearner=(courses,learner)=>courses.get(learnerCourseId(learner))||courses.get(DEFAULT_COURSE_ID);
export async function loadCourses(fetcher=fetch){const entries=await Promise.all(Object.entries(COURSE_FILES).map(async([id,file])=>{const response=await fetcher(file);if(!response.ok)throw Error(`Course data request failed (${response.status})`);const course=await response.json(),validation=validateCourse(course);if(course.course.id!==id)validation.errors.push(`Course ID mismatch: expected ${id}`);if(validation.errors.length)throw Error(validation.errors.join('\n'));return[id,course]}));return new Map(entries)}
