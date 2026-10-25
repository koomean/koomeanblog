import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

// Execute maintained functions with synthetic identities and controlled promises.
// BLOG_SOURCE_ROOT permits running the identical regressions against the baseline.
const source=fs.readFileSync(path.join(process.env.BLOG_SOURCE_ROOT||'.','src/index.html'),'utf8');
function part(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject};}
function tick(){return new Promise(resolve=>setImmediate(resolve));}
const authHelpers=source.includes('function isCurrentAuth(')?part('function isCurrentAuth(','async function getDriveAccessToken('):'';

function driveHarness(load=Promise.resolve()){
 let callback,requests=0;
 const ctx=vm.createContext({Date,Error,Number,Math,Promise,loadGSI:()=>load,google:{accounts:{oauth2:{initTokenClient(config){callback=config.callback;return{requestAccessToken(){requests++}}}}}}});
 ctx.window=ctx;
 vm.runInContext("let authEpoch=1;const S={idToken:'synthetic-account-a'};let driveAccessToken='',driveAccessTokenExpiresAt=0;"+authHelpers+part('async function getDriveAccessToken(){','async function apiFetch('),ctx);
 return{ctx,callback:value=>callback(value),requests:()=>requests,start:()=>vm.runInContext('getDriveAccessToken()',ctx),logout:()=>vm.runInContext("authEpoch++;S.idToken=null;driveAccessToken='';driveAccessTokenExpiresAt=0",ctx),token:()=>vm.runInContext('driveAccessToken',ctx)};
}

test('Drive consent keeps a valid same-account access token',async()=>{
 const h=driveHarness(),pending=h.start();await tick();h.callback({access_token:'synthetic-drive-a',expires_in:3600});
 assert.equal(await pending,'synthetic-drive-a');assert.equal(h.token(),'synthetic-drive-a');assert.equal(await h.start(),'synthetic-drive-a');assert.equal(h.requests(),1);
});

test('logout while GSI loads prevents a stale Drive authorization prompt',async()=>{
 const load=deferred(),h=driveHarness(load.promise),pending=h.start();const rejected=assert.rejects(pending);h.logout();load.resolve();await tick();if(h.requests())h.callback({access_token:'synthetic-drive-a',expires_in:3600});
 await rejected;assert.equal(h.requests(),0);assert.equal(h.token(),'');
});

test('logout before a Drive consent callback prevents token resurrection',async()=>{
 const h=driveHarness(),pending=h.start();await tick();h.logout();h.callback({access_token:'synthetic-drive-a',expires_in:3600});
 await assert.rejects(pending);assert.equal(h.token(),'');
});

test('Drive callback also rejects an identity change without an epoch increment',async()=>{
 const h=driveHarness(),pending=h.start();await tick();vm.runInContext("S.idToken='synthetic-account-b'",h.ctx);h.callback({access_token:'synthetic-drive-a',expires_in:3600});
 await assert.rejects(pending);assert.equal(h.token(),'');
});

function passwordHarness(){
 const responses=[],opened=[],toasts=[];let currentOpen=true;
 const nodes={'apw-row':{value:'7'},'apw-input':{value:'synthetic-password'},'apw-submit':{textContent:'ปลดล็อก',disabled:false},'apw-modal':{classList:{contains:()=>currentOpen,add(){currentOpen=true},remove(){currentOpen=false}}}};
 const ctx=vm.createContext({API_URL:'https://example.test',URLSearchParams,parseInt,Error,Object,CLIENT_UA:'test',D:id=>nodes[id],apiFetch:()=>{const r=deferred();responses.push(r);return r.promise},toast:msg=>toasts.push(msg),renderArticleItems(){},openArticleViewer:a=>opened.push(a),setTimeout:()=>0});
 vm.runInContext("let authEpoch=1;const S={idToken:'synthetic-account-a',articles:[]};let articlePasswordRequestId=0;"+authHelpers+part('function promptArticlePassword(rowIdx){','/* ---- Admin: upload'),ctx);
 return{ctx,nodes,opened,toasts,start:()=>vm.runInContext('submitArticlePassword()',ctx),close:()=>vm.runInContext('closeArticlePassword()',ctx),logout:()=>vm.runInContext("authEpoch++;S.idToken=null;S.articles=[]",ctx),respond:(i,body={success:true,article:{rowIdx:7,type:'html'},content:'synthetic protected content'})=>responses[i].resolve({ok:true,json:async()=>body}),articles:()=>vm.runInContext('S.articles',ctx)};
}

