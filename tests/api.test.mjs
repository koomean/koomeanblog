import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync((process.env.BLOG_SOURCE_ROOT||'.')+'/src/index.html','utf8');
function section(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
for(const [name,url,expected] of [['Blog API','https://koomean-proxy.meanchannel52.workers.dev',1],['Blog API query','https://koomean-proxy.meanchannel52.workers.dev?action=all',1],['Microlink preview','https://api.microlink.io/?url=https://example.org',0],['Dub preview','https://api.dub.co/metatags?url=https://example.org',0]]){
 test(name+' rate limits affect only that service',async()=>{
  let cooldown=0;
  const ctx=vm.createContext({API_URL:'https://koomean-proxy.meanchannel52.workers.dev',TIMEOUT:1000,URL,AbortController,setTimeout,clearTimeout,noteRateLimited:()=>cooldown++,fetch:async()=>({status:429,headers:{get:()=> '60'}})});
  vm.runInContext(section('async function apiFetch(','function apiUrl('),ctx);
  await ctx.apiFetch(url);assert.equal(cooldown,expected);
 });
}
function harness(){
 let requestCount=0,renderCount=0;const pending=[];
 const ctx=vm.createContext({D:()=>({innerHTML:''}),apiRead:()=>{requestCount++;return new Promise((resolve,reject)=>pending.push({resolve,reject}))},renderArticlesList:()=>renderCount++,openPendingArticle(){},noteRateLimited(){},Error});
 vm.runInContext('let authEpoch=0,articleLoadId=0;const S={articlesView:true,articles:[]};'+section('let articleLoadTask=null;','// เปิดบทความจากลิงก์แชร์'),ctx);
 return{ctx,pending,count:()=>requestCount,renders:()=>renderCount,start:()=>vm.runInContext('loadArticles()',ctx),switchAuth:()=>vm.runInContext('authEpoch++',ctx),respond:i=>pending[i].resolve({ok:true,json:async()=>({articles:[{rowIdx:i+1}]})})};
}
test('same-account concurrent article lists share one request and explicit later refresh stays fresh',async()=>{
 const h=harness(),one=h.start(),two=h.start();assert.equal(h.count(),1);h.respond(0);await Promise.all([one,two]);assert.equal(h.renders(),1);
 const next=h.start();assert.equal(h.count(),2);h.respond(1);await next;assert.equal(h.renders(),2);
});
test('a changed identity never reuses the prior account article list',async()=>{
 const h=harness(),old=h.start();h.switchAuth();const current=h.start();assert.equal(h.count(),2);h.respond(1);await current;h.respond(0);await old;assert.equal(h.renders(),1);assert.equal(vm.runInContext('S.articles[0].rowIdx',h.ctx),2);
});
test('late list failures cannot clear the new account list or home feed',async()=>{
 const h=harness(),old=h.start();h.switchAuth();const current=h.start();h.respond(1);await current;h.pending[0].reject(new Error('old request'));await old;assert.equal(h.renders(),1);
});

test('a refresh after a mutation supersedes an in-flight list',async()=>{
 const h=harness(),old=h.start();const fresh=vm.runInContext('loadArticles({force:true})',h.ctx);assert.equal(h.count(),2);h.respond(1);await fresh;h.respond(0);await old;assert.equal(h.renders(),1);assert.equal(vm.runInContext('S.articles[0].rowIdx',h.ctx),2);
});
