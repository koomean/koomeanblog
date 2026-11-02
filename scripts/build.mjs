import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
import {execFileSync} from 'node:child_process';
let released;
try{released=JSON.parse(execFileSync('git',['show','HEAD:build-manifest.json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}))}catch{try{released=JSON.parse(fs.readFileSync('build-manifest.json','utf8'))}catch{}}
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
let html=fs.readFileSync('src/index.html','utf8').replace('/* BUILD_THEME */',fs.readFileSync('src/theme.js','utf8')).replace('/* BUILD_MAINTENANCE */',fs.readFileSync('src/maintenance.js','utf8')).replace('/* BUILD_ROUTING */',fs.readFileSync('src/routing.js','utf8'));
html=html.replace('/* BUILD_MEDIA_MAP */{}',fs.readFileSync('src/media-map.json','utf8').trim());
const scripts=[],styles=[fs.readFileSync('src/vendor.css','utf8'),fs.readFileSync('src/maintenance.css','utf8'),fs.readFileSync('src/not-found.css','utf8')];
const cover=JSON.parse(fs.readFileSync('media-optimization.json','utf8')).find(item=>item.kind==='cover');
if(cover){
 const coverPath='/assets/'+cover.file;
 html=html.replace('<div class="prof-cover" id="prof-cover">',`<div class="prof-cover" id="prof-cover" style="background-image:linear-gradient(180deg,rgba(6,8,13,.10),rgba(6,8,13,.60)),url('${coverPath}');background-size:cover;background-position:center">`);
 html=html.replace('</head>','<link rel="preload" as="image" fetchpriority="high" href="'+coverPath+'">\n</head>');
}

html=html.replace(/<style>([\s\S]*?)<\/style>/g,(_,css)=>{styles.push(css);return ''});
html=html.replace(/<script>([\s\S]*?)<\/script>/g,(_,js)=>{scripts.push(js);return ''});
html=html.replace(/<link[^>]+href="https:\/\/(?:fonts.googleapis.com|cdnjs.cloudflare.com)[^"]+"[^>]*>/g,'');
html=html.replace(/<link rel="(?:preconnect|dns-prefetch)" href="https:\/\/(?:fonts.googleapis.com|fonts.gstatic.com|cdnjs.cloudflare.com|accounts.google.com)"[^>]*>/g,'');
html=html.replace(/<!--[\s\S]*?-->/g,'');
fs.mkdirSync('assets',{recursive:true});
const css=(await transform(styles.join('\n'),{loader:'css',minify:true,target:'es2022'})).code;
const js=(await transform(scripts.join('\n;\n'),{loader:'js',minify:true,target:'es2022',legalComments:'none'})).code;
const cssName='blog-'+hash(css)+'.css',jsName='app-'+hash(js)+'.js';fs.writeFileSync('assets/'+cssName,css);fs.writeFileSync('assets/'+jsName,js);
const policy="default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self' https://accounts.google.com/gsi/; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://koomean-proxy.meanchannel52.workers.dev https://accounts.google.com/gsi/ https://api.microlink.io https://api.dub.co; frame-src 'self' https://accounts.google.com/gsi/ https://www.youtube-nocookie.com https://koomean-proxy.meanchannel52.workers.dev https://drive.google.com; form-action 'none'; upgrade-insecure-requests";
html=html.replace('<meta charset="UTF-8">','<meta charset="UTF-8">\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">');
const font=fs.readdirSync('assets').find(n=>/^jakarta-/.test(n));
html=html.replace('</head>',`<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="/assets/${cssName}">\n<script src="/assets/${jsName}" defer></script>\n</head>`);
html=html.replace(/\n\s*\n/g,'\n');fs.writeFileSync('index.html',html);
// Real GitHub Pages .html aliases support direct clean URLs with HTTP 200.
const routes={article:'บทความ',saved:'บันทึกไว้',settings:'ตั้งค่า',search:'ค้นหา'};
for(const [route,title] of Object.entries(routes)){
 const page=html.replace('<title id="web-title">Koo Mean Blog</title>',`<title id="web-title">${title} · Koo Mean Blog</title>`).replace('rel="canonical" href="https://blog.koomean.com/"',`rel="canonical" href="https://blog.koomean.com/${route}"`).replace('name="robots" content="index,follow"',`name="robots" content="${route==='article'?'index':'noindex'},follow"`);
 fs.writeFileSync(route+'.html',page);
}
const theme=(await transform(fs.readFileSync('src/theme.js','utf8'),{loader:'js',minify:true,target:'es2022'})).code;
const themeName='theme-'+hash(theme)+'.js';
fs.writeFileSync('assets/'+themeName,theme);
const errorHtml=fs.readFileSync('src/404.html','utf8').replace('<!-- BUILD_404_ASSETS -->',`<meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="stylesheet" href="/assets/${cssName}"><script src="/assets/${themeName}" defer></script>`);
fs.writeFileSync('404.html',errorHtml);

// Keep the previous release assets for HTML cached during a Pages rollout. Repeated local/CI builds must not retain intermediate assets.
const current=[cssName,jsName,themeName],old=[released?.css?.file,released?.js?.file,released?.notFound?.themeFile].filter(Boolean);
const previousAssets=(old.every(file=>current.includes(file))?released?.previousAssets||[]:old).filter(file=>/^(?:app|blog|theme)-[a-f0-9]+\.(?:js|css)$/.test(file)&&!current.includes(file));
for(const file of previousAssets)if(!fs.existsSync('assets/'+file))fs.writeFileSync('assets/'+file,execFileSync('git',['show','HEAD:assets/'+file],{stdio:['ignore','pipe','ignore']}));
for(const file of fs.readdirSync('assets'))if(/^(?:app|blog|theme)-[a-f0-9]+\.(?:js|css)$/.test(file)&&![...current,...previousAssets].includes(file))fs.unlinkSync('assets/'+file);
fs.writeFileSync('build-manifest.json',JSON.stringify({htmlBytes:Buffer.byteLength(html),css:{file:cssName,bytes:Buffer.byteLength(css)},js:{file:jsName,bytes:Buffer.byteLength(js)},notFound:{themeFile:themeName},previousAssets},null,2)+'\n');
console.log(fs.readFileSync('build-manifest.json','utf8'));
