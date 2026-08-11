import {deriveMatrix} from './matrix.js';
import {activeUnitIds,filterAssessmentToActiveUnits} from './progress.js';
import {DEFAULT_COURSE_ID} from './course.js';

export function previousKsbEvidence(course,learner,assessments,currentAssessmentId=''){
 const map=new Map();for(const a of assessments.filter(a=>a.learnerId===learner.id&&a.courseId===course.course.id&&a.id!==currentAssessmentId))for(const reference of a.selectedKSBs||[]){if(!map.has(reference))map.set(reference,[]);map.get(reference).push({assessmentId:a.id,method:'Holistic Observation',date:a.date})}return map;
}

/**
 * Project the existing authoritative Evidence Matrix onto the learner's active
 * qualification. The current observation is excluded because this is guidance
 * about evidence saved before the observation being edited.
 */
export function previousEvidenceMatrix(course,learner,assessments,currentAssessmentId=''){
 const active=activeUnitIds(course,learner);
 const saved=assessments
  .filter(a=>a.learnerId===learner.id&&a.id!==currentAssessmentId&&(!course.course.id||(a.courseId||DEFAULT_COURSE_ID)===course.course.id)&&active.has(a.primaryUnit))
  .map(a=>filterAssessmentToActiveUnits(a,course,learner));
 return deriveMatrix(saved);
}

export const previousEvidenceFor=(matrix,unitId,acId)=>matrix.get(`${unitId}.${acId}`)||[];
