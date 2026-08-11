import { readFile } from 'node:fs/promises';
import { validateCourse } from '../src/course.js';
const course=JSON.parse(await readFile(new URL('../level3-trowel-6570-05-FULL-course-data.json',import.meta.url)));
const result=validateCourse(course);
console.log(JSON.stringify(result,null,2));
if(result.errors.length) process.exitCode=1;
