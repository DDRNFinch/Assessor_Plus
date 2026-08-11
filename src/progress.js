import {availableUnits,flattenCourse,DEFAULT_COURSE_ID,isKsbCourse} from './course.js';
import {deriveMatrix} from './matrix.js';

export function validKsbEvidence(assessment){
 const evidence=[];
 for(const reference of assessment.selectedKSBs||[])if(/^S\d+$|^B\d+$/.test(reference))evidence.push({reference,method:'Holistic Observation'});
 if(assessment.hasDiscussion)for(const reference of assessment.theoryKnowledge?.professionalDiscussion||[])if(/^K\d+$/.test(reference))evidence.push({reference,method:'Professional Discussion'});
 for(const file of assessment.knowledgeEvidence||[])if(file.kind==='document')for(const reference of file.knowledgeKSBs||[])if(/^K\d+$/.test(reference))evidence.push({reference,method:'Supporting File'});
 return evidence;
}

/** Learner-specific projection of the authoritative course; the course itself is never changed. */
export const activeUnitIds=(course,learner)=>new Set(isKsbCourse(course)?[]:course.course?.mandatoryUnitIds?availableUnits(course,learner).map(unit=>unit.id):course.units.map(unit=>unit.id));
export const filterActiveMappings=(mappings,course,learner)=>mappings.filter(mapping=>activeUnitIds(course,learner).has(mapping.targetUnit));
export const filterAssessmentToActiveUnits=(assessment,course,learner)=>{
 if(isKsbCourse(course))return structuredClone(assessment);
 const active=activeUnitIds(course,learner),copy=structuredClone(assessment);
 for(const method of ['practical','knowledge'])copy.mappings[method]=(copy.mappings?.[method]||[]).filter(mapping=>active.has(mapping.targetUnit));
 return copy;
};

export function deriveKsbProgress(course,learner,assessments){
 const saved=assessments.filter(a=>a.learnerId===learner.id&&a.courseId===course.course.id),selected=new Set(saved.flatMap(a=>validKsbEvidence(a).map(x=>x.reference)));
 const group=collection=>({assessed:course[collection].filter(x=>selected.has(x.reference)).length,total:course[collection].length});
 const knowledge=group('knowledge'),skills=group('skills'),behaviours=group('behaviours');
 return{knowledge,skills,behaviours,overall:{assessed:knowledge.assessed+skills.assessed+behaviours.assessed,total:knowledge.total+skills.total+behaviours.total}};
}

export function deriveUnitProgress(course,learner,assessments){
 if(isKsbCourse(course))return[];
 const saved=assessments.filter(a=>a.learnerId===learner.id&&(!course.course.id||(a.courseId||DEFAULT_COURSE_ID)===course.course.id)),matrix=deriveMatrix(saved);
 return availableUnits(course,learner).map(unit=>{
  const criteria=flattenCourse({units:[unit]}),practical=criteria.filter(x=>x.ac.evidenceClass==='practical'),knowledge=criteria.filter(x=>x.ac.evidenceClass==='knowledge');
  const assessed=criteria.filter(x=>matrix.has(`${unit.id}.${x.ac.id}`));
  const assessedPractical=practical.filter(x=>matrix.has(`${unit.id}.${x.ac.id}`)).length;
  const assessedKnowledge=knowledge.filter(x=>matrix.has(`${unit.id}.${x.ac.id}`)).length;
  return {unit,assessed:assessed.length,total:criteria.length,percentage:criteria.length?Math.round(assessed.length/criteria.length*100):0,observed:saved.some(a=>a.primaryUnit===unit.id),practical:{assessed:assessedPractical,total:practical.length},knowledge:{assessed:assessedKnowledge,total:knowledge.length}};
 });
}
