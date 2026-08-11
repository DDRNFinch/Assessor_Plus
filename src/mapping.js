import {flattenCourse} from './course.js';
const stop=new Set('a an and the of to in on for from with by at as is are be been being their this that relevant particular given workplace work activity activities information requirements accordance methods method types type how why when where what which'.split(' '));
const context=new Set('masonry cladding structure structures occupation occupational construction component components'.split(' '));
function stem(w){if(w.length>5&&w.endsWith('ies'))return w.slice(0,-3)+'y';if(w.length>4&&w.endsWith('s'))return w.slice(0,-1);return w;}
export function tokens(text){return text.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).map(stem).filter(x=>x&&!stop.has(x)&&!context.has(x)&&!/^[a-z]$/.test(x));}
export function similarity(a,b){
 const A=new Set(tokens(a.wording||a)),B=new Set(tokens(b.wording||b)); if(!A.size||!B.size)return 0;
 const common=[...A].filter(x=>B.has(x)).length, union=new Set([...A,...B]).size;
 const j=common/union,contain=common/Math.min(A.size,B.size),verb=(a.operativeVerb&&b.operativeVerb&&stem(a.operativeVerb)===stem(b.operativeVerb))?1:0;
 if(common<3)return Math.min(.39,j);
 return Math.min(1,(j*.65)+(contain*.25)+(verb*.1));
}
export function compareCriteria(source,target){if(source.evidenceClass!==target.evidenceClass)return null;const score=similarity(source,target);if(score<.4)return null;return {similarity:Number(score.toFixed(4)),mappingType:score>=.7?'automatic':'confirm'};}
export function generateMappings(course){const rows=flattenCourse(course),out=[];for(const s of rows)for(const t of rows){if(s.unit.id===t.unit.id)continue;const m=compareCriteria(s.ac,t.ac);if(m)out.push({sourceUnit:s.unit.id,sourceAC:s.ac.id,targetUnit:t.unit.id,targetAC:t.ac.id,evidenceClass:s.ac.evidenceClass,...m});}return out;}
export function mappingsFor(table,unit,ac){return table.filter(m=>m.sourceUnit===unit&&m.sourceAC===ac);}
