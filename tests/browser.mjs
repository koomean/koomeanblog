import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {chromium,webkit} from 'playwright';
const watchdog=setTimeout(()=>{console.error('Browser regression exceeded 90 seconds');process.exit(1)},90000);watchdog.unref();
const output=process.env.BLOG_TEST_OUTPUT||'/tmp/koomean-blog-tests';fs.mkdirSync(output,{recursive:true});
const engine=process.env.BLOG_BROWSER==='webkit'?'webkit':'chromium';
const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.BLOG_CHROME_PATH?{executablePath:process.env.BLOG_CHROME_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:960},colorScheme:'dark',locale:'th-TH'}),errors=[],violations=[],calls=[],requests=[];let count=0;
page.setDefaultTimeout(15000);
const check=(v,msg)=>{assert.ok(v,msg);console.log('PASS '+msg);count++};
const malicious="x');window.__xss=1;//";
const posts=[{rowIdx:2,authorName:"Koo Mean O'Neil",authorPic:'https://media.example.invalid/avatar.png',email:'admin@example.invalid',timestamp:'2026-10-08T10:00:00Z',content:'แบ่งปันเรื่องราว เทคโนโลยี และสิ่งที่น่าสนใจ #technology',hashtags:[malicious,'technology'],mediaUrl:'https://media.example.invalid/photo.svg',comments:[{name:"O'Neil",email:'reader@example.invalid',text:'น่าสนใจครับ',time:1791453600000}],likesCount:3,views:15}];
const articles=[{rowIdx:2,title:'บทความ HTML แบบโต้ตอบ',type:'html',fileId:'article:2',tags:['technology'],locked:false,views:2},{rowIdx:3,title:'ลิงก์ภายนอก',type:'link',url:'https://example.org/',tags:['reference'],locked:false},{rowIdx:4,title:'บทความใส่รหัส',type:'html',hasPassword:true,locked:true,tags:[],views:1}];
const htmlArticle='<h1 id="heading">Interactive article</h1><button id="counter">Count 0</button><script>let n=0;document.querySelector("#counter").onclick=()=>document.querySelector("#counter").textContent="Count "+(++n);try{parent.__escaped=1}catch{}<\/script>';
let delayArticle=null,failPosts=false;
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.addInitScript(()=>{document.addEventListener('securitypolicyviolation',e=>{window.__cspViolations=(window.__cspViolations||[]).concat(e.violatedDirective+': '+e.blockedURI)});if(window.top===window)localStorage.setItem('kms_v3',JSON.stringify({idToken:'legacy-sensitive-token'}))});
await page.route('https://blog.koomean.com/**',route=>{
 const pathname=decodeURIComponent(new URL(route.request().url()).pathname);
 const file=path.resolve('.'+(pathname==='/settings'?'/settings.html':pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(process.cwd()+'/'))return route.abort();
 const ext=path.extname(file);return fs.existsSync(file)?route.fulfill({contentType:ext==='.js'?'application/javascript':ext==='.css'?'text/css':ext==='.woff2'?'font/woff2':'text/html',...(ext==='.html'?{headers:{'Content-Security-Policy':"frame-ancestors 'none'",'X-Frame-Options':'DENY'}}:{}),body:fs.readFileSync(file)}):route.fulfill({status:404,body:'not found'});
});
await page.route('https://media.example.invalid/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="900" height="500" fill="#192d4d"/><circle cx="580" cy="170" r="130" fill="#5ea2ff"/><path d="M0 500L350 160 700 500" fill="#47508c"/></svg>'}));
await page.route('https://ui-avatars.com/**',r=>r.fulfill({status:404,body:''}));
await page.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
const translationRequests=[];
await page.context().route('https://translate.google.com/**',route=>{
 translationRequests.push(route.request().headers());
 return route.fulfill({contentType:'text/html',body:'<title>Mock translation</title>'});
});
await page.route('https://koomean-proxy.meanchannel52.workers.dev/**',async r=>{
 if(new URL(r.request().url()).pathname==='/blog-article-sandbox.html')return r.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':'frame-ancestors https://blog.koomean.com; sandbox allow-scripts allow-popups'},body:fs.readFileSync('article-sandbox.html')});
 const request=r.request(),p=new URLSearchParams(request.postData()||'');let a=p.get('action');if(request.headers()['content-type']?.includes('json'))a=JSON.parse(request.postData()).action;
 calls.push(a);const result={success:true};
 if(a==='maintenanceStatus')result.maintenance={active:false};
 if(a==='all'){Object.assign(result,{spaceProfile:{webTitle:'Koo Mean Blog',name:'Koo Mean',bio:'พื้นที่แบ่งปันเรื่องราวและความคิด',handle:'@koomean'},posts,...(p.get('idToken')?{user:{email:'admin@example.invalid',role:'admin'},allUsers:[]}:{})});}
 if(a==='postsOnly'){if(failPosts)return r.fulfill({status:429,json:{code:429,message:'busy'}});result.posts=posts;}
 if(a==='listArticles')result.articles=articles;
 if(a==='articleContent'){if(delayArticle)await delayArticle;result.content=htmlArticle;}
 if(a==='unlockArticleByPassword'){result.article={...articles[2],locked:false,title:'บทความปลดล็อก',fileId:'article:4'};result.content=htmlArticle;}
 if(a==='addComment')posts[0].comments.push({name:'Admin',text:p.get('text'),time:Date.now()});
 if(a==='r2Quota')result.quota={used:{storageBytes:2e9,classA:2000,classB:3000},free:{storageBytes:1e10,classA:1e6,classB:1e7},locked:false,resetAt:'2026-12-11T00:00:00Z'};
 return r.fulfill({json:result});
});
try{
 await page.goto('https://blog.koomean.com/');await page.waitForSelector('#post-2');await page.evaluate(()=>document.fonts.ready);
 check(await page.evaluate(async()=>{
   const faces=await document.fonts.load('600 16px "Noto Sans Thai"','ข้อความภาษาไทย');
   return faces.some(face=>face.family.replaceAll('"','')==='Noto Sans Thai')&&
     getComputedStyle(document.querySelector('.post-txt')).fontFamily.includes('Plus Jakarta Sans')&&
     getComputedStyle(document.querySelector('.feed-hdr-title')).fontFamily.includes('Bricolage Grotesque');
 }),'Thai uses the bundled Noto face and Latin keeps the existing text and heading families');
 check(await page.evaluate(()=>!localStorage.getItem('kms_v3')),'legacy JWT removed from persistent storage');
 await page.locator('.post-tag').first().click();check(await page.evaluate(()=>!window.__xss),'malicious hashtag is inert data when clicked');
 await page.evaluate(()=>{clearTagFilter();S.posts[0].hashtags=['technology'];renderFeed()});
 await page.locator('[data-click="toggleSave"]').click();await page.locator('#sbn-saved').click();check(await page.locator('#post-2').count()===1,'bookmark and saved feed work through delegated actions');
 await page.locator('#sbn-home').click();await page.locator('[data-click="toggleCmts"]').click();check(await page.locator('#cmts-2').isVisible(),'comments toggle');
 await page.locator('#rw-srch').fill('เทคโนโลยี');await page.waitForSelector('#rw-results .rw-hit');check(true,'desktop search renders without unsafe handlers');await page.locator('#rw-srch').fill('');
 await page.locator('.post-media').click();check(await page.locator('#lightbox').isVisible(),'image lightbox');await page.keyboard.press('Escape');
 check(!requests.some(u=>u.startsWith('https://accounts.google.com/')),'reading and interacting does not download Google Sign-In');
 await page.locator('#auth-btn').click();await page.waitForFunction(()=>document.getElementById('login-modal').contains(document.activeElement));check(requests.some(u=>u.startsWith('https://accounts.google.com/')),'Google library loads only on explicit sign in');
 await page.keyboard.press('Tab');check(await page.evaluate(()=>D('login-modal').contains(document.activeElement)),'keyboard focus stays in login dialog');await page.keyboard.press('Escape');
 await page.evaluate(()=>handleCredentialResponse({credential:'eyJhbGciOiJub25lIn0.'+btoa(JSON.stringify({email:'admin@example.invalid',name:'Admin',picture:'https://media.example.invalid/avatar.svg',exp:Math.floor(Date.now()/1000)+3600}))+'.test'}));await page.waitForSelector('#creator.show');
 check(await page.evaluate(()=>isSaved(S.posts[0])),'bookmarks remain stable when switching between public and authenticated identity');
 check(await page.evaluate(()=>S.user.role==='admin'&&!localStorage.getItem('kms_v3')&&!('idToken' in S.user)),'authenticated identity is verified by API and JWT stays in tab memory');
 await page.locator('#sbn-settings').click();
 await page.waitForFunction(()=>document.querySelector('#r2-q-storage-text').textContent.includes('2.00 GB / 10.00 GB'));
 check(await page.locator('#r2-quota-card').isVisible()&&calls.includes('r2Quota'),'admin settings load and show R2 storage usage');
 await page.locator('#set-acc-row').click();
 check(await page.locator('#sub-account.open #acc-em').inputValue()==='admin@example.invalid','account settings show the authenticated email');
 await page.locator('#sub-account [data-click="closeSub"]').click();
 await page.locator('#admin-grp [data-a0="profile-edit"]').click();
 check(await page.locator('#sub-profile-edit.open #si-title').inputValue()==='Koo Mean Blog','admin profile editor opens with the current site title');
 await page.keyboard.press('Escape');
 check(await page.evaluate(()=>!D('set-main').inert&&document.activeElement?.dataset.a0==='profile-edit'&&D('set-panel').classList.contains('open')),'Escape leaves the profile editor and restores focus to its settings row');
 await page.keyboard.press('Escape');
 await page.waitForURL('https://blog.koomean.com/');
 check(await page.locator('#set-panel.open').count()===0,'Escape closes settings and restores the previous route');
 await page.locator('[data-click="toggleEmoji"]').first().click();check(await page.locator('#emoji-panel').isVisible(),'emoji picker works after event delegation');await page.locator('.emoji-item').first().click();check((await page.locator('#post-ta').inputValue()).length>0,'emoji insertion');
 await page.evaluate(()=>{D('post-ta').value='';D('emoji-panel').classList.remove('open')});
 await page.locator('[data-click="toggleCmts"]').click();if(!await page.locator('#ci-2').isVisible())await page.locator('[data-click="toggleCmts"]').click();await page.locator('#ci-2').fill('ทดสอบความคิดเห็น');await page.locator('[data-click="submitCmt"]').click();await page.waitForFunction(()=>S.posts[0].comments.some(c=>c.text==='ทดสอบความคิดเห็น'));check(calls.includes('addComment'),'comment submission carries authenticated POST');
 await page.locator('#sbn-articles').click();await page.waitForSelector('.art-card');await page.locator('.art-card').first().click();
 const article=page.frameLocator('#av-body iframe');await article.locator('#counter').waitFor();await article.locator('#counter').click();check((await article.locator('#counter').textContent())==='Count 1','interactive HTML article JavaScript works in sandbox');check(await page.evaluate(()=>!window.__escaped),'article cannot write to Blog parent window');await page.keyboard.press('Escape');
 await page.locator('.art-card').nth(2).click();await page.locator('#apw-input').fill('example-password');await page.locator('#apw-input').press('Enter');await page.frameLocator('#av-body iframe').locator('#counter').waitFor();check(calls.includes('unlockArticleByPassword'),'password unlock and Enter key');await page.keyboard.press('Escape');
 let resolveArticle;delayArticle=new Promise(r=>resolveArticle=r);await page.locator('.art-card').first().click();await page.keyboard.press('Escape');resolveArticle();delayArticle=null;await page.waitForTimeout(100);check(await page.locator('#av-body iframe').count()===0,'closed article is not restored by delayed network response');
 await page.evaluate(()=>{signOut(true);navTo('home')});check(await page.evaluate(()=>S.idToken===null&&driveAccessToken===''),'logout clears ID and Drive access tokens');
 await page.evaluate(()=>{lastPostsRefreshAt=0;return Promise.all([refreshPosts({silent:true,force:true,background:true}),refreshPosts({silent:true,force:true,background:true}),refreshPosts({silent:true,force:true,background:true})])});const afterBurst=calls.filter(a=>a==='postsOnly').length;await page.evaluate(()=>refreshPosts({silent:true,force:true,background:true}));check(calls.filter(a=>a==='postsOnly').length===afterBurst,'focus/visibility refresh bursts are deduplicated');
 const previousCount=await page.locator('#feed .post').count();failPosts=true;await page.evaluate(()=>{lastPostsRefreshAt=0;return refreshPosts({silent:true,force:true,background:true})});check(await page.locator('#feed .post').count()===previousCount,'HTTP 429 preserves the visible feed');failPosts=false;
 await page.evaluate(()=>{S.posts[0].hashtags=['technology'];renderFeed();D('toast').classList.remove('show')});
 await page.waitForTimeout(100);await page.evaluate(()=>D('toast').classList.remove('show'));
 check(!requests.some(u=>u.includes('/webfonts/')),'all icon fonts load from versioned local assets');
 await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);D('feed-main').scrollTo(0,0)});await page.waitForTimeout(350);
 await page.screenshot({path:output+'/desktop-after.png',fullPage:true});
 await page.evaluate(()=>toggleDark());check(await page.evaluate(()=>getComputedStyle(D('post-2')).backgroundColor)==='rgb(255, 255, 255)','light theme uses readable white cards');await page.screenshot({path:output+'/light-after.png',fullPage:true});await page.evaluate(()=>toggleDark());
 for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at '+width+'px');}
 await page.setViewportSize({width:390,height:844});await page.locator('#mnav-search').click();await page.locator('#mob-srch-in').fill('เทคโนโลยี');await page.waitForSelector('#mob-srch-body .rw-hit');check(true,'mobile search');await page.keyboard.press('Escape');await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);D('feed-main').scrollTo(0,0)});await page.waitForTimeout(350);await page.screenshot({path:output+'/mobile-after.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});check(await page.evaluate(()=>getComputedStyle(D('post-2')).animationName)==='none','reduced motion respected');

 await page.setViewportSize({width:1440,height:960});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#sbn-settings').click();
 await page.waitForURL('**/settings');
 const settings=page.locator('#set-panel.open');
 const theme=settings.locator('select[data-koo-theme]');
 const accents=settings.locator('input[name="blog-accent"][data-blog-preference="accent"]');
 const accent=value=>accents.and(settings.locator(`input[value="${value}"]`));
 const textSize=settings.locator('select[data-blog-preference="textSize"]');
 const density=settings.locator('select[data-blog-preference="density"]');
 const motion=settings.locator('select[data-blog-preference="motion"]');
 const language=settings.locator('#settings-language');
 check(await page.locator('html').getAttribute('lang')==='th'&&await language.inputValue()==='auto','device language defaults to Thai for a Thai browser');
 await language.selectOption('en');
 check(await page.locator('html').getAttribute('lang')==='en'&&await settings.locator('#settings-title').innerText()==='Settings'&&await page.locator('#sbn-articles span').innerText()==='Articles','switching to English updates settings and navigation in place');
 check((await page.locator('#post-2 .post-txt').innerText()).includes('แบ่งปันเรื่องราว'),'switching interface language preserves original post text');
 await page.reload();
 await settings.waitFor();
 check(await language.inputValue()==='en'&&await page.locator('html').getAttribute('lang')==='en','explicit interface language is restored on reload');
 await language.selectOption('auto');
 check(await page.locator('html').getAttribute('lang')==='th'&&await settings.locator('#settings-title').innerText()==='ตั้งค่า','switching back to device language restores Thai');
 check((await settings.locator('#settings-version').textContent())?.includes('4.0.0')&&
   (await settings.locator('#settings-whats-new').textContent())?.includes('Noto Sans Thai'),'About shows version 4.0.0 and its release notes');
 check(await accents.count()===4,'settings offer four accent colors without signing in');
 check(!await settings.locator('#admin-grp').isVisible(),'R2 and profile administration are hidden from anonymous readers');
 const measureAppearance=()=>page.evaluate(()=>{
   const post=getComputedStyle(document.querySelector('#post-2'));
   return {
     accent:getComputedStyle(document.querySelector('#post-2 .post-tag')).color,
     textSize:parseFloat(getComputedStyle(document.querySelector('#post-2 .post-txt')).fontSize),
     spacing:parseFloat(post.paddingBlockStart)+parseFloat(post.marginBlockEnd),
     animation:post.animationName,
     transition:parseFloat(getComputedStyle(document.querySelector('#set-panel .set-drawer')).transitionDuration)
   };
 });
 const defaults=await measureAppearance();
 await accent('violet').press('Space');
 await page.waitForFunction(initial=>getComputedStyle(document.querySelector('#post-2 .post-tag')).color!==initial,defaults.accent);
 check(await accent('violet').isChecked()&&(await measureAppearance()).accent!==defaults.accent,'keyboard accent selection changes the color used in the feed');
 await textSize.selectOption('large');
 const large=(await measureAppearance()).textSize;
 check(large>defaults.textSize,'large text increases post reading size');
 await textSize.selectOption('extra');
 check((await measureAppearance()).textSize>large,'extra-large text increases post reading size again');
 await density.selectOption('compact');
 check((await measureAppearance()).spacing<defaults.spacing,'compact density reduces feed spacing');
 await motion.selectOption('reduce');
 const reduced=await measureAppearance();
 check(reduced.animation==='none'&&reduced.transition<defaults.transition,'motion preference disables post animation and shortens drawer transitions');
 await theme.selectOption('light');
 check(await page.evaluate(()=>document.documentElement.dataset.theme==='light'&&localStorage.getItem('kms_theme')==='light'),'settings apply and store the light theme');
 const beforeReload=await page.evaluate(()=>JSON.parse(localStorage.getItem('kms_blog_preferences')));
 check(beforeReload?.accent==='violet'&&beforeReload.textSize==='extra'&&beforeReload.density==='compact'&&beforeReload.motion==='reduce','reader preferences are stored locally');
 check((await page.reload()).status()===200,'settings reload at the clean URL');
 await settings.waitFor();
 check(await accent('violet').isChecked()&&await textSize.inputValue()==='extra'&&await density.inputValue()==='compact'&&await motion.inputValue()==='reduce'&&await theme.inputValue()==='light','settings choices survive reload');
 check(await page.evaluate(()=>{
   const {accent,textSize,density,motion,theme}=document.documentElement.dataset;
   return accent==='violet'&&textSize==='extra'&&density==='compact'&&motion==='reduce'&&theme==='light';
 }),'stored preferences are applied on page load');
 await page.setViewportSize({width:320,height:740});
 check(await settings.locator('.set-body').evaluate(body=>document.documentElement.scrollWidth<=innerWidth&&body.scrollWidth<=body.clientWidth),'settings fit a 320px viewport with extra-large reading text');
 await settings.locator('#settings-reset').click();
 check(await accent('blue').isChecked()&&await textSize.inputValue()==='default'&&await density.inputValue()==='comfortable'&&await motion.inputValue()==='system'&&await theme.inputValue()==='auto','reset restores every reader setting and the system theme');
 check(await page.evaluate(()=>{
   const {accent,textSize,density,motion,theme,themePreference}=document.documentElement.dataset;
   return accent==='blue'&&textSize==='default'&&density==='comfortable'&&motion==='system'&&theme==='dark'&&themePreference==='auto';
 }),'reset immediately applies the default appearance');
 const resetStatus=settings.locator('#settings-status[role="status"]');
 check(await resetStatus.count()===1&&Boolean((await resetStatus.textContent()).trim()),'settings reset announces completion');
 await page.reload();
 await settings.waitFor();
 check(await accent('blue').isChecked()&&await textSize.inputValue()==='default'&&await density.inputValue()==='comfortable'&&await motion.inputValue()==='system'&&await theme.inputValue()==='auto','reset preferences remain cleared after reload');
 await settings.locator('.set-close').press('Enter');
 await page.waitForURL('https://blog.koomean.com/');
 check(await settings.count()===0,'the close button returns to the blog after a settings reload');
 await page.locator('#mnav-saved').click();
 await page.waitForURL('**/saved');
 check(await page.locator('#post-2').count()===1,'reset preserves saved posts');
 const translateButton=page.locator('#post-2 [data-click="openPostTranslation"]');
 const translationDialog=page.locator('#post-translation-modal.open');
 const translationLanguage=translationDialog.locator('#post-translation-language');
 const originalPostText=await page.evaluate(()=>S.posts[0].content);
 const displayTranslationText=text=>page.evaluate(value=>{S.posts[0].content=value;renderFeed();},text);
 await displayTranslationText(' \n\t ');
 check(await translateButton.count()===0,'translation action is hidden for whitespace-only posts');
 const samplePost='ทดสอบแปล 😊\nSpaces, quotes " & + ? % #';
 await displayTranslationText(samplePost);
 const untranslated=await page.locator('#post-2 .post-txt').textContent();
 await translateButton.press('Enter');
 await translationDialog.waitFor();
 check(await translationLanguage.evaluate(field=>field===document.activeElement),'mobile saved post translation opens with focus on the language selector');
 await page.keyboard.press('Escape');
 await translationDialog.waitFor({state:'hidden'});
 await page.waitForFunction(()=>document.activeElement?.dataset.click==='openPostTranslation');
 check(translationRequests.length===0,'loading and dismissing translation makes no requests to Google Translate');
 await translateButton.click();
 await translationLanguage.selectOption('ja');
 const [translationTab]=await Promise.all([
   page.context().waitForEvent('page'),
   translationDialog.locator('[data-click="translatePost"]').click()
 ]);
 await translationTab.waitForURL('https://translate.google.com/**');
 const translationUrl=new URL(translationTab.url());
 assert.deepEqual([...translationUrl.searchParams],[['sl','auto'],['tl','ja'],['text',samplePost],['op','translate']]);
 check(translationUrl.origin==='https://translate.google.com'&&translationUrl.pathname==='/'&&
   translationRequests.length===1&&!translationRequests[0].referer&&await translationTab.evaluate(()=>window.opener===null),
 'confirming sends only the chosen language and post text to a new Google Translate tab without an opener or referrer');
 check(await page.locator('#post-2 .post-txt').textContent()===untranslated,'translating keeps the original post in the saved feed');
 await translationTab.close();
 await displayTranslationText(originalPostText);
 check(await page.locator('input:not([type="hidden"]),textarea,select').evaluateAll(fields=>fields.every(field=>field.getAttribute('aria-label')?.trim()||field.getAttribute('aria-labelledby')?.trim()||[...field.labels].some(label=>label.textContent.trim()))),'all current form fields have accessible names');
 await page.evaluate(()=>{const result=processContent('https://youtu.be/dQw4w9WgXcQ',99);const el=document.createElement('div');el.id='test-video';el.innerHTML=result.media;D('feed').appendChild(el)});
 check(await page.locator('#test-video iframe').count()===0,'YouTube player is not loaded before playback');
 await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({body:'<html></html>',contentType:'text/html'}));await page.route('https://i.ytimg.com/**',r=>r.abort());
 await page.locator('#test-video button').click();check(await page.locator('#test-video iframe').count()===1,'YouTube player starts on explicit click');await page.evaluate(()=>D('test-video').remove());
 violations.push(...await page.evaluate(()=>window.__cspViolations||[]));check(errors.length===0,'no JavaScript runtime errors: '+errors.join('; '));check(violations.length===0,'no unexpected CSP violations: '+violations.join('; '));
 await page.evaluate(()=>{const script=document.createElement('script');script.textContent='window.__inlineExecuted=true';document.head.appendChild(script);const button=document.createElement('button');button.setAttribute('onclick','window.__handlerExecuted=true');document.body.appendChild(button);button.click();button.remove();script.remove()});
 check(await page.evaluate(()=>!window.__inlineExecuted&&!window.__handlerExecuted),'CSP blocks injected inline script and event handlers');
 fs.writeFileSync(output+'/browser-results.json',JSON.stringify({engine,checks:count,errors,violations,apiActions:calls,requests:requests.length},null,2));console.log('All '+count+' browser checks passed');
}catch(error){console.error('Browser failure state',await page.evaluate(()=>({active:document.activeElement?.tagName,viewer:document.querySelector('#article-viewer')?.className,password:document.querySelector('#apw-modal')?.className,frame:document.querySelector('#av-body iframe')?.outerHTML})));for(const frame of page.frames().slice(1)){try{console.error('Article failure state',await frame.evaluate(()=>({ready:document.readyState,active:document.activeElement?.outerHTML,counter:document.querySelector('#counter')?.textContent,handler:typeof document.querySelector('#counter')?.onclick})));}catch{}}console.error('Browser errors',errors);throw error;}finally{await browser.close()}
