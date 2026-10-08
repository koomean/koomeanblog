import fs from 'node:fs';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
export function verifyBlog(html,js=''){
 for(const marker of ['id="feed"','id="article-viewer"','id="article-upload-modal"'])assert.ok(html.includes(marker),'Missing Blog identity: '+marker);
 assert.ok(!html.includes('id="search-input"'),'SITE must never be deployed as Blog');
 assert.ok(html.includes('script-src-attr \'none\''),'Inline event handlers must stay disabled');
 assert.ok(!/\bon(?:click|error|load|keydown|dblclick)=/i.test(html),'No inline event handlers');
 assert.ok(!/<script(?![^>]*src=)[^>]*>/i.test(html),'Executable Blog scripts must be external');
 if(js){assert.ok(js.includes('postsOnly')&&js.includes('listArticles'),'Blog API identity');assert.ok(!/localStorage\.setItem\([^,]*SESS_KEY/.test(js),'No persisted credentials');}
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
 if(process.argv[2]?.startsWith('https://')){const url=new URL(process.argv[2]);assert.equal(url.hostname,'blog.koomean.com');const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);verifyBlog(await r.text());console.log('PASS live Blog identity and CSP');}else await verifyLocal();
}
