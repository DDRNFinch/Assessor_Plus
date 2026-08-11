// Presentation-only comparison. Mapping scores and decisions remain in mapping.js.
const wordKey=token=>token.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]/gu,'');

export function compareWording(primary,possible){
  const left=String(primary??'').trim().split(/\s+/).filter(Boolean);
  const right=String(possible??'').trim().split(/\s+/).filter(Boolean);
  const counts=tokens=>tokens.reduce((out,token)=>{const key=wordKey(token);if(key)out.set(key,(out.get(key)||0)+1);return out},new Map());
  const leftCounts=counts(left),rightCounts=counts(right);
  const mark=(tokens,otherCounts)=>{const used=new Map();return tokens.map(text=>{const key=wordKey(text),occurrence=(used.get(key)||0)+1;used.set(key,occurrence);return {text,state:key&&occurrence<=(otherCounts.get(key)||0)?'match':'difference'}})};
  return {primary:mark(left,rightCounts),possible:mark(right,leftCounts)};
}
