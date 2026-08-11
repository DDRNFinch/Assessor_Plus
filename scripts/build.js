import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist/src',{recursive:true});
for(const f of ['index.html','styles.css','manifest.webmanifest','sw.js','level3-trowel-6570-05-FULL-course-data.json','assessor-plus-192.png','assessor-plus-512.png','assessor-plus-maskable-192.png','assessor-plus-maskable-512.png']) await cp(f,`dist/${f}`);
await cp('src','dist/src',{recursive:true});
console.log('Built Assessor+ V0.6.2 to dist/');
