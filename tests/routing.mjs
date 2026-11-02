import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

// Local-only fixtures: no browser profile, credentials or production API data are used.
const root=process.cwd(),origin='https://blog.koomean.com',api='https://koomean-proxy.meanchannel52.workers.dev';
const output=process.env.BLOG_ROUTING_OUTPUT||'/tmp/koomean-blog-routing';
fs.mkdirSync(output,{recursive:true});
const engine=process.env.BLOG_BROWSER==='webkit'?'webkit':'chromium';
const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.BLOG_CHROME_PATH?{executablePath:process.env.BLOG_CHROME_PATH}:{})});
const watchdog=setTimeout(()=>{console.error('Routing regression exceeded 150 seconds');process.exit(1)},150000);watchdog.unref();
const cases=[];
const posts=[{rowIdx:2,authorName:'Routing fixture',email:'author@example.invalid',timestamp:'2026-11-02T10:00:00Z',content:'เรื่องทดสอบการเดินทางและเทคโนโลยี #technology',hashtags:['technology'],comments:[],likesCount:0,views:1}];
const articles=[
 {rowIdx:2,title:'บทความทดสอบเส้นทาง',type:'html',fileId:'article:2',tags:['technology'],locked:false,views:1},
 {rowIdx:4,title:'บทความทดสอบรหัสผ่าน',type:'html',fileId:'article:4',tags:[],locked:true,hasPassword:true,views:0},
 {rowIdx:5,title:'บทความจำกัดสิทธิ์',type:'html',fileId:'article:5',tags:[],locked:true,hasPassword:false,views:0}
];
const htmlArticle='<h1 id="routing-article-heading">Routing article fixture</h1><button id="routing-counter">Count 0</button><script>let n=0;document.getElementById("routing-counter").onclick=()=>document.getElementById("routing-counter").textContent="Count "+(++n);<\/script>';
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#192d4d"/></svg>';
const typeFor=file=>file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':file.endsWith('.webp')?'image/webp':file.endsWith('.jpg')?'image/jpeg':'text/html';

async function setup(){
 const context=await browser.newContext({viewport:{width:1440,height:960},colorScheme:'dark',reducedMotion:'reduce'}),page=await context.newPage();
 page.setDefaultTimeout(10000);
 const state={calls:[],requests:[],errors:[],failArticles:false,failHome:false,releaseArticle:null};
 page.on('pageerror',error=>state.errors.push(error.message));
 page.on('request',request=>state.requests.push(request.url()));
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__routingCopied=text}}});
  Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
 });
 // Simulate GitHub Pages' observed extensionless .html aliases and custom 404 status.
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin===origin){
   let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{pathname='/invalid-encoded-path'}
   const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/,''),candidate=path.resolve(root,relative);
   let file=candidate,status=200;
   if(!candidate.startsWith(root+path.sep))file='';
   else if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
    if(!path.extname(file)&&fs.existsSync(file+'.html')&&fs.statSync(file+'.html').isFile())file+='.html';
    else file='';
   }
   if(!file){file=path.join(root,'404.html');status=404}
   if(!fs.existsSync(file))return route.fulfill({status:404,contentType:'text/html',body:'Missing generated 404.html; run npm run build'});
   const contentType=typeFor(file);
   return route.fulfill({status,contentType,body:fs.readFileSync(file),...(contentType==='text/html'?{headers:{'Content-Security-Policy':"frame-ancestors 'none'",'X-Frame-Options':'DENY'}}:{})});
  }
  if(url.origin===api){
   if(url.pathname==='/blog-article-sandbox.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'article-sandbox.html')),headers:{'Content-Security-Policy':'frame-ancestors https://blog.koomean.com; sandbox allow-scripts allow-popups'}});
   let params;try{params=request.headers()['content-type']?.includes('json')?request.postDataJSON():Object.fromEntries(new URLSearchParams(request.postData()||''))}catch{params={}}
   state.calls.push(params);const result={success:true};
   if(params.action==='maintenanceStatus')result.maintenance={active:false};
   if(params.action==='all'){
    if(state.failHome)return route.fulfill({status:503,json:{success:false,message:'Temporary fixture failure'}});
    Object.assign(result,{spaceProfile:{webTitle:'Koo Mean Blog',name:'Routing fixture',handle:'@koomean',bio:'ข้อมูลจำลองสำหรับตรวจเส้นทาง'},posts});
   }
   if(params.action==='postsOnly')result.posts=posts;
   if(params.action==='listArticles'){
    if(state.failArticles)return route.fulfill({status:503,json:{success:false,message:'Temporary fixture failure'}});
    result.articles=articles;
   }
   if(params.action==='articleContent'){
    if(state.releaseArticle)await state.releaseArticle;
    result.content=htmlArticle;
   }
   return route.fulfill({json:result});
  }
  if(url.hostname==='accounts.google.com')return route.fulfill({contentType:'application/javascript',body:''});
  if(url.hostname==='ui-avatars.com'||url.hostname==='media.example.invalid')return route.fulfill({contentType:'image/svg+xml',body:svg});
  return route.abort();
 });
 return {page,state,context};
}
async function test(name,fn){const ctx=await setup();try{await fn(ctx);assert.deepEqual(ctx.state.errors,[],'No JavaScript errors');cases.push(name);console.log('ROUTING PASS '+name)}catch(error){console.error('ROUTING STATE',name,await ctx.page.evaluate(()=>({path:location.pathname,query:location.search,tag:S?.activeTag,heading:document.querySelector('#feed-hdr-title')?.textContent,saved:S?.savedView,articles:S?.articlesView,notFound:S?.notFound})).catch(()=>null));throw error}finally{await ctx.context.close()}}
const routeAt=(page,pathname,query='')=>page.waitForURL(url=>url.pathname===pathname&&(!query||url.searchParams.has(query)));
const notFoundVisible=page=>page.locator('#page-not-found').waitFor({state:'visible'});
async function articleReady(page){await page.frameLocator('#av-body iframe').locator('#routing-article-heading').waitFor()}

