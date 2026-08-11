import {deriveMatrix} from './matrix.js';
import {activeUnitIds,filterAssessmentToActiveUnits} from './progress.js';

/**
 * Project the existing authoritative Evidence Matrix onto the learner's active
 * qualification. The current observation is excluded because this is guidance
 * about evidence saved before the observation being edited.
 */
export function previousEvidenceMatrix(course,learner,assessments,currentAssessmentId=''){
 const active=activeUnitIds(course,learner);
 const saved=assessments
  .filter(a=>a.learnerId===learner.id&&a.id!==currentAssessmentId&&active.has(a.primaryUnit))
  .map(a=>filterAssessmentToActiveUnits(a,course,learner));
 return deriveMatrix(saved);
}

export const previousEvidenceFor=(matrix,unitId,acId)=>matrix.get(`${unitId}.${acId}`)||[];
