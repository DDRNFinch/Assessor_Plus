import {isCatchUpReview,progressMetrics,progressValue,reviewsForLearner} from './reviews.js';

/** The course card is deliberately a review record projection, never an evidence projection. */
export function latestFullReviewProgress(reviews,learner,course,isApprenticeship){
 const review=reviewsForLearner(reviews,learner.id).find(row=>row.status==='Completed'&&!isCatchUpReview(row)&&row.courseId===course.course.id&&(row.pathwayId||'')===(learner.pathwayId||'')&&row.apprenticeProgress?.current);
 if(!review)return null;
 const values=review.apprenticeProgress.current,names=isApprenticeship?['KSBs','OTJ','Time','EPA']:['LOs','GLH','Time'],metrics=progressMetrics(isApprenticeship).map(([key],index)=>({key,label:names[index],value:progressValue(values[key]),colour:['green','blue','orange','purple'][index]}));
 return metrics.every(metric=>metric.value===null)?null:{review,metrics};
}

const visitSort=(a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id));
/** Build actual contact history from saved records. Planned availability is intentionally excluded. */
export function actualVisitHistory({learnerId,reviews=[],assessments=[],visits=[]}){
 const rows=[];
 for(const review of reviews)if(review.learnerId===learnerId&&review.status==='Completed'&&review.reviewDate)rows.push({id:`review:${review.id}`,date:review.reviewDate,type:isCatchUpReview(review)?'catchup':'review',reviewId:review.id});
 for(const assessment of assessments)if(assessment.learnerId===learnerId&&assessment.date)rows.push({id:`assessment:${assessment.id}`,date:assessment.date,type:'observation',assessmentId:assessment.id});
 const byDate=new Map();
 for(const row of rows){const previous=byDate.get(row.date);if(previous&&previous.type!==row.type&&[previous.type,row.type].every(type=>['review','observation'].includes(type))){byDate.set(row.date,{id:`combined:${previous.id}:${row.id}`,date:row.date,type:'combined',reviewId:previous.reviewId||row.reviewId,assessmentId:previous.assessmentId||row.assessmentId});continue}if(!previous)byDate.set(row.date,row);else byDate.set(`${row.date}:${row.id}`,row)}
 // Preserve explicit completed combined visits where legacy records carry both links.
 for(const visit of visits)if(visit.learnerId===learnerId&&visit.type==='combined'&&visit.status==='completed'&&visit.date&&(visit.reviewId||visit.assessmentId))byDate.set(visit.date,{...visit,id:`visit:${visit.id}`});
 return [...byDate.values()].sort(visitSort);
}

export const nextPlannedVisit=(visits,learnerId,now=new Date())=>visits.filter(v=>v.learnerId===learnerId&&['review','observation','combined','catchup'].includes(v.type)&&v.status!=='completed'&&v.date&&`${v.date}T${v.time||'00:00'}`>=now.toISOString().slice(0,16)).sort((a,b)=>`${a.date}T${a.time||''}`.localeCompare(`${b.date}T${b.time||''}`))[0]||null;