test('a current password grant still opens its article',async()=>{
 const h=passwordHarness(),pending=h.start();h.respond(0);await pending;assert.equal(h.opened.length,1);assert.equal(h.articles()[0].content,'synthetic protected content');assert.equal(h.nodes['apw-submit'].disabled,false);
});

test('closing the password dialog prevents a delayed grant reopening the viewer',async()=>{
 const h=passwordHarness(),pending=h.start();h.close();h.respond(0);await pending;assert.equal(h.opened.length,0);assert.equal(h.articles().length,0);assert.equal(h.nodes['apw-input'].value,'');assert.equal(h.nodes['apw-submit'].disabled,false);
});

test('logout prevents delayed password content being restored to the new session',async()=>{
 const h=passwordHarness(),pending=h.start();h.logout();h.respond(0);await pending;assert.equal(h.opened.length,0);assert.equal(h.articles().length,0);
});

test('a superseded password request cannot replace the latest grant',async()=>{
 const h=passwordHarness(),older=h.start();h.close();vm.runInContext('promptArticlePassword(7)',h.ctx);h.nodes['apw-input'].value='new-password';const newer=h.start();h.respond(1,{success:true,article:{rowIdx:7,type:'html'},content:'new content'});await newer;h.respond(0);await older;assert.equal(h.opened.length,1);assert.equal(h.articles()[0].content,'new content');
});

test('late password failures do not show a toast after dialog close',async()=>{
 const h=passwordHarness(),pending=h.start();h.close();h.respond(0,{success:false,message:'synthetic denied'});await pending;assert.equal(h.toasts.length,0);
});

function mutationHarness(){
 const fileRead=deferred(),drive=deferred(),sent=[],notes=[],nodes={};
 for(const name of ['au-title','au-desc','au-url','au-file','au-tags','au-access','au-password'])nodes[name]={value:name==='au-title'?'Synthetic title':''};
 nodes['au-submit']={textContent:'อัปโหลด',disabled:false};nodes['au-clearpw']={checked:false};
 const ctx=vm.createContext({D:id=>nodes[id],Error,Date,String,Boolean,Number,Promise,setTimeout:()=>0,isAdmin:()=>true,toast:msg=>notes.push(msg),setUploadProgress(){},getDriveAccessToken:()=>drive.promise,fileToBase64:()=>fileRead.promise,fmtBytes:()=>'',detectArticleType:()=> 'pdf',postDataProgress:async(action,params)=>{sent.push({action,params});return{success:true}},postData:async(action,params)=>{sent.push({action,params});return{success:true}},loadArticles(){},closeArticleUpload(){},confirm:()=>true,verifyArticleSaved:async()=>false});
 vm.runInContext("let authEpoch=1;const S={idToken:'synthetic-account-a'};let artEditRow=null,artUploadFile={size:12,type:'application/pdf',name:'test.pdf'};"+authHelpers+part('async function submitArticleUpload(){','async function moveArticle(')+part('async function deleteArticle(rowIdx){','/* Actions are references'),ctx);
 return{ctx,drive,fileRead,sent,notes,startUpload:()=>vm.runInContext('submitArticleUpload()',ctx),startDelete:()=>vm.runInContext('deleteArticle(7)',ctx),switchAccount:()=>vm.runInContext("authEpoch++;S.idToken='synthetic-account-b'",ctx)};
}

test('upload cannot send an old Drive credential after an account change during file reading',async()=>{
 const h=mutationHarness(),pending=h.startUpload();h.drive.resolve('synthetic-drive-a');await tick();h.switchAccount();h.fileRead.resolve('c3ludGhldGlj');await pending;assert.equal(h.sent.length,0);
});

