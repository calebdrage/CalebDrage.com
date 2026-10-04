import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=new URL('../',import.meta.url);
const html=await readFile(new URL('dist/index.html',root),'utf8');
const content=JSON.parse(await readFile(new URL('content.json',root),'utf8'));
test('every internal navigation target exists exactly once',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),`Missing #${id}`);
  for(const [,id] of html.matchAll(/(?:for|aria-labelledby)="([^"]+)"/g))assert.ok(ids.includes(id),`Missing label target ${id}`);
});
test('all local media, script, stylesheet, download, and animation paths exist',async()=>{
  for(const [,path] of html.matchAll(/(?:src|href|data-animation|data-poster)="\.\/([^"]+)"/g))await access(new URL(`dist/${path}`,root));
  assert.ok(!html.includes('href="#resume"'));
  assert.ok(!html.includes('data:image'));
});
test('each project has a native detail view and honest source-link labeling',()=>{
  for(const project of content.projects)assert.ok(html.includes(`id="${project.id}-case"`));
  assert.ok(html.includes('Windows release'));
  assert.ok(!html.includes('Source code</a>'));
  assert.ok(html.includes('Actual task-detail screen from the coursework walkthrough.'));
});
test('build output excludes source, personal documents, credentials, and QA captures',async()=>{
  const files=[];const walk=async(dir)=>{for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path);else files.push(path);}};
  await walk(new URL('dist/',root).pathname.replace(/^\/(\w:)/,'$1'));
  assert.ok(files.every(path=>!/(?:\.env|\.qa|README|content\.json|original\.gif|\.swift|\.sql)/i.test(path)));
});
