import test from 'node:test';
import assert from 'node:assert/strict';
import {overlaps,approvedConflicts,staysOnDate,validStayRange,parseUsernames,compareUsernameSets,toCsv} from '../public/demo-logic.mjs';

const stay=(id,from,to,status='approved')=>({id,arrival_date:from,departure_date:to,status});
test('Boca warning includes shared arrival/departure boundaries',()=>{
  const approved=stay('approved','2026-11-06','2026-11-10');
  assert.equal(overlaps(stay('request','2026-11-10','2026-11-12'),approved),true);
  assert.equal(overlaps(stay('request','2026-11-11','2026-11-12'),approved),false);
  assert.equal(overlaps(stay('request','2026-11-01','2026-11-06'),approved),true);
});
test('only other approved stays are conflicts, and inactive statuses leave the calendar',()=>{
  const request=stay('request','2026-11-09','2026-11-12','pending');
  const approved=stay('approved','2026-11-06','2026-11-10');
  const denied=stay('denied','2026-11-09','2026-11-12','denied');
  assert.deepEqual(approvedConflicts(request,[approved,denied,{...request,status:'approved'}]),[approved]);
  assert.deepEqual(staysOnDate('2026-11-10',[approved,request,denied]),[approved,request]);
  assert.deepEqual(staysOnDate('2026-11-13',[approved,request,denied]),[]);
});
test('the demo rejects impossible or zero-length dates',()=>{
  assert.equal(validStayRange('2026-02-30','2026-03-02'),false);
  assert.equal(validStayRange('2026-11-09','2026-11-09'),false);
  assert.equal(validStayRange('2026-11-12','2026-11-09'),false);
  assert.equal(validStayRange('2028-02-29','2028-03-01'),true);
  assert.equal(validStayRange('','2026-11-12'),false);
});
test('Instagram comparison deduplicates and returns sorted following-minus-followers',()=>{
  const followers=parseUsernames('sample_avery\r\nsample_morgan\n sample_avery ');
  const following=parseUsernames('sample_riley\nsample_morgan\nsample_casey\nsample_casey');
  assert.equal(followers.size,2);
  assert.deepEqual(compareUsernameSets(followers,following),['sample_casey','sample_riley']);
  assert.deepEqual(compareUsernameSets(followers,followers),[]);
  assert.deepEqual(compareUsernameSets(new Set(),new Set()),[]);
});
test('CSV uses a header, quoted values, and quote escaping; demo input rejects formulas',()=>{
  assert.equal(toCsv(['sample_casey','sample_riley']),'username\n"sample_casey"\n"sample_riley"');
  assert.equal(toCsv(['a"b']),'username\n"a""b"');
  assert.equal(toCsv([]),'username\n');
  assert.throws(()=>parseUsernames('=HYPERLINK("https://example.com")'));
  assert.throws(()=>parseUsernames('a'.repeat(31)));
});
