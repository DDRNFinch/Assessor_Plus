import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist/src',{recursive:true});
for(const f of ['index.html','styles.css','manifest.webmanifest','sw.js','level2-trowel-6570-04-FULL-course-data.json','level3-trowel-6570-05-FULL-course-data.json','bricklayer-st0095-v1.2-course-data.json','carpentry-joinery-st0264-v1.4-course-data.json','property-maintenance-operative-st0171-v1.1-course-data.json','assessor-plus-192.png','assessor-plus-512.png','assessor-plus-maskable-192.png','assessor-plus-maskable-512.png']) await cp(f,`dist/${f}`);
await cp('src','dist/src',{recursive:true});
console.log('Built Assessor+ V0.7.9 to dist/');
