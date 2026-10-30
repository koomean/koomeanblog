import fs from 'node:fs';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
export function verifyBlog(html,js='',options={}){
 // Cloudflare may add its own probe after Pages serves our verified artifact.
 // Its execution remains blocked by CSP. Never relax checks on generated files.
 if(options.live)html=html.replace(/<script>([\s\S]*?)<\/script>/g,(tag,body)=>body.startsWith('(function(){function c(){var b=a.contentDocument')&&body.includes('/cdn-cgi/challenge-platform/scripts/jsd/main.js')?'':tag);

 for(const marker of ['id="feed"','id="article-viewer"','id="article-upload-modal"'])assert.ok(html.includes(marker),'Missing Blog identity: '+marker);
 assert.ok(!html.includes('id="search-input"'),'SITE must never be deployed as Blog');
 assert.ok(html.includes('script-src-attr \'none\''),'Inline event handlers must stay disabled');
 assert.ok(!/\bon(?:click|error|load|keydown|dblclick)=/i.test(html),'No inline event handlers');
 assert.ok(!/<script(?![^>]*src=)[^>]*>/i.test(html),'Executable Blog scripts must be external');
 if(js){assert.ok(js.includes('postsOnly')&&js.includes('listArticles'),'Blog API identity');assert.ok(!/localStorage\.setItem\([^,]*SESS_KEY/.test(js),'No persisted credentials');}
}
export function verifyFrameHeaders(headers,{sandbox=false}={}){
 // Fetch combines repeated CSP headers with commas. Each policy is enforced;
 // an additional permissive policy cannot override frame-ancestors 'none'.
 const directives=(headers.get('content-security-policy')||'').split(',').map(policy=>policy.split(';').map(value=>value.trim().split(/\s+/)));
 const policies=directives.map(policy=>policy.find(parts=>parts[0]?.toLowerCase()==='frame-ancestors')?.slice(1)).filter(Boolean);
 const xfo=(headers.get('x-frame-options')||'').trim().toUpperCase();
 if(!sandbox){
  assert.equal(xfo,'DENY','Blog root must retain X-Frame-Options: DENY');
  assert.ok(policies.some(sources=>sources.length===1&&sources[0]==="'none'"),"Blog root must prohibit framing through CSP");
  return;
 }
 const parent='https://blog.koomean.com';
 assert.equal(xfo,'','Cross-origin article sandbox must not send X-Frame-Options');
 assert.ok(policies.some(sources=>sources.length===1&&sources[0]===parent),'Article sandbox must restrict ancestors to the Blog origin');
 for(const sources of policies){
  assert.ok(sources.includes(parent)&&!sources.includes("'none'"),'Every article sandbox CSP ancestor policy must permit the Blog origin');
 }
 const sandboxes=directives.map(policy=>policy.find(parts=>parts[0]?.toLowerCase()==='sandbox')?.slice(1)).filter(Boolean);
 assert.ok(sandboxes.length,'Article loader must enforce sandbox isolation in its response header');
 for(const tokens of sandboxes){
  assert.ok(tokens.includes('allow-scripts'),'Article response sandbox must permit interactive scripts');
  assert.ok(!tokens.includes('allow-same-origin'),'Article response sandbox must retain an opaque origin');
  assert.ok(tokens.every(token=>['allow-scripts','allow-popups'].includes(token)),'Article response sandbox must not gain extra capabilities');
 }
}
export async function verifyLocal(){
 assert.equal(fs.readFileSync('CNAME','utf8').trim(),'blog.koomean.com');
 if(process.env.GITHUB_REPOSITORY)assert.equal(process.env.GITHUB_REPOSITORY,'koomean/koomeanblog');
 const html=fs.readFileSync('index.html','utf8'),manifest=JSON.parse(fs.readFileSync('build-manifest.json','utf8'));
 verifyBlog(html,fs.readFileSync('assets/'+manifest.js.file,'utf8'));
 for(const file of [manifest.js.file,manifest.css.file])assert.ok(html.includes('assets/'+file));
 assert.ok(fs.existsSync('article-sandbox.html'));console.log('PASS Blog identity, domain, CSP and release assets');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv[2]?.startsWith('https://')){
  const url=new URL(process.argv[2]);assert.equal(url.hostname,'blog.koomean.com');
  const r=await fetch(new URL('/',url),{redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);
  verifyBlog(await r.text(),'',{live:true});verifyFrameHeaders(r.headers);
  const legacy=await fetch(new URL('/article-sandbox.html',url),{redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(legacy.status,200,'Legacy article sandbox must remain published');
  verifyFrameHeaders(legacy.headers);
  const sandbox=await fetch('https://koomean-proxy.meanchannel52.workers.dev/blog-article-sandbox.html',{redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(sandbox.status,200,'API article sandbox must be published');
  assert.ok(sandbox.headers.get('content-type')?.startsWith('text/html'),'API article loader must be HTML');
  verifyFrameHeaders(sandbox.headers,{sandbox:true});
  console.log('PASS live Blog identity, anti-framing headers and isolated API article loader');
 }else await verifyLocal();
}
