import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/maintenance.js',import.meta.url),'utf8');
async function setup(initial={active:false}) {
  const nodes=new Map();
  for(const key of ['title','state','label','foot','refresh','thanks','days','countdown','note','deadline','button'])nodes.set(key,{textContent:'',hidden:false,listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}});
  const overlay={hidden:true,dataset:{app:'Koo Mean SITE',noteTh:'ข้อความเริ่มต้น'},querySelector(selector){return nodes.get(selector.match(/"(.*?)"/)[1]);},setAttribute(){},focus(){this.focused=true;},contains(target){return target===this||[...nodes.values()].includes(target)}};
  const content={tagName:'MAIN',inert:false};
  let time=1000000,state=initial,fail=false,calls=0,reloads=0,status=200;
  const events={},timeouts=new Map(),intervals=new Map();let seq=0;
  const document={hidden:false,body:{children:[overlay,content],style:{}},documentElement:{dataset:{}},getElementById(){return overlay;},addEventListener(name,fn){events[name]=fn;}};
  class ClockDate extends Date {static now(){return time}}
  vm.runInNewContext(source,{document,navigator:{languages:['th'],onLine:true},Date:ClockDate,Intl,URLSearchParams,AbortSignal,location:{reload(){reloads++;}},window:{addEventListener(name,fn){events[name]=fn;}},setTimeout(fn,ms){const id=++seq;timeouts.set(id,{fn,ms});return id;},clearTimeout(id){timeouts.delete(id);},setInterval(fn,ms){const id=++seq;intervals.set(id,{fn,ms});return id;},clearInterval(id){intervals.delete(id);},async fetch(){calls++;if(fail)throw new Error('Offline');return{status,ok:status===200,headers:{get(){return'60';}},async json(){return{maintenance:state};}};}});
  const flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();
  return {overlay,content,nodes,document,events,timeouts,intervals,flush,get calls(){return calls;},get reloads(){return reloads;},setState(value){state=value;},setTime(value){time=value;},setFail(value){fail=value;},setStatus(value){status=value;},async check(){nodes.get('button').listeners.click();await flush();},tick(){[...intervals.values()].filter(x=>x.ms===1000).forEach(x=>x.fn());}};
}
test('closing displays a safe note and isolates the underlying page',async()=>{
  const note='<img src=x onerror=alert(1)>';const x=await setup({active:true,note,reopenAt:1060000,serverTime:1000000});
  assert.equal(x.overlay.hidden,false);assert.equal(x.content.inert,true);assert.equal(x.overlay.focused,true);assert.equal(x.nodes.get('note').textContent,note);assert.equal(x.nodes.get('countdown').textContent,'00 : 01 : 00');
});
test('server clock correction keeps a clock-skewed visitor on the right countdown',async()=>{
  const x=await setup({active:true,reopenAt:1660000,serverTime:1600000});assert.equal(x.nodes.get('countdown').textContent,'00 : 01 : 00');
  x.setTime(1001000);x.tick();assert.equal(x.nodes.get('countdown').textContent,'00 : 00 : 59');
});
test('zero time cannot reopen the site until the server confirms',async()=>{
  const x=await setup({active:true,reopenAt:1001000,serverTime:1000000});x.setTime(1002000);x.tick();assert.equal(x.reloads,0);assert.equal(x.overlay.hidden,false);assert.match(x.nodes.get('foot').textContent,/กำลังตรวจสอบ/);
  x.setState({active:false});await x.check();assert.equal(x.reloads,1);
});
test('network failures and malformed status never remove the maintenance gate',async()=>{
  const x=await setup({active:true,reopenAt:1060000});x.setFail(true);await x.check();assert.equal(x.reloads,0);assert.equal(x.content.inert,true);
  x.setFail(false);x.setState({});await x.check();assert.equal(x.reloads,0);assert.equal(x.overlay.hidden,false);
});
test('rate limiting also bounds manual refresh attempts',async()=>{
  const x=await setup({active:true,reopenAt:1060000});x.setStatus(429);await x.check();const count=x.calls;await x.check();assert.equal(x.calls,count);assert.ok([...x.timeouts.values()].some(x=>x.ms>=60000));
});
test('hidden tabs stop polling and cannot issue manual requests',async()=>{
  const x=await setup({active:true,reopenAt:1060000});x.document.hidden=true;x.events.visibilitychange();const count=x.calls;await x.check();assert.equal(x.calls,count);assert.equal(x.timeouts.size,0);assert.equal(x.intervals.size,0);
});
test('normal startup leaves the website visible and does not reload',async()=>{
  const x=await setup();assert.equal(x.overlay.hidden,true);assert.equal(x.content.inert,false);assert.equal(x.reloads,0);assert.ok([...x.timeouts.values()].some(x=>x.ms===60000));
});
