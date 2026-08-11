import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist/src',{recursive:true}); await mkdir('dist/icons',{recursive:true});
for(const f of ['index.html','styles.css','manifest.webmanifest','sw.js','level3-trowel-6570-05-FULL-course-data.json']) await cp(f,`dist/${f}`);
await cp('src','dist/src',{recursive:true});
await cp('icons','dist/icons',{recursive:true});
console.log('Built Assessor+ V0.2 to dist/');
