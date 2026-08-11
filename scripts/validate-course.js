import { readFile } from 'node:fs/promises';
import { validateCourse } from '../src/course.js';
for(const file of ['level2-trowel-6570-04-FULL-course-data.json','level3-trowel-6570-05-FULL-course-data.json','bricklayer-st0095-v1.2-course-data.json','carpentry-joinery-st0264-v1.4-course-data.json','property-maintenance-operative-st0171-v1.1-course-data.json']){
 const course=JSON.parse(await readFile(new URL(`../${file}`,import.meta.url)));
 const result=validateCourse(course);
 console.log(JSON.stringify({file,...result},null,2));
 if(result.errors.length)process.exitCode=1;
}