try{
 await test('menu clicks update clean paths and browser Back/Forward restores views',async({page})=>{
  await page.goto(origin+'/');await page.locator('#post-2').waitFor();
  await page.locator('#sbn-articles').click();await routeAt(page,'/article');await page.locator('.art-card').first().waitFor();
  await page.locator('#sbn-saved').click();await routeAt(page,'/saved');assert.match(await page.locator('#feed-hdr-title').innerText(),/บันทึก/);
  await page.goBack();await routeAt(page,'/article');await page.locator('.art-card').first().waitFor();
  await page.goBack();await routeAt(page,'/');await page.locator('#post-2').waitFor();
  await page.goForward();await routeAt(page,'/article');await page.locator('.art-card').first().waitFor();
  await page.goForward();await routeAt(page,'/saved');assert.match(await page.locator('#feed-hdr-title').innerText(),/บันทึก/);
 });
 await test('article list supports a direct extensionless link and reload',async({page})=>{
  let response=await page.goto(origin+'/article');assert.equal(response.status(),200);await page.locator('.art-card').first().waitFor();
  response=await page.reload();assert.equal(response.status(),200);await page.locator('.art-card').first().waitFor();assert.equal(new URL(page.url()).pathname,'/article');
 });
 await test('saved view supports a direct link and reload',async({page})=>{
  assert.equal((await page.goto(origin+'/saved')).status(),200);await page.waitForFunction(()=>document.getElementById('feed-hdr-title').textContent.includes('บันทึก'));
  await page.reload();await page.waitForFunction(()=>document.getElementById('feed-hdr-title').textContent.includes('บันทึก'));assert.equal(new URL(page.url()).pathname,'/saved');
 });
 await test('settings route opens directly and reloads as settings',async({page})=>{
  assert.equal((await page.goto(origin+'/settings')).status(),200);await page.waitForFunction(()=>document.getElementById('set-panel').classList.contains('open'));
  await page.reload();await page.waitForFunction(()=>document.getElementById('set-panel').classList.contains('open'));assert.equal(new URL(page.url()).pathname,'/settings');
 });
 await test('closing settings restores the prior article route',async({page})=>{
  await page.goto(origin+'/article');await page.locator('.art-card').first().waitFor();await page.locator('#sbn-settings').click();await routeAt(page,'/settings');
  await page.keyboard.press('Escape');await routeAt(page,'/article');await page.waitForFunction(()=>!document.getElementById('set-panel').classList.contains('open'));await page.locator('.art-card').first().waitFor();
 });
 await test('search route opens directly on mobile and an empty search is not a 404',async({page})=>{
  await page.setViewportSize({width:390,height:844});assert.equal((await page.goto(origin+'/search')).status(),200);await page.waitForFunction(()=>document.getElementById('mob-srch').classList.contains('open'));await page.locator('#post-2').waitFor();
  await page.locator('#mob-srch-in').fill('missing-fixture-query');await page.waitForFunction(()=>document.getElementById('mob-srch-body').textContent.includes('ไม่พบโพสต์'));
  assert.equal(await page.locator('#page-not-found').isVisible(),false);assert.equal(new URL(page.url()).pathname,'/search');
  await page.reload();await page.waitForFunction(()=>document.getElementById('mob-srch').classList.contains('open'));
 });
 await test('mobile search click and cancel update the path',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/');await page.locator('#post-2').waitFor();
  await page.locator('#mnav-search').click();await routeAt(page,'/search');await page.locator('#mob-srch [data-click="closeMobSearch"]').click();await routeAt(page,'/');await page.waitForFunction(()=>!document.getElementById('mob-srch').classList.contains('open'));
 });
 await test('a mobile search result has its own post URL without a stale history jump',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/article');await page.locator('.art-card').first().waitFor();await page.locator('#mnav-search').click();await routeAt(page,'/search');await page.locator('#mob-srch-in').fill('เทคโนโลยี');await page.locator('#mob-srch-body [data-click="scrollToPost"]').first().click();await page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('post')==='2');await page.waitForTimeout(100);assert.equal(new URL(page.url()).searchParams.get('post'),'2');await page.locator('#post-2').waitFor();assert.equal(await page.locator('#page-not-found').isVisible(),false);
 });
 await test('legacy article query normalizes without duplicate list requests',async({page,state})=>{
  await page.goto(origin+'/?article=2');await articleReady(page);const url=new URL(page.url());assert.equal(url.pathname,'/article');assert.equal(url.searchParams.get('article'),'2');
  assert.equal(state.calls.filter(call=>call.action==='listArticles').length,1);await page.reload();await articleReady(page);assert.equal(new URL(page.url()).searchParams.get('article'),'2');
 });
 await test('opening and closing an article keeps a shareable resource URL',async({page})=>{
  await page.goto(origin+'/article');await page.locator('.art-card').first().click();await articleReady(page);assert.equal(new URL(page.url()).searchParams.get('article'),'2');
  await page.locator('#av-share').click();await page.waitForFunction(()=>window.__routingCopied);assert.equal(await page.evaluate(()=>window.__routingCopied),origin+'/article?article=2');
  await page.locator('#article-viewer [data-click="closeArticleViewer"]').click();await page.locator('#article-viewer').waitFor({state:'hidden'});assert.equal(new URL(page.url()).pathname,'/article');assert.equal(new URL(page.url()).searchParams.has('article'),false);
 });
 await test('browser Back closes the article resource and Forward restores it',async({page})=>{
  await page.goto(origin+'/article');await page.locator('.art-card').first().click();await articleReady(page);await page.goBack();await page.locator('#article-viewer').waitFor({state:'hidden'});assert.equal(new URL(page.url()).searchParams.has('article'),false);
  await page.goForward();await articleReady(page);assert.equal(new URL(page.url()).searchParams.get('article'),'2');
 });
 await test('shared post survives reload and sharing from saved uses the home base',async({page})=>{
  await page.goto(origin+'/?post=2');await page.locator('#post-2').waitFor();assert.equal(await page.locator('#page-not-found').isVisible(),false);await page.reload();await page.locator('#post-2').waitFor();
  await page.locator('#post-2 [data-click="toggleSave"]').click();await page.locator('#sbn-saved').click();await routeAt(page,'/saved');await page.locator('#post-2 [data-click="sharePost"]').click();await page.waitForFunction(()=>window.__routingCopied);assert.equal(await page.evaluate(()=>window.__routingCopied),origin+'/?post=2');
 });
 await test('legacy tag links remain a filter rather than a missing page',async({page})=>{
  await page.goto(origin+'/?tag=technology');await page.locator('#post-2').waitFor();await page.waitForFunction(()=>document.getElementById('tag-filter-bar').textContent.includes('technology'));assert.equal(await page.locator('#page-not-found').isVisible(),false);
 });
 await test('unknown and nested paths return the custom 404 with working root assets',async({page,state})=>{
  for(const pathname of ['/missing-routing-page','/nested/missing/page']){
   const start=state.requests.length,response=await page.goto(origin+pathname);assert.equal(response.status(),404);await notFoundVisible(page);assert.match(await page.locator('#page-not-found').innerText(),/404/);assert.match(await page.locator('#page-not-found').innerText(),/page not found/i);assert.equal(new URL(page.url()).pathname,pathname);
   const assets=state.requests.slice(start).filter(value=>new URL(value).origin===origin&&/\.(?:css|js|woff2)(?:\?|$)/.test(value));assert.ok(assets.every(value=>new URL(value).pathname.startsWith('/assets/')),'404 assets must be root-absolute');
  }
  await page.screenshot({path:path.join(output,'404-desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'404-mobile.png'),fullPage:false});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'404 must fit the mobile viewport');
 });
 await test('missing article and post show 404 only after successful data load',async({page,state})=>{
  await page.goto(origin+'/article?article=999999');await notFoundVisible(page);assert.ok(state.calls.some(call=>call.action==='listArticles'));assert.equal(state.calls.some(call=>call.action==='articleContent'),false);
  await page.goto(origin+'/?post=999999');await notFoundVisible(page);assert.ok(state.calls.some(call=>call.action==='all'));
 });
 await test('malformed resource identifiers are rejected rather than partially parsed',async({page})=>{
  for(const route of ['/article?article=2junk','/article?article=-2','/?post=2junk','/?post=0']){await page.goto(origin+route);await notFoundVisible(page);assert.equal(await page.locator('#article-viewer').isVisible(),false)}
 });
 await test('password and role restricted articles remain permission flows instead of 404s',async({page,state})=>{
  await page.goto(origin+'/article?article=4');await page.locator('#apw-modal').waitFor({state:'visible'});assert.equal(await page.locator('#page-not-found').isVisible(),false);assert.equal(state.calls.some(call=>call.action==='articleContent'),false);
  await page.goto(origin+'/article?article=5');await page.locator('.art-card').first().waitFor();assert.equal(await page.locator('#page-not-found').isVisible(),false);assert.equal(state.calls.some(call=>call.action==='articleContent'),false);assert.equal(new URL(page.url()).searchParams.get('article'),'5');
 });
 await test('article API failure offers retry and never masquerades as a missing item',async({page,state})=>{
  state.failArticles=true;await page.goto(origin+'/article?article=2');await page.locator('#feed .err-banner').waitFor();assert.equal(await page.locator('#page-not-found').isVisible(),false);
  state.failArticles=false;await page.locator('#feed [data-click="loadArticles"]').click();await articleReady(page);
 });
 await test('home API failure for a shared post is not a 404',async({page,state})=>{
  state.failHome=true;await page.goto(origin+'/?post=2');await page.locator('#feed .err-banner').waitFor();assert.equal(await page.locator('#page-not-found').isVisible(),false);
 });
 await test('navigation cancels late article content and cannot resurrect the viewer',async({page,state})=>{
  let release;state.releaseArticle=new Promise(resolve=>{release=resolve});await page.goto(origin+'/article?article=2');await page.waitForFunction(()=>document.getElementById('article-viewer').classList.contains('open'));
  await page.keyboard.press('Escape');await page.locator('#sbn-home').click();await routeAt(page,'/');release();state.releaseArticle=null;await page.locator('#post-2').waitFor();await page.waitForTimeout(100);assert.equal(await page.locator('#article-viewer').isVisible(),false);assert.equal(await page.locator('#av-body iframe').count(),0);
 });
 fs.writeFileSync(path.join(output,'routing-results.json'),JSON.stringify({engine,checks:cases.length,cases},null,2)+'\n');console.log('All '+cases.length+' routing checks passed');
}finally{clearTimeout(watchdog);await browser.close()}