test('delete cannot send an old Drive credential after an account change during consent',async()=>{
 const h=mutationHarness(),pending=h.startDelete();h.switchAccount();h.drive.resolve('synthetic-drive-a');await pending;assert.equal(h.sent.length,0);
});

test('same-account upload and delete remain functional',async()=>{
 const upload=mutationHarness(),first=upload.startUpload();upload.drive.resolve('synthetic-drive-a');await tick();upload.fileRead.resolve('c3ludGhldGlj');await first;assert.equal(upload.sent[0]?.action,'uploadArticle');assert.equal(upload.sent[0]?.params.driveAccessToken,'synthetic-drive-a');
 const remove=mutationHarness(),second=remove.startDelete();remove.drive.resolve('synthetic-drive-a');await second;assert.equal(remove.sent[0]?.action,'deleteArticle');
});


test('a fresh sign-in clears Drive credentials inherited from the prior account',()=>{
 const h=driveHarness();Object.assign(h.ctx,{decodeJwt:()=>({email:'synthetic-b@example.test',name:'B'}),closeModal(){},closeArticleUpload(){},setUploadProgress(){},D:()=>({disabled:true}),toast(){},loadData(){}});
 vm.runInContext("driveAccessToken='synthetic-drive-a';driveAccessTokenExpiresAt=Date.now()+3600000;"+part('function handleCredentialResponse(res){','function doRegister(){'),h.ctx);
 vm.runInContext("handleCredentialResponse({credential:'synthetic-account-b'})",h.ctx);assert.equal(h.token(),'');
});

function viewerHarness(){
 const responses=[],body={dataset:{},frames:[],html:''};Object.defineProperty(body,'innerHTML',{get(){return this.html},set(value){this.html=value;this.frames=[]}});body.replaceChildren=(...frames)=>{body.html='';body.frames=frames};
 const classes=new Set(),nodes={'av-body':body,'av-title':{textContent:''},'av-share':{dataset:{}},'article-viewer':{classList:{contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)}}};
 const document={body:{style:{}},createElement:()=>({setAttribute(){},addEventListener(){},contentWindow:{postMessage(){}}})};
 const ctx=vm.createContext({D:id=>nodes[id],String,Error,document,window:{addEventListener(){}},esc:value=>value,safeHttpUrl:value=>value,trackArticleView(){},apiRead:()=>{const response=deferred();responses.push(response);return response.promise}});
 vm.runInContext("let authEpoch=1;const S={idToken:'synthetic-account-a'};"+authHelpers+part('async function openArticleViewer(a){','/* ---- copy helper').replace('async function openArticleViewer(a){','let articleViewerRequestId=0;async function openArticleViewer(a){'),ctx);
 return{ctx,body,open:(title='Original')=>vm.runInContext("openArticleViewer({type:'html',rowIdx:7,fileId:'article:7',title:"+JSON.stringify(title)+"})",ctx),close:()=>vm.runInContext('closeArticleViewer()',ctx),respond:(i,success=true)=>responses[i].resolve({json:async()=>({success,content:'synthetic article'})})};
}

test('a delayed HTML response cannot replace the viewer after closing and reopening the same row',async()=>{
 const h=viewerHarness(),older=h.open('Old');h.close();const newer=h.open('New');h.respond(1);await newer;h.respond(0);await older;assert.equal(h.body.frames[0]?.title,'New');
});

test('a delayed HTML error cannot replace a newly opened article',async()=>{
 const h=viewerHarness(),older=h.open('Old');h.close();const newer=h.open('New');h.respond(1);await newer;h.respond(0,false);await older;assert.equal(h.body.frames[0]?.title,'New');
});

test('a delayed HTML response is discarded when authentication changes',async()=>{
 const h=viewerHarness(),pending=h.open();vm.runInContext("authEpoch++;S.idToken='synthetic-account-b'",h.ctx);h.respond(0);await pending;assert.equal(h.body.frames.length,0);
});

