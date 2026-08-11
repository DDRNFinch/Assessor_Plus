import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';

const target='level2-trowel-6570-04-FULL-course-data.json';
const parts=Array.from({length:7},(_,i)=>`level2-source-parts/part${String(i+1).padStart(2,'0')}.b64`);
const encoded=(await Promise.all(parts.map(path=>readFile(path,'utf8')))).map(text=>text.trim()).join('');
if (!/^[A-Za-z0-9+/=]+$/.test(encoded)) throw new Error('Level 2 source contains invalid Base64 characters');
const json=gunzipSync(Buffer.from(encoded,'base64')).toString('utf8');
const parsed=JSON.parse(json);
if (!parsed?.course || !Array.isArray(parsed?.units)) throw new Error('Level 2 source did not materialize into the expected course JSON structure');
await writeFile(target,json.endsWith('\n')?json:`${json}\n`,'utf8');
console.log(`Materialized ${target} from ${parts.length} source parts (${parsed.units.length} units)`);
