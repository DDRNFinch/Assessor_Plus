import {learnerCourseId} from './course.js';

export const VISIT_TYPES={review:{label:'Review',colour:'blue'},observation:{label:'Observation',colour:'red'},combined:{label:'Review + Observation',colour:'purple'},catchup:{label:'Catch-up Review',colour:'amber'}};
export const learnerInitials=name=>String(name||'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0].toUpperCase()).join('');
export const shortLearnerName=name=>{const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return parts.length>1?`${parts[0]} ${parts.at(-1)[0]}.`:parts[0]||''};
export const visitDateTime=visit=>`${visit?.date||''}T${visit?.time||'00:00'}`;
export const upcomingVisits=(visits,now=new Date())=>(Array.isArray(visits)?visits:[]).filter(v=>v&&VISIT_TYPES[v.type]&&v.date&&v.status!=='completed'&&visitDateTime(v)>=now.toISOString().slice(0,16)).sort((a,b)=>visitDateTime(a).localeCompare(visitDateTime(b))||String(a.id||'').localeCompare(String(b.id||'')));
export const visitsForLearner=(visits,learnerId)=>(Array.isArray(visits)?visits:[]).filter(v=>v?.learnerId===learnerId);
export const visitsForDate=(visits,date)=>(Array.isArray(visits)?visits:[]).filter(v=>v?.date===date);
export function workingWeek(date=new Date()){const day=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())),offset=(day.getUTCDay()+6)%7;day.setUTCDate(day.getUTCDate()-offset);return Array.from({length:5},(_,i)=>{const d=new Date(day);d.setUTCDate(day.getUTCDate()+i);return d.toISOString().slice(0,10)})}
export const visitsForWeek=(visits,date=new Date())=>{const dates=new Set(workingWeek(date));return (Array.isArray(visits)?visits:[]).filter(v=>dates.has(v?.date))};
export const latestCompletedReview=(reviews,learnerId)=>(Array.isArray(reviews)?reviews:[]).filter(r=>r?.learnerId===learnerId&&r.status==='Completed'&&r.reviewType!=='Catch-up Review').sort((a,b)=>String(b.reviewDate||'').localeCompare(String(a.reviewDate||''))||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0]||null;
export const activeLearners=learners=>(Array.isArray(learners)?learners:[]).filter(l=>l&&l.status!=='withdrawn');
export function courseOverview(learners,courses){return [...activeLearners(learners).reduce((map,l)=>{const courseId=learnerCourseId(l);return map.set(courseId,(map.get(courseId)||0)+1)},new Map())].map(([courseId,count])=>({courseId,title:courses.get(courseId)?.course?.title||String(courseId||'Unknown course'),count})).sort((a,b)=>String(a.title).localeCompare(String(b.title)))}
export const nextVisit=(visits,now=new Date())=>upcomingVisits(visits,now)[0]||null;
export const googleMapsUrl=location=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location||'')}`;