test('current HTML requests retain the opaque-origin article sandbox',async()=>{
 const h=viewerHarness(),pending=h.open();h.respond(0);await pending;assert.equal(h.body.frames[0]?.title,'Original');assert.equal(h.body.frames[0]?.src,'article-sandbox.html');
});


function uploadSessionHarness(){
 const consent=[],reads=[],transfers=[],progress=[],nodes={};
 for(const id of ['au-title','au-desc','au-url','au-file','au-tags','au-access','au-password'])nodes[id]={value:id==='au-title'?'Synthetic title':''};
 nodes['au-submit']={textContent:'อัปโหลด',disabled:false};
 const ctx=vm.createContext({Error,Date,String,Boolean,Number,Promise,isAdmin:()=>true,D:id=>nodes[id],toast(){},setUploadProgress:value=>progress.push(value),
  getDriveAccessToken(){const d=deferred();consent.push(d);return d.promise},
  fileToBase64(file,onProgress){const d={...deferred(),onProgress};reads.push(d);return d.promise},
  fmtBytes:()=>'',detectArticleType:()=> 'pdf',
  postDataProgress(action,params,onProgress){const d={...deferred(),onProgress};transfers.push(d);return d.promise},
  loadArticles(){},closeArticleUpload(){},verifyArticleSaved:async()=>false});
 vm.runInContext("let authEpoch=1;const S={idToken:'synthetic-account-a'};let artEditRow=null,artUploadFile={size:12,type:'application/pdf',name:'test.pdf'};"+authHelpers+part('async function submitArticleUpload(){','async function moveArticle('),ctx);
 return{consent,reads,transfers,progress,nodes,start:()=>vm.runInContext('submitArticleUpload()',ctx),switchAccount:()=>vm.runInContext("authEpoch++;S.idToken='synthetic-account-b'",ctx)};
}

test('old account consent completion leaves the new upload button and progress alone',async()=>{
 const h=uploadSessionHarness(),older=h.start();h.switchAccount();const newer=h.start();
 h.consent[1].resolve('synthetic-drive-b');await tick();
 assert.equal(h.nodes['au-submit'].disabled,true);const progress=h.progress.at(-1),label=h.nodes['au-submit'].textContent;
 h.consent[0].resolve('synthetic-drive-a');await older;
 assert.equal(h.nodes['au-submit'].disabled,true);assert.equal(h.nodes['au-submit'].textContent,label);assert.equal(h.progress.at(-1),progress);
 h.reads[0].resolve('eA==');await tick();h.transfers[0].resolve({success:true});await newer;
});

test('old FileReader progress and completion cannot alter the new upload',async()=>{
 const h=uploadSessionHarness(),older=h.start();h.consent[0].resolve('synthetic-drive-a');await tick();
 h.switchAccount();const newer=h.start();h.consent[1].resolve('synthetic-drive-b');await tick();const progress=h.progress.at(-1);
 h.reads[0].onProgress(0.75);assert.equal(h.progress.at(-1),progress);
 h.reads[0].resolve('eA==');await older;assert.equal(h.progress.at(-1),progress);assert.equal(h.nodes['au-submit'].disabled,true);
 h.reads[1].resolve('eA==');await tick();h.transfers[0].resolve({success:true});await newer;
});

test('old XHR progress and completion cannot alter the new upload',async()=>{
 const h=uploadSessionHarness(),older=h.start();h.consent[0].resolve('synthetic-drive-a');await tick();h.reads[0].resolve('eA==');await tick();
 h.switchAccount();const newer=h.start();h.consent[1].resolve('synthetic-drive-b');await tick();const progress=h.progress.at(-1);
 h.transfers[0].onProgress(0.75);assert.equal(h.progress.at(-1),progress);
 h.transfers[0].resolve({success:true});await older;assert.equal(h.progress.at(-1),progress);assert.equal(h.nodes['au-submit'].disabled,true);
 h.reads[1].resolve('eA==');await tick();h.transfers[1].resolve({success:true});await newer;
});
