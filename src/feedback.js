const tidy=value=>String(value??'').replace(/\s+/g,' ').trim();
const lowerLead=value=>{const text=tidy(value).replace(/[.;:,]+$/,'');return text?text[0].toLowerCase()+text.slice(1):''};
const meaning=items=>items.map(lowerLead).filter(Boolean).slice(0,2);

/** Deterministic, offline narrative assembled exclusively from recorded evidence. */
export function generateFeedback(assessment,learner,unit){
  const name=tidy(learner?.name)||'the learner', unitId=tidy(unit?.id||assessment.primaryUnit), title=tidy(unit?.title);
  const practical=meaning(assessment.selectedPracticalWording||[]), knowledge=meaning(assessment.selectedKnowledgeWording||[]);
  const notes=tidy(assessment.notes), discussion=tidy(assessment.discussionNotes);
  const accepted=[...(assessment.mappings?.practical||[]),...(assessment.mappings?.knowledge||[])].filter(m=>['automatic','confirmed'].includes(m.decision));
  const photos=(assessment.media||[]).filter(x=>x.kind==='photo').length, videos=(assessment.media||[]).filter(x=>x.kind==='video').length;
  const audio=(assessment.knowledgeEvidence||[]).filter(x=>x.kind==='audio').length, files=(assessment.knowledgeEvidence||[]).filter(x=>x.kind==='document').length;
  const sentences=[`I observed ${name} carrying out work associated with Unit ${unitId}${title?`, ${title}`:''}.`];
  if(practical.length)sentences.push(`The selected practical evidence showed how the learner addressed ${practical.join(' and ')}.`);
  if(notes)sentences.push(`During the activity, I recorded that ${lowerLead(notes)}.`);
  const media=[];if(photos)media.push(`${photos} ${photos===1?'photograph':'photographs'}`);if(videos)media.push(`${videos} ${videos===1?'video recording':'video recordings'}`);
  if(media.length)sentences.push(`${media.join(' and ')} ${media.length===1&&photos===1?'was':'were'} retained to support what I observed.`);
  if(assessment.hasDiscussion&&(knowledge.length||discussion||audio||files)){
    let pd=`During the professional discussion, ${name} had the opportunity to explain`;
    pd+=knowledge.length?` ${knowledge.join(' and ')}`:' the knowledge relevant to the selected criteria';
    pd+=discussion?`; my record notes that ${lowerLead(discussion)}`:'';sentences.push(pd+'.');
    const supporting=[];if(audio)supporting.push(`${audio} audio ${audio===1?'recording':'recordings'}`);if(files)supporting.push(`${files} supporting ${files===1?'file':'files'}`);
    if(supporting.length)sentences.push(`${supporting.join(' and ')} ${supporting.length===1?'forms':'form'} part of the discussion evidence.`);
  }
  if(accepted.length)sentences.push(`The accepted evidence also provides a clear audit trail for ${accepted.length} holistic ${accepted.length===1?'mapping':'mappings'} to the learner's active units.`);
  const further=/further evidence required/i.test(assessment.outcome||'');
  if(further)sentences.push('The evidence above demonstrates the recorded aspects of the activity, but does not yet support a competent outcome. Further evidence required: additional evidence is needed for the outstanding areas identified in this assessment before competence can be confirmed.');
  else if(assessment.outcome)sentences.push(`On the evidence recorded for the selected criteria, I was satisfied that the assessment outcome was ${tidy(assessment.outcome).toLowerCase()}. This judgement applies to this assessment only and does not claim completion of the whole unit or qualification.`);
  else sentences.push('I have not recorded a final assessment outcome, so this narrative should be reviewed when the assessment decision is made.');
  return sentences.join(' ');
}
