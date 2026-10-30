import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFrameHeaders} from '../scripts/verify-blog.mjs';

const parent='https://blog.koomean.com';
const isolated=`frame-ancestors ${parent}; sandbox allow-scripts allow-popups`;
function headers(csp,xfo){
 const result=new Headers();
 for(const policy of [].concat(csp||[]))result.append('Content-Security-Policy',policy);
 if(xfo)result.set('X-Frame-Options',xfo);
 return result;
}
const sandbox={sandbox:true};

test('root keeps its existing anti-framing protections',()=>{
 assert.doesNotThrow(()=>verifyFrameHeaders(headers("frame-ancestors 'none'",'DENY')));
 assert.throws(()=>verifyFrameHeaders(headers(`frame-ancestors ${parent}`,'SAMEORIGIN')));
 assert.throws(()=>verifyFrameHeaders(headers("default-src 'self'",'DENY')));
 assert.throws(()=>verifyFrameHeaders(headers("frame-ancestors 'none'")));
});

test('cross-origin API loader permits only the Blog and enforces an opaque response sandbox',()=>{
 assert.doesNotThrow(()=>verifyFrameHeaders(headers(isolated),sandbox));
 assert.doesNotThrow(()=>verifyFrameHeaders(headers(["default-src 'self'",isolated]),sandbox));
});

test('a permissive added CSP cannot hide the original blocking CSP',()=>{
 for(const csp of [
  ["frame-ancestors 'none'",isolated],
  [isolated,"frame-ancestors 'none'"],
  [isolated,"frame-ancestors https://other.example"],
  [isolated,"frame-ancestors"],
 ])assert.throws(()=>verifyFrameHeaders(headers(csp),sandbox));
});

test('sandbox rejects missing, broad or contradictory policies',()=>{
 for(const csp of [undefined,"default-src 'self'",'frame-ancestors *',`frame-ancestors ${parent} https://other.example`,"frame-ancestors 'self'",`frame-ancestors 'none' ${parent}`]){
  assert.throws(()=>verifyFrameHeaders(headers(csp),sandbox));
 }
 for(const xfo of ['DENY','SAMEORIGIN','DENY, SAMEORIGIN','ALLOW-FROM https://other.example']){
  assert.throws(()=>verifyFrameHeaders(headers(isolated,xfo),sandbox));
 }
});

test('API loader rejects absent sandbox, same-origin privilege and intersecting script blocks',()=>{
 for(const csp of [
  `frame-ancestors ${parent}`,
  `frame-ancestors ${parent}; sandbox allow-scripts allow-same-origin`,
  `frame-ancestors ${parent}; sandbox allow-popups`,
  `frame-ancestors ${parent}; sandbox allow-scripts allow-top-navigation`,
  [isolated,'sandbox'],
 ])assert.throws(()=>verifyFrameHeaders(headers(csp),sandbox));
});

test('only the first occurrence of a directive in one CSP policy is effective',()=>{
 assert.throws(()=>verifyFrameHeaders(headers(`frame-ancestors 'none'; ${isolated}`),sandbox));
 assert.doesNotThrow(()=>verifyFrameHeaders(headers(`${isolated}; frame-ancestors 'none'`),sandbox));
});
