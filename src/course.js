export const isKsbCourse=course=>course?.course?.courseType==='KSB';
export const flattenKSBs=course=>['knowledge','skills','behaviours'].flatMap(collection=>(course?.[collection]||[]).map(ksb=>({...ksb,collection,key:`${course.course.id}:${ksb.reference}`})));
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
 const errors=[],identity={id:'st0095-v1.2-bricklayer',courseId:'st0095-v1.2-bricklayer',courseType:'KSB',title:'Bricklayer',reference:'ST0095',version:'1.2',level:2,typicalDurationMonths:24};
 for(const [field,want] of Object.entries(identity))if(course?.course?.[field]!==want)errors.push(`${field}: expected ${want}, found ${course?.course?.[field]}`);
 const expected={knowledge:31,skills:22,behaviours:6},all=[];
 for(const [collection,count] of Object.entries(expected)){const rows=course?.[collection]||[];if(rows.length!==count)errors.push(`${collection}: expected ${count}, found ${rows.length}`);const prefix=collection[0].toUpperCase();for(let i=1;i<=count;i++)if(!rows.some(x=>x.reference===`${prefix}${i}`))errors.push(`Missing ${prefix}${i}`);all.push(...rows)}
 const seen=new Set();for(const ksb of all){if(seen.has(ksb.reference))errors.push(`Duplicate ${ksb.reference}`);seen.add(ksb.reference);if(!ksb.wording?.trim())errors.push(`Missing wording ${ksb.reference}`)}
 return{valid:errors.length===0,counts:{knowledge:(course?.knowledge||[]).length,skills:(course?.skills||[]).length,behaviours:(course?.behaviours||[]).length,total:all.length},errors};
}
export const availableUnits=(course,learner)=>isKsbCourse(course)?[]:(()=>{const mandatory=course.course.mandatoryUnitIds.map(id=>course.units.find(u=>u.id===id)).filter(Boolean),optional=course.units.find(u=>u.id===learner.optionalUnitId);return optional?[...mandatory,optional]:mandatory})();

export const DEFAULT_COURSE_ID='cg-6570-05-l3-trowel';
export const COURSE_FILES={
 'cg-6570-04-l2-trowel':'level2-trowel-6570-04-FULL-course-data.json',
 [DEFAULT_COURSE_ID]:'level3-trowel-6570-05-FULL-course-data.json',
 'st0095-v1.2-bricklayer':'bricklayer-st0095-v1.2-course-data.json'
};
export const learnerCourseId=learner=>learner?.courseId||DEFAULT_COURSE_ID;
export const courseForLearner=(courses,learner)=>courses.get(learnerCourseId(learner))||courses.get(DEFAULT_COURSE_ID);
export async function loadCourses(fetcher=fetch){const entries=await Promise.all(Object.entries(COURSE_FILES).map(async([id,file])=>{const response=await fetcher(file);if(!response.ok)throw Error(`Course data request failed (${response.status})`);const course=await response.json(),validation=validateCourse(course);if(course.course.id!==id)validation.errors.push(`Course ID mismatch: expected ${id}`);if(validation.errors.length)throw Error(validation.errors.join('\n'));return[id,course]}));return new Map(entries)}
