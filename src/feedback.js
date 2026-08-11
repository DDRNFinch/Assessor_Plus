const tidy=value=>String(value??'').replace(/\s+/g,' ').trim();
const list=(items,limit=3)=>items.slice(0,limit).map(tidy).filter(Boolean).join('; ');

/** Deterministic, offline feedback assembled only from fields in the assessment. */
export function generateFeedback(assessment,learner,unit){
  const practical=assessment.selected?.practical||[], knowledge=assessment.selected?.knowledge||[];
  const practicalText=list(assessment.selectedPracticalWording||[]);
  const knowledgeText=list(assessment.selectedKnowledgeWording||[]);
  const mapped=[...(assessment.mappings?.practical||[]),...(assessment.mappings?.knowledge||[])].filter(m=>m.decision==='automatic'||m.decision==='confirmed').length;
  const further=/further evidence required/i.test(assessment.outcome||'');
  const parts=[`${tidy(learner?.name)||'The learner'} was assessed through a practical observation for Unit ${tidy(unit?.id||assessment.primaryUnit)}${unit?.title?`, ${tidy(unit.title)}`:''}.`];
  if(practical.length)parts.push(`The evidence recorded relates specifically to ${practical.length} selected practical assessment ${practical.length===1?'criterion':'criteria'}${practicalText?`: ${practicalText}`:'.'}`);
  if(tidy(assessment.notes))parts.push(`The assessor recorded the following observation evidence: ${tidy(assessment.notes)}`);
  if(mapped)parts.push(`The selected evidence also supports ${mapped} legitimate holistic ${mapped===1?'mapping':'mappings'} elsewhere in the qualification, through automatic or assessor-confirmed matching.`);
  if(assessment.hasDiscussion){
    if(knowledge.length)parts.push(`During the professional discussion, ${tidy(learner?.name)||'the learner'} provided evidence against ${knowledge.length} selected knowledge assessment ${knowledge.length===1?'criterion':'criteria'}${knowledgeText?`: ${knowledgeText}`:'.'}`);
    if(tidy(assessment.discussionNotes))parts.push(`The discussion record states: ${tidy(assessment.discussionNotes)}`);
  }
  if(further)parts.push('The assessment decision is Further evidence required. The evidence recorded is retained against the criteria identified, but it does not yet support a competent outcome for this assessment. Further evidence is required against the outstanding or identified areas recorded by the assessor.');
  else if(assessment.outcome)parts.push(`The recorded assessment decision is ${tidy(assessment.outcome)}. This conclusion applies only to the assessment criteria selected and evidenced within this assessment; it does not indicate completion of the whole unit or qualification.`);
  else parts.push('No final assessment decision has yet been recorded. This summary is limited to the selected evidence and should be reviewed when the assessor records the outcome.');
  return parts.join('\n\n');
}
