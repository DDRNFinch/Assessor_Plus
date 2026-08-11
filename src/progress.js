import {availableUnits,flattenCourse} from './course.js';
import {deriveMatrix} from './matrix.js';

/** Learner-specific projection of the authoritative course; the course itself is never changed. */
export const activeUnitIds=(course,learner)=>new Set(course.course?.mandatoryUnitIds?availableUnits(course,learner).map(unit=>unit.id):course.units.map(unit=>unit.id));
export const filterActiveMappings=(mappings,course,learner)=>mappings.filter(mapping=>activeUnitIds(course,learner).has(mapping.targetUnit));
export const filterAssessmentToActiveUnits=(assessment,course,learner)=>{
 const active=activeUnitIds(course,learner),copy=structuredClone(assessment);
 for(const method of ['practical','knowledge'])copy.mappings[method]=(copy.mappings?.[method]||[]).filter(mapping=>active.has(mapping.targetUnit));
 return copy;
};

export function deriveUnitProgress(course,learner,assessments){
 const saved=assessments.filter(a=>a.learnerId===learner.id),matrix=deriveMatrix(saved);
 return availableUnits(course,learner).map(unit=>{
  const criteria=flattenCourse({units:[unit]}),practical=criteria.filter(x=>x.ac.evidenceClass==='practical'),knowledge=criteria.filter(x=>x.ac.evidenceClass==='knowledge');
  const assessed=criteria.filter(x=>matrix.has(`${unit.id}.${x.ac.id}`));
  const assessedPractical=practical.filter(x=>matrix.has(`${unit.id}.${x.ac.id}`)).length;
  const assessedKnowledge=knowledge.filter(x=>matrix.has(`${unit.id}.${x.ac.id}`)).length;
  return {unit,assessed:assessed.length,total:criteria.length,percentage:criteria.length?Math.round(assessed.length/criteria.length*100):0,observed:saved.some(a=>a.primaryUnit===unit.id),practical:{assessed:assessedPractical,total:practical.length},knowledge:{assessed:assessedKnowledge,total:knowledge.length}};
 });
}
