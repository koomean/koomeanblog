// Clean URLs are real static Pages entries. The router only changes views; it never handles credentials.
const BLOG_PATHS={home:'/',articles:'/article',saved:'/saved',settings:'/settings',search:'/search'};
let blogRouting=false,blogPostsReady=false;
function parseBlogRoute(value=location.href){
 const url=value instanceof URL?value:new URL(value,location.origin),result={view:'not-found',articleId:null,postId:null,tag:null};
 const path=url.pathname.replace(/\/$/,'')||'/';
 const view=Object.entries(BLOG_PATHS).find(([,pathValue])=>pathValue===path)?.[0];
 if(url.origin!==location.origin)return result;
 if(!view&&path!=='/index.html'&&!['/article.html','/saved.html','/settings.html','/search.html'].includes(path))return result;
 result.view=view||(path==='/index.html'?'home':Object.keys(BLOG_PATHS).find(key=>BLOG_PATHS[key]+'.html'===path));
 for(const [key,field] of [['article','articleId'],['post','postId']]){
  if(!url.searchParams.has(key))continue;
  const values=url.searchParams.getAll(key),raw=values[0];
  if(values.length!==1||!/^[1-9]\d*$/.test(raw)||!Number.isSafeInteger(Number(raw)))return {...result,view:'not-found'};
  result[field]=Number(raw);
 }
 if(result.articleId){result.view='articles';result.postId=null;}
 if(result.postId&&result.view!=='home')return {...result,view:'not-found'};
 if(result.view==='home')result.tag=normalizeTag(url.searchParams.get('tag')||'')||null;
 return result;
}
function updateBlogMetadata(){
 const route=parseBlogRoute(),missing=S.notFound||route.view==='not-found',labels={articles:'บทความ',saved:'บันทึกไว้',settings:'ตั้งค่า',search:'ค้นหา'};
 D('feed-hdr-title').textContent=missing?'Page not found':labels[route.view]||S.profile.webTitle||'Koo Mean Blog';
 document.title=(missing?'404 · Page not found':labels[route.view]||'')+(missing||labels[route.view]?' · ':'')+(S.profile.webTitle||'Koo Mean Blog');
 const canonical=document.querySelector('link[rel="canonical"]');
 if(canonical)canonical.href=location.origin+(BLOG_PATHS[route.view]||location.pathname);
 const robots=document.querySelector('meta[name="robots"]');
 if(robots)robots.content=missing||['saved','settings','search'].includes(route.view)?'noindex,follow':'index,follow';
 for(const prefix of ['sbn','mnav'])for(const name of Object.keys(BLOG_PATHS)){
  const el=D(prefix+'-'+name);if(!el)continue;
  el.classList.toggle('active',!missing&&name===route.view);
  if(!missing&&name===route.view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
 }
}
function hideBlogNotFound(){
 S.notFound=false;D('page-not-found').hidden=true;D('feed').hidden=false;D('prof-section').hidden=false;
}
function showBlogNotFound(kind='page'){
 S.notFound=true;D('feed').hidden=true;D('prof-section').hidden=true;D('creator').style.display='none';D('tag-filter-bar').style.display='none';
 D('page-not-found').hidden=false;
 D('not-found-description').textContent=kind==='article'?'ไม่พบบทความนี้ ลิงก์อาจไม่ถูกต้อง หรือบทความถูกนำออกแล้ว':kind==='post'?'ไม่พบโพสต์นี้ ลิงก์อาจไม่ถูกต้อง หรือโพสต์ถูกนำออกแล้ว':'ไม่พบหน้าที่คุณกำลังหา ลิงก์อาจไม่ถูกต้อง หรือเนื้อหาถูกย้ายแล้ว';
 D('feed-hdr-title').textContent='Page not found';updateBlogMetadata();
 D('page-not-found').focus({preventScroll:true});
}
function navigateBlog(target,{replace=false,overlay=false}={}){
 const url=new URL(target,location.origin);if(url.origin!==location.origin)return;
 const next=url.pathname+url.search+url.hash,current=location.pathname+location.search+location.hash;
 const state=overlay&&next!==current?{blogOverlayReturn:current}:next===current?history.state:null;
 if(next!==current||replace)history[replace?'replaceState':'pushState'](state,'',next);
 applyBlogRoute();
}
function closeBlogOverlay(){
 const previous=history.state?.blogOverlayReturn;
 if(previous&&new URL(previous,location.origin).origin===location.origin){history.back();return;}
 navigateBlog('/',{replace:true});
}
function rememberArticleRoute(rowIdx){
 const target='/article?article='+Number(rowIdx);
 if(location.pathname+location.search!==target)history.pushState(null,'',target);
 updateBlogMetadata();
}
function resolveBlogPost(){
 const route=parseBlogRoute();
 if(route.view!=='home'||!route.postId||!blogPostsReady)return;
 if(!S.posts.some(post=>post.rowIdx===route.postId)){showBlogNotFound('post');return;}
 requestAnimationFrame(()=>{if(parseBlogRoute().postId===route.postId&&!S.notFound)scrollToPost(route.postId)});
}
function applyBlogRoute(){
 if(blogRouting)return;
 const route=parseBlogRoute();blogRouting=true;
 try{
  closeArticleViewer();closeArticlePassword();closeMobSearch();closeSettings();closeCompose();pendingArticleOpen=0;pendingArticleWarned=false;
  hideBlogNotFound();
  if(route.view==='not-found'){S.articlesView=false;S.savedView=false;showBlogNotFound();return;}
  const canonical=BLOG_PATHS[route.view],url=new URL(location.href);
  if(route.articleId){url.pathname='/article';url.searchParams.delete('post');url.searchParams.delete('tag');}
  else url.pathname=canonical;
  const next=url.pathname+url.search+url.hash;
  if(next!==location.pathname+location.search+location.hash)history.replaceState(history.state,'',next);
  if(route.view==='articles'){pendingArticleOpen=route.articleId||0;navTo('articles');}
  else{
   navTo(route.view==='saved'?'saved':'home');
   if(route.tag){S.activeTag=route.tag;renderTagFilterBar();renderFeed();}
   if(route.view==='settings')openSettings();
   if(route.view==='search')openMobSearch();
   resolveBlogPost();
  }
 }finally{blogRouting=false;updateBlogMetadata();}
}
window.addEventListener('popstate',applyBlogRoute);
