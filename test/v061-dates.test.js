import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {formatUKDate,parseUKDate,UK_DATE_INPUT_ATTRIBUTES,UK_DATE_VALIDATION_MESSAGE} from '../src/dates.js';

test('New Observation UK input accepts and persists strict calendar dates',()=>{
  assert.equal(parseUKDate('11-08-2026'),'2026-08-11');
  assert.equal(parseUKDate('01-01-2026'),'2026-01-01');
  assert.equal(parseUKDate('29-02-2028'),'2028-02-29');
});

test('UK date input rejects ISO, alternate separators and impossible dates',()=>{
  for(const value of ['2026-08-11','11/08/2026','29-02-2027','31-02-2026','32-01-2026'])assert.equal(parseUKDate(value),'',value);
  assert.equal(UK_DATE_VALIDATION_MESSAGE,'Enter a valid date in DD-MM-YYYY format.');
});

test('shared date input HTML is text based and has no conflicting native constraints',async()=>{
  assert.match(UK_DATE_INPUT_ATTRIBUTES,/type="text"/);
  assert.match(UK_DATE_INPUT_ATTRIBUTES,/inputmode="numeric"/);
  assert.doesNotMatch(UK_DATE_INPUT_ATTRIBUTES,/pattern|type="date"|\bmin=|\bmax=/);
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/pattern=["'][^"']*(?:d\{2\}|\\d\{2\})/);
  assert.doesNotMatch(app,/type=["']?date\b/);
  for(const field of ['input name=date ${UK_DATE_INPUT_ATTRIBUTES}','input id=date ${UK_DATE_INPUT_ATTRIBUTES}','input name=expiryDate ${UK_DATE_INPUT_ATTRIBUTES}'])assert.ok(app.includes(field),field);
});

test('saved ISO dates display in UK format without changing existing records',()=>{
  const existing={id:'OBS-0001',date:'2026-08-11',signatureDate:'2026-08-11'};
  const before=structuredClone(existing);
  assert.equal(formatUKDate(existing.date),'11-08-2026');
  assert.equal(formatUKDate(existing.signatureDate),'11-08-2026');
  assert.deepEqual(existing,before);
});
