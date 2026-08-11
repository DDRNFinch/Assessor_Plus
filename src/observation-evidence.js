import {deriveMatrix} from './matrix.js';
import {activeUnitIds,filterAssessmentToActiveUnits,validKsbEvidence} from './progress.js';
import {DEFAULT_COURSE_ID} from './course.js';

export function previousKsbEvidence(course,learner,assessments,currentAssessmentId=''){
 const map=new Map();for(const a of assessments.filter(a=>a.learnerId===learner.id&&a.courseId===course.course.id&&(!learner.pathwayId||a.pathwayId===learner.pathwayId)&&a.id!==currentAssessmentId))for(const item of validKsbEvidence(a)){if(!map.has(item.reference))map.set(item.reference,[]);map.get(item.reference).push({assessmentId:a.id,method:item.method,date:a.date})}return map;
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
