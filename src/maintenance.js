(() => {
  const overlay = document.getElementById('global-maintenance-overlay');
  if (!overlay) return;
  const api = 'https://koomean-proxy.meanchannel52.workers.dev';
  const english = (navigator.languages?.[0] || navigator.language || 'th').toLowerCase().startsWith('en');
  const app = overlay.dataset.app;
  const fallback = english ? overlay.dataset.noteEn : overlay.dataset.noteTh;
  const copy = english ? {
    title: 'We’ll be back soon', state: 'Maintenance in progress', label: 'Back online in',
    foot: 'This page will return automatically when the service is available again.',
    refresh: 'Check again', waiting: 'Checking whether the service is ready…',
    offline: 'Unable to connect right now. We’ll try again automatically.', thanks: 'Thank you for your patience', days: 'days'
  } : {
    title: 'เราจะกลับมาเร็ว ๆ นี้', state: 'กำลังดูแลระบบ', label: 'เปิดให้บริการอีกครั้งใน',
    foot: 'หน้านี้จะกลับมาใช้งานได้โดยอัตโนมัติเมื่อระบบพร้อม',
    refresh: 'ตรวจสอบอีกครั้ง', waiting: 'กำลังตรวจสอบการเปิดระบบ…',
    offline: 'ยังเชื่อมต่อไม่ได้ ระบบจะลองตรวจสอบอีกครั้งอัตโนมัติ', thanks: 'ขอบคุณที่รอพบกันอีกครั้ง', days: 'วัน'
  };
  const node = key => overlay.querySelector('[data-maintenance="'+key+'"]');
  for (const key of ['title','state','label','foot','refresh','thanks']) node(key).textContent = copy[key];
  overlay.setAttribute('lang', english ? 'en' : 'th');
  let active = false, deadline = 0, offset = 0, timer = 0, ticker = 0, busy = false, nextPoll = 0, limitedUntil = 0;
  const now = () => Date.now() + offset;
  function tick() {
    if (!active) return;
    const total = Math.max(0, Math.ceil((deadline-now())/1000));
    const days = Math.floor(total/86400);
    node('days').hidden = !days;
    node('days').textContent = days+' '+(english&&days===1?'day':copy.days);
    node('countdown').textContent = deadline ? [Math.floor(total%86400/3600),Math.floor(total%3600/60),total%60].map(value=>String(value).padStart(2,'0')).join(' : ') : '—';
    node('foot').textContent = deadline && !total ? copy.waiting : copy.foot;
  }
  function show(state) {
    deadline = Number(state.reopenAt) || 0;
    offset = Number.isFinite(state.serverTime) ? state.serverTime-Date.now() : 0;
    node('note').textContent = state.note || fallback || app;
    node('deadline').textContent = deadline ? new Intl.DateTimeFormat(english?'en-GB':'th-TH',{dateStyle:'long',timeStyle:'short'}).format(deadline) : '';
    if (!active) {
      active = true; overlay.hidden = false;
      document.documentElement.dataset.maintenance = 'active';
      for (const child of document.body.children) if (child!==overlay && !['SCRIPT','STYLE','LINK'].includes(child.tagName)) child.inert = true;
      document.body.style.overflow = 'hidden';
      overlay.focus({preventScroll:true});
    }
    clearInterval(ticker);
    if (!document.hidden) ticker = setInterval(tick,1000);
    tick();
  }
  async function poll(force=false) {
    clearTimeout(timer);
    if (busy || document.hidden || !navigator.onLine) return;
    const waitUntil = Math.max(limitedUntil,force?0:nextPoll);
    if (Date.now()<waitUntil) {timer=setTimeout(poll,waitUntil-Date.now());return;}
    busy=true; node('button').disabled=true;
    try {
      const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action:'maintenanceStatus'}),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});
      if (response.status===429) {
        const retry=response.headers.get('Retry-After');
        const wait=retry?(/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-Date.now()):60000;
        limitedUntil=Date.now()+Math.max(wait||60000,60000); return;
      }
      if (!response.ok) throw new Error('Status unavailable');
      const data=await response.json();
      if (data.maintenance?.active===true) show(data.maintenance);
      else if (data.maintenance?.active===false && active) location.reload();
    } catch {if(active)node('foot').textContent=copy.offline;}
    finally {
      busy=false; node('button').disabled=false;
      nextPoll=Math.max(limitedUntil,Date.now()+60000);
      if(!document.hidden&&navigator.onLine)timer=setTimeout(poll,nextPoll-Date.now());
    }
  }
  node('button').addEventListener('click',()=>poll(true));
  document.addEventListener('click',event=>{
    if(active&&!overlay.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('focusin',event=>{if(active&&!overlay.contains(event.target))overlay.focus({preventScroll:true});});
  document.addEventListener('visibilitychange',()=>{
    clearTimeout(timer);clearInterval(ticker);
    if(!document.hidden){if(active){tick();ticker=setInterval(tick,1000);}poll();}
  });
  window.addEventListener('offline',()=>clearTimeout(timer));
  window.addEventListener('online',()=>poll());
  poll();
})();
