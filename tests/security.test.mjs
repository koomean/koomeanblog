import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {verifyLocal,verifyBlog} from '../scripts/verify-blog.mjs';
test('release stays scoped to Blog and has a strict script policy',verifyLocal);
test('guard rejects another frontend and executable inline handlers',()=>{
 const h=fs.readFileSync('index.html','utf8');assert.throws(()=>verifyBlog(h+'<div id="search-input"></div>'));assert.throws(()=>verifyBlog(h+'<button onclick="alert(1)">'));
});
test('sandbox keeps article scripts separate from Blog credentials',()=>{
 const s=fs.readFileSync('src/index.html','utf8');assert.ok(s.includes("'sandbox','allow-scripts allow-popups'"));assert.ok(!s.includes('idToken: S.idToken'));assert.ok(!/localStorage\.setItem\(SESS_KEY/.test(s));assert.ok(!s.includes('srcdoc='));
 const sandbox=fs.readFileSync('article-sandbox.html','utf8');assert.ok(sandbox.includes("event.origin!=='https://blog.koomean.com'"));assert.ok(sandbox.includes('event.source!==parent'));
});
