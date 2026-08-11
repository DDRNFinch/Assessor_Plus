/** Additive V0.3 record helpers. They deliberately tolerate legacy V0.1/V0.2 records. */
export function normaliseAssessment(a){
  a.media??=[];a.knowledgeEvidence??=[];a.theoryKnowledge??={professionalDiscussion:[],supportingFiles:[]};a.theoryKnowledge.professionalDiscussion??=[];a.theoryKnowledge.supportingFiles??=[];a.assessor??='';
  a.signatureSnapshot??=null;a.signatureDate??='';
  return a;
}
export function nextEvidenceReference(assessment,kind){
  const prefix={photo:'P',video:'V',audio:'A',document:'DOC'}[kind];
  const items=[...(assessment.media||[]),...(assessment.knowledgeEvidence||[])];
  const used=items.map(x=>x.reference).filter(Boolean).map(ref=>Number(ref.match(new RegExp(`-${prefix}(\\d+)$`))?.[1])||0);
  return `${assessment.id}-${prefix}${String(Math.max(0,...used)+1).padStart(2,'0')}`;
}
export function applySignatureSnapshot(assessment,profile,now=new Date()){
  if(!profile?.signatureDataUrl)return false;
  assessment.assessor=profile.name||assessment.assessor||'';
  assessment.signatureSnapshot={dataUrl:String(profile.signatureDataUrl),mimeType:profile.signatureType||'image/png',capturedAt:now.toISOString(),assessorName:profile.name||assessment.assessor||'',providerName:profile.providerName||''};
  assessment.signatureDate=now.toISOString().slice(0,10);assessment.signature='';return true;
}
export function invalidateSignature(a){a.signatureSnapshot=null;a.signature='';a.signatureDate='';}
export function materialAssessmentChanged(before,after){
  const project=a=>{const copy=structuredClone(a);delete copy.signature;delete copy.signatureSnapshot;delete copy.signatureDate;delete copy.updatedAt;for(const item of [...(copy.media||[]),...(copy.knowledgeEvidence||[])])delete item.url;return copy};
  return JSON.stringify(project(before))!==JSON.stringify(project(after));
}
