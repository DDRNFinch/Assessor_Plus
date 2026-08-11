export function flattenCourse(course){return course.units.flatMap(unit=>unit.learningOutcomes.flatMap(lo=>lo.criteria.map(ac=>({unit,lo,ac,key:`${unit.id}.${ac.id}`}))));}
export function validateCourse(course){
 const errors=[], units=course?.units||[], los=units.flatMap(u=>u.learningOutcomes||[]), rows=flattenCourse({units});
 const counts={units:units.length,learningOutcomes:los.length,criteria:rows.length,practical:rows.filter(x=>x.ac.evidenceClass==='practical').length,knowledge:rows.filter(x=>x.ac.evidenceClass==='knowledge').length,ambiguous:rows.filter(x=>!['practical','knowledge'].includes(x.ac.evidenceClass)).length};
 for(const [k,want] of Object.entries({units:12,learningOutcomes:75,criteria:335,practical:128,knowledge:207,ambiguous:0})) if(counts[k]!==want) errors.push(`${k}: expected ${want}, found ${counts[k]}`);
 const ids=new Set(units.map(u=>u.id)); for(const id of [...course.course.mandatoryUnitIds,...course.course.optionalUnitIds]) if(!ids.has(id)) errors.push(`Missing declared unit ${id}`);
 for(const u of units){const seen=new Set(); for(const lo of u.learningOutcomes||[]){if(!lo.id||!lo.wording) errors.push(`Invalid LO in ${u.id}`); for(const ac of lo.criteria||[]){if(seen.has(ac.id))errors.push(`Duplicate ${u.id}.${ac.id}`);seen.add(ac.id);if(!ac.wording?.trim())errors.push(`Missing wording ${u.id}.${ac.id}`);if(!ac.operativeVerb?.trim())errors.push(`Missing operativeVerb ${u.id}.${ac.id}`);if(!ac.evidenceClass)errors.push(`Missing evidenceClass ${u.id}.${ac.id}`);}}}
 return {valid:errors.length===0,counts,errors};
}
export const availableUnits=(course,learner)=>{const mandatory=course.course.mandatoryUnitIds.map(id=>course.units.find(u=>u.id===id)).filter(Boolean),optional=course.units.find(u=>u.id===learner.optionalUnitId);return optional?[...mandatory,optional]:mandatory;};
