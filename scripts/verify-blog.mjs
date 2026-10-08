import fs from 'node:fs';
import assert from 'node:assert/strict';
export function verifyBlog(html) {
  for (const marker of ['id="feed"', 'id="article-viewer"', 'id="article-upload-modal"', "apiRead('postsOnly')", "apiRead('listArticles')"]) {
    assert.ok(html.includes(marker), `Blog identity check failed: missing ${marker}`);
  }
  assert.ok(!html.includes('id="search-input"'), 'Koo Mean SITE must never be deployed as Blog');
}
const target=process.argv[2]||'index.html';
if (target.startsWith('https://')) {
  const url=new URL(target);assert.equal(url.hostname,'blog.koomean.com');
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);verifyBlog(await response.text());
} else {
  assert.equal(fs.readFileSync('CNAME','utf8').trim(),'blog.koomean.com');
  if(process.env.GITHUB_REPOSITORY)assert.equal(process.env.GITHUB_REPOSITORY,'koomean/koomeanblog');
  verifyBlog(fs.readFileSync(target,'utf8'));
}
console.log('PASS: Koo Mean Blog identity and hosting destination');
