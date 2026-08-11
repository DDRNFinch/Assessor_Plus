/** Presentation-only comparison. Mapping scores and decisions remain authoritative elsewhere. */
const words=text=>[...text.matchAll(/[\p{L}\p{N}]+/gu)].map(match=>match[0].toLocaleLowerCase('en-GB'));

function availableMatches(text,otherText){
 const remaining=new Map();
 for(const word of words(otherText))remaining.set(word,(remaining.get(word)||0)+1);
 return [...text.matchAll(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu)].map(match=>{
  const text=match[0],word=/^[\p{L}\p{N}]+$/u.test(text),key=word?text.toLocaleLowerCase('en-GB'):'';
  const matching=word&&(remaining.get(key)||0)>0;
  if(matching)remaining.set(key,remaining.get(key)-1);
  return {text,kind:word?(matching?'matching':'different'):'punctuation'};
 });
}

export function compareWordings(primary,possible){
 return {primary:availableMatches(primary,possible),possible:availableMatches(possible,primary)};
}
