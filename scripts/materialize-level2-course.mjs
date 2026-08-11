import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';

const source='level2-trowel-6570-04-FULL-course-data.json.gz.b64';
const target='level2-trowel-6570-04-FULL-course-data.json';
const encoded=(await readFile(source,'utf8')).trim();
const json=gunzipSync(Buffer.from(encoded,'base64')).toString('utf8');
JSON.parse(json);
await writeFile(target,json.endsWith('\n')?json:`${json}\n`,'utf8');
console.log(`Materialized ${target}`);
