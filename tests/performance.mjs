import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const output=process.env.BLOG_PERF_OUTPUT||'/tmp/koomean-blog-performance';
fs.mkdirSync(output,{recursive:true});
const engine=process.env.BLOG_BROWSER==='webkit'?'webkit':'chromium';
const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.BLOG_CHROME_PATH?{executablePath:process.env.BLOG_CHROME_PATH}:{})});
const origin='https://blog.koomean.com';
const api='https://koomean-proxy.meanchannel52.workers.dev';
const image='<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><rect fill="#192d4d" width="26" height="26"/><circle fill="#5ea2ff" r="9" cx="13" cy="13"/></svg>';
const comments=Array.from({length:12},(_,i)=>({name:'Reader '+(i+1),text:'A public comment '+(i+1),pic:'https://media.example.invalid/comment-'+i+'.svg',time:1791453600000+i*1000}));
const mappedMedia='https://koomean-proxy.meanchannel52.workers.dev/assets/blog%2F7f7de7b7-1de1-4a28-862c-093bf25f1220-post-image';
const posts=[{rowIdx:2,timestamp:'2026-10-08T10:00:00Z',authorName:'Koo Mean',authorPic:'https://media.example.invalid/author.svg',content:'ทดสอบประสิทธิภาพโดยคงหน้าตาเดิม #technology',hashtags:['technology'],mediaUrl:mappedMedia,comments,likesCount:3,views:15},{rowIdx:3,timestamp:'2026-10-07T10:00:00Z',authorName:'Koo Mean',content:'โพสต์ถัดไป',mediaUrl:'https://media.example.invalid/later.svg',comments:[],views:1}];
const articles=[{rowIdx:2,title:'บทความ HTML แบบโต้ตอบ',type:'html',fileId:'article:2',locked:false,tags:['technology'],views:2}];

async function harness(root) {
  const page=await browser.newPage({viewport:{width:1440,height:960},colorScheme:'dark',reducedMotion:'reduce'}),actions=[],commentRequests=[],errors=[];
  await page.clock.setFixedTime(new Date('2026-10-25T12:00:00Z'));
  page.on('pageerror',e=>errors.push(e.message));
  const mediaPriorities=[];
  if(engine==='chromium') {
    const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');
    cdp.on('Network.requestWillBeSent',event=>{if(event.request.url.includes('media-5d17635a62e1dc9d.webp'))mediaPriorities.push(event.request.initialPriority)});
  }
  await page.route(origin+'/**',r=>{
    const url=new URL(r.request().url()),name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1)),file=path.resolve(root,name);
    if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:''});
    const type=file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':file.endsWith('.webp')?'image/webp':'text/html';
    return r.fulfill({body:fs.readFileSync(file),contentType:type});
  });
  await page.route(api+'/**',async r=>{
    const action=new URLSearchParams(r.request().postData()||'').get('action');actions.push(action);
    if(action==='all') {await new Promise(resolve=>setTimeout(resolve,400));return r.fulfill({json:{spaceProfile:{name:'Koo Mean',webTitle:'Koo Mean Blog',handle:'@koomean',bio:'พื้นที่แบ่งปันเรื่องราวและความคิด'},posts}})}
    if(action==='listArticles') {await new Promise(resolve=>setTimeout(resolve,30));return r.fulfill({json:{success:true,articles}})}
    if(action==='articleContent')return r.fulfill({json:{success:true,content:'<h1>Interactive article</h1><button id="counter">Count 0</button><script>let n=0;document.querySelector("#counter").onclick=()=>document.querySelector("#counter").textContent="Count "+(++n);<\/script>'}});
    return r.fulfill({json:{success:true,maintenance:{active:false}}});
  });
  await page.route('https://media.example.invalid/**',r=>{
    if(new URL(r.request().url()).pathname.startsWith('/comment-'))commentRequests.push(r.request().url());
    return r.fulfill({contentType:'image/svg+xml',body:image});
  });
  await page.route('https://ui-avatars.com/**',r=>r.fulfill({status:404,body:''}));
  return {page,actions,commentRequests,errors,mediaPriorities};
}

async function collect(root,label,verify) {
  const home=await harness(root),{page}=home;
  await page.goto(origin+'/');
  await page.locator('#post-2').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(250);
  const hiddenCommentRequests=home.commentRequests.length;
  const mediaLoading=await page.locator('.post-media').evaluateAll(images=>images.map(img=>({loading:img.loading,fetchPriority:img.fetchPriority||img.getAttribute('fetchpriority')||'auto'})));
  await page.screenshot({path:path.join(output,label+'-desktop.png'),fullPage:false});
  await page.evaluate(()=>KooTheme.set('light'));
  await page.waitForTimeout(150);
  await page.screenshot({path:path.join(output,label+'-light.png'),fullPage:false});
  await page.evaluate(()=>KooTheme.set('dark'));
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(150);
  await page.screenshot({path:path.join(output,label+'-phone.png'),fullPage:false});
  await page.setViewportSize({width:1440,height:960});
  await page.locator('#post-2 [data-click="toggleCmts"]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.cmt-av')].every(img=>img.complete&&img.naturalWidth>0));
  const openedCommentRequests=home.commentRequests.length;
  await page.screenshot({path:path.join(output,label+'-comments.png'),fullPage:false});
  await page.close();

  const shared=await harness(root);
  await shared.page.goto(origin+'/?article=2');
  await shared.page.frameLocator('#av-body iframe').locator('#counter').waitFor();
  await shared.page.waitForTimeout(650);
  const listRequests=shared.actions.filter(a=>a==='listArticles').length;
  await shared.page.frameLocator('#av-body iframe').locator('#counter').click();
  const interactive=(await shared.page.frameLocator('#av-body iframe').locator('#counter').textContent())==='Count 1';
  await shared.page.close();
  const result={label,engine,mediaLoading,firstMediaRequestPriorities:home.mediaPriorities,hiddenCommentRequests,openedCommentRequests,avoidableHiddenImageBytes:hiddenCommentRequests*Buffer.byteLength(image),sharedArticleListRequests:listRequests,sharedArticleInteractive:interactive,sharedArticleActions:shared.actions,errors:[...home.errors,...shared.errors]};
  if(verify) {
    assert.equal(mediaLoading[0].loading,'eager','first displayed post image must load eagerly');
    assert.equal(mediaLoading[0].fetchPriority,'high','first displayed post image must have high fetch priority');
    assert.equal(mediaLoading[1].loading,'lazy','later post images must remain lazy');
    assert.notEqual(mediaLoading[1].fetchPriority,'high','later post images must not compete for high priority');
    assert.equal(hiddenCommentRequests,0,'hidden comments must not download their avatars');
    assert.equal(openedCommentRequests,12,'opening comments must load every original avatar');
    assert.equal(listRequests,1,'a shared article must request one list in the same auth epoch');
    assert.equal(interactive,true,'a shared HTML article must still be interactive');
    assert.deepEqual(result.errors,[],'performance changes must not cause runtime errors');
  }
  return result;
}

try {
  const results=[];
  if(process.env.BLOG_PERF_BASELINE)results.push(await collect(path.resolve(process.env.BLOG_PERF_BASELINE),'before',false));
  results.push(await collect(process.cwd(),'after',process.env.BLOG_PERF_RECORD_ONLY!=='1'));
  fs.writeFileSync(path.join(output,'performance-behavior.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
