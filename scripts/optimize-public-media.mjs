// Optional maintenance task. Build consumes the committed map and never needs live API access.
import fs from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(process.env.BLOG_SHARP_PATH||'sharp');
const endpoint='https://koomean-proxy.meanchannel52.workers.dev';
const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:'https://blog.koomean.com'},body:'action=all',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Public Blog API failed');const data=await r.json();
const images=[{url:data.spaceProfile?.imageUrl,max:256,kind:'avatar'},{url:data.spaceProfile?.coverUrl,max:1600,kind:'cover'},...(data.posts||[]).filter(p=>p.mediaUrl).map(p=>({url:p.mediaUrl,max:1600,kind:'post'}))];
const map={},report=[];fs.mkdirSync('assets',{recursive:true});
for(const item of images){
 if(!item.url)continue;const url=new URL(item.url);
 if(url.origin!==endpoint||!(url.pathname.startsWith('/assets/')||(url.searchParams.get('action')==='profileImage'&&url.searchParams.get('site')==='blog')))continue;
 if([...url.searchParams.keys()].some(k=>/token|password|secret/i.test(k)))throw new Error('Refusing credential URL');
 const res=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw new Error('Public image failed');
 const original=Buffer.from(await res.arrayBuffer());if(original.length>10*1024*1024)throw new Error('Image exceeds maintenance size limit');
 const meta=await sharp(original).metadata();if(meta.pages>1)continue; // preserve animated images
 const webp=await sharp(original).rotate().resize({width:item.max,height:item.max,fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:6}).toBuffer();
 if(webp.length>=original.length)continue;
 const file='media-'+createHash('sha256').update(webp).digest('hex').slice(0,16)+'.webp';fs.writeFileSync('assets/'+file,webp);const out=await sharp(webp).metadata();map[url.href]={src:'assets/'+file,width:out.width,height:out.height};
 report.push({kind:item.kind,file,beforeBytes:original.length,afterBytes:webp.length,originalWidth:meta.width,originalHeight:meta.height});
}
fs.writeFileSync('src/media-map.json',JSON.stringify(map,null,2)+'\n');fs.writeFileSync('media-optimization.json',JSON.stringify(report,null,2)+'\n');console.log(report);
