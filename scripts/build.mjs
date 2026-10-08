import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
let html=fs.readFileSync('src/index.html','utf8');
html=html.replace('/* BUILD_MEDIA_MAP */{}',fs.readFileSync('src/media-map.json','utf8').trim());
const scripts=[],styles=[fs.readFileSync('src/vendor.css','utf8')];
const cover=JSON.parse(fs.readFileSync('media-optimization.json','utf8')).find(item=>item.kind==='cover');
if(cover){
 const coverPath='assets/'+cover.file;
 html=html.replace('<div class="prof-cover" id="prof-cover">',`<div class="prof-cover" id="prof-cover" style="background-image:linear-gradient(180deg,rgba(6,8,13,.10),rgba(6,8,13,.60)),url('${coverPath}');background-size:cover;background-position:center">`);
 html=html.replace('</head>','<link rel="preload" as="image" fetchpriority="high" href="'+coverPath+'">\n</head>');
}

html=html.replace(/<style>([\s\S]*?)<\/style>/g,(_,css)=>{styles.push(css);return ''});
html=html.replace(/<script>([\s\S]*?)<\/script>/g,(_,js)=>{scripts.push(js);return ''});
html=html.replace(/<link[^>]+href="https:\/\/(?:fonts.googleapis.com|cdnjs.cloudflare.com)[^"]+"[^>]*>/g,'');
html=html.replace(/<link rel="(?:preconnect|dns-prefetch)" href="https:\/\/(?:fonts.googleapis.com|fonts.gstatic.com|cdnjs.cloudflare.com|accounts.google.com)"[^>]*>/g,'');
html=html.replace(/<!--[\s\S]*?-->/g,'');
fs.mkdirSync('assets',{recursive:true});
for(const file of fs.readdirSync('assets'))if(/^(app|blog)-[a-f0-9]+\.(js|css)$/.test(file))fs.unlinkSync('assets/'+file);
const css=(await transform(styles.join('\n'),{loader:'css',minify:true,target:'es2022'})).code;
const js=(await transform(scripts.join('\n;\n'),{loader:'js',minify:true,target:'es2022',legalComments:'none'})).code;
const cssName='blog-'+hash(css)+'.css',jsName='app-'+hash(js)+'.js';fs.writeFileSync('assets/'+cssName,css);fs.writeFileSync('assets/'+jsName,js);
const policy="default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self' https://accounts.google.com/gsi/; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://koomean-proxy.meanchannel52.workers.dev https://accounts.google.com/gsi/ https://api.microlink.io https://api.dub.co; frame-src 'self' https://accounts.google.com/gsi/ https://www.youtube-nocookie.com https://koomean-proxy.meanchannel52.workers.dev https://drive.google.com; form-action 'none'; upgrade-insecure-requests";
html=html.replace('<meta charset="UTF-8">','<meta charset="UTF-8">\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">');
const font=fs.readdirSync('assets').find(n=>/^jakarta-/.test(n));
html=html.replace('</head>',`<link rel="preload" href="assets/${font}" as="font" type="font/woff2" crossorigin>\n<link rel="stylesheet" href="assets/${cssName}">\n<script src="assets/${jsName}" defer></script>\n</head>`);
html=html.replace(/\n\s*\n/g,'\n');fs.writeFileSync('index.html',html);
fs.writeFileSync('build-manifest.json',JSON.stringify({htmlBytes:Buffer.byteLength(html),css:{file:cssName,bytes:Buffer.byteLength(css)},js:{file:jsName,bytes:Buffer.byteLength(js)}},null,2)+'\n');
console.log(fs.readFileSync('build-manifest.json','utf8'));
