import {isKsbCourse,pathwayForLearner} from './course.js';
import {deriveKsbProgress,deriveUnitProgress} from './progress.js';

export const REVIEW_OWNERS=['Apprentice','Employer','Assessor/Provider'];
export const REVIEW_TARGET_STATUSES=['Open','Completed','Carried forward'];
export const reviewReference=reviews=>`REV${String(Math.max(0,...reviews.map(r=>Number(String(r.id).replace(/\D/g,''))||0))+1).padStart(4,'0')}`;
export const reviewsForLearner=(reviews,learnerId)=>reviews.filter(r=>r.learnerId===learnerId).sort((a,b)=>b.reviewDate.localeCompare(a.reviewDate)||b.id.localeCompare(a.id));
export const unresolvedTargets=reviews=>reviews.flatMap(r=>(r.targets||[]).filter(t=>t.status!=='Completed').map(t=>({...t,sourceReviewId:r.id,status:'Carried forward'})));
export function progressSnapshot(course,learner,assessments){
 if(isKsbCourse(course))return{type:'KSB',...structuredClone(deriveKsbProgress(course,learner,assessments))};
 const units=deriveUnitProgress(course,learner,assessments).map(p=>({id:p.unit.id,title:p.unit.title,assessed:p.assessed,total:p.total,percentage:p.percentage}));
 const assessed=units.reduce((n,u)=>n+u.assessed,0),total=units.reduce((n,u)=>n+u.total,0);
 return{type:'NVQ',units,overall:{assessed,total,percentage:total?Math.round(assessed/total*100):0}};
}
export function createReview({reviews,learner,course,assessments,profile,date=new Date().toISOString().slice(0,10)}){
 const previous=reviewsForLearner(reviews,learner.id)[0],ksb=isKsbCourse(course),pathway=pathwayForLearner(course,learner);
 return{id:reviewReference(reviews),learnerId:learner.id,courseId:course.course.id,pathwayId:learner.pathwayId||'',reviewType:ksb?'Apprenticeship Progress Review':'Qualification Progress Review',reviewDate:date,previousReviewDate:previous?.reviewDate||'',nextReviewDate:'',snapshot:progressSnapshot(course,learner,assessments),identitySnapshot:{learnerName:learner.name,qualification:course.course.title,pathway:pathway?.title||'',employer:learner.employer||'',assessor:profile.name||'',provider:profile.providerName||''},progress:{achievements:'',newLearning:'',development:''},apprentice:{comments:'',concern:'No concerns',concernNotes:''},employer:{rating:'On track',comments:'',representativeName:'',representativeRole:''},assessor:{judgement:'On track',comments:''},otj:ksb?{status:'',planned:'Yes',relevant:'Yes',comments:'',concernNotes:''}:null,englishMaths:ksb?{english:'Not required / already achieved',englishNotes:'',maths:'Not required / already achieved',mathsNotes:''}:null,mandatoryQualification:null,wellbeing:{support:'No',safeguarding:'No',notes:''},readiness:{label:ksb?'EPA / Completion Readiness':'Qualification completion readiness',status:ksb?'Not yet ready':'Not yet ready',notes:''},targets:previous?unresolvedTargets([previous]):[],trainingPlan:{change:'No',notes:''},signatures:{apprentice:null,employer:null,assessor:null},status:'Draft',createdAt:new Date().toISOString()};
}
export const nextReviewWarning=(review)=>{if(!review.reviewDate||!review.nextReviewDate)return false;const d=new Date(`${review.reviewDate}T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()+6);return new Date(`${review.nextReviewDate}T00:00:00Z`)>d};
export function validateReview(review,{apprenticeship=true}={}){const errors=[];if(!review.reviewDate)errors.push('Review date is required.');if(apprenticeship&&!review.nextReviewDate)errors.push('Next review date is required for an active apprenticeship learner.');if(nextReviewWarning(review)&&!review.nextReviewWarningAcknowledged)errors.push('Acknowledge that the next review is more than 6 months away.');for(const [i,t] of (review.targets||[]).entries())if(!t.action||!t.owner||!t.targetDate||!t.status)errors.push(`Target ${i+1} is incomplete.`);return errors}
export const signatureSnapshot=(name,role,profile={})=>({name,role,dataUrl:profile.signatureDataUrl||'',type:profile.signatureType||'',signedAt:new Date().toISOString()});
