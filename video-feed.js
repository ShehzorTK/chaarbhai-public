/* Work scroll helpers, shared by the strips, the Photographs stage and Films (desktop mouse and trackpad only; phones keep native snapping).
   Input stays native. One interruptible glide settles onto a frame: cubic-bezier(.23,1,.32,1), no bounce, restarts from where it is. */
window.cbPaper=()=>document.documentElement.dataset.theme==='paper';   // Paper only: dark and light Work keep their original scrolling
window.cbDesk=()=>cbPaper()&&matchMedia('(hover:hover) and (pointer:fine)').matches;
window.cbGlide=(function(){
  const X1=.23,Y1=1,X2=.32,Y2=1,ease=t=>{let u=t;for(let i=0;i<6;i++){const x=3*(1-u)*(1-u)*u*X1+3*(1-u)*u*u*X2+u*u*u-t,d=3*(1-u)*(1-u)*X1+6*(1-u)*u*(X2-X1)+3*u*u*(1-X2);if(Math.abs(d)<1e-6)break;u-=x/d}return 3*(1-u)*(1-u)*u*Y1+3*(1-u)*u*u*Y2+u*u*u};
  const key=a=>a==='y'?'scrollTop':'scrollLeft';
  function glide(el,axis,to,ms,done){
    glide.stop(el);const k=key(axis),from=el[k];
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||ms<=0||Math.abs(to-from)<1){el[k]=to;done&&done();return}
    const t0=performance.now(),g=el._cbg={raf:0};
    const tick=now=>{
      if(el._cbg!==g)return;
      const t=Math.min(1,(now-t0)/ms);el[k]=from+(to-from)*ease(t);
      if(t<1)g.raf=requestAnimationFrame(tick);else{el._cbg=null;el[k]=to;done&&done()}
    };
    g.raf=requestAnimationFrame(tick);
  }
  glide.stop=el=>{if(el._cbg){cancelAnimationFrame(el._cbg.raf);el._cbg=null}};
  return glide;
})();
/* One slide per wheel gesture. take(dir) returns true when it starts a move (the wheel is then swallowed until the gesture ends:
   220ms with no wheel event), false to let the browser scroll natively (the first or last slide, so the page carries on). */
window.cbWheel=(el,gate,take)=>{
  let last=-1e9,own=false,gdir=0;
  el.addEventListener('wheel',e=>{
    if(e.ctrlKey||!window.cbDesk()||!gate())return;
    const dy=e.deltaY,dir=dy>0?1:-1;
    /* the tail of a gesture we own (trackpad momentum, any size) is swallowed whole: left native it nudges the page after the settle lands */
    if(own&&e.timeStamp-last<=220&&!(Math.abs(dy)>=8&&dir!==gdir&&Math.abs(dy)>Math.abs(e.deltaX))){last=e.timeStamp;e.preventDefault();return}
    if(Math.abs(e.deltaX)>Math.abs(dy)||Math.abs(dy)<2)return;
    last=e.timeStamp;gdir=dir;own=take(dir);
    if(own)e.preventDefault();
  },{passive:false});
};
/* Work page, Films view: a full-screen vertical feed of YouTube films.
   Data: window.VIDEOS (videos.js, built from drafts/videos/videos.json).
   Nothing here touches the network until Films is opened; the YouTube
   IFrame API is loaded once, on first open. Exposes window.VF. */
(function(){
'use strict';

const AUTO_ADVANCE=true;              // when a video ends, scroll to the next slide
const HASH='#/portfolio/films';
const SND_KEY='cb-vf-sound';

const dbg=m=>{if(window.cbLog)window.cbLog(m)};
const $=(s,r=document)=>r.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData=()=>!!(navigator.connection&&navigator.connection.saveData);
/* Phones get YouTube's 480px still (its black bars are cropped off by object-fit:cover) instead of the 1280px one,
   and a slide only fetches its still when it is next to the one on screen (within 2 on bigger screens). */
const PHONE=matchMedia('(max-width:700px)').matches||matchMedia('(pointer:coarse)').matches;
const thumbUrl=id=>'https://i.ytimg.com/vi/'+id+(PHONE?'/hqdefault.jpg':'/maxresdefault.jpg');
const thumbLo=id=>'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
const watchUrl=id=>'https://www.youtube.com/watch?v='+id;
const fmtDur=s=>{const m=Math.round(s/60),h=Math.floor(m/60),r=m%60;
  return h?(r?h+'h '+r+'m':h+'h'):(m?m+'m':s+'s')};

const I={
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>',
  off:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  full:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  unfull:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  on:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const readSound=()=>{try{return sessionStorage.getItem(SND_KEY)==='1'}catch(e){return false}};
const writeSound=on=>{try{sessionStorage.setItem(SND_KEY,on?'1':'0')}catch(e){}};

/* keep --hh (the site header's height) current, for the feed */
(function(){
  const h=document.getElementById('hdr');if(!h)return;
  let last=-1;                          // only write when it changes: a new value on <html> restyles the whole page
  const set=()=>{const v=h.offsetHeight;if(v!==last){last=v;document.documentElement.style.setProperty('--hh',v+'px');setTimeout(realign,0)}};   // later: S isn't declared yet on the first call
  set();   // the observer below catches every real change in the header's size, after layout (a window resize listener forced one)
  if(window.ResizeObserver)new ResizeObserver(set).observe(h);else addEventListener('resize',set);
})();

/* open the connections early (a few hundred ms saved on a phone) */
let warmed=false;
function warm(){
  if(warmed)return;warmed=true;
  ['https://www.youtube.com','https://i.ytimg.com'].forEach(h=>{
    const l=document.createElement('link');l.rel='preconnect';l.href=h;document.head.appendChild(l);
  });
  loadYT().catch(()=>{});
}
document.addEventListener('pointerdown',e=>{
  if(e.target.closest&&e.target.closest('a[href="'+HASH+'"]'))warm();
},{passive:true});

/* ---------- YouTube IFrame API, loaded once ---------- */
let ytP=null;
function loadYT(){
  if(ytP)return ytP;
  ytP=new Promise((res,rej)=>{
    if(window.YT&&window.YT.Player)return res(window.YT);
    const prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{if(prev)try{prev()}catch(e){}res(window.YT)};
    const s=document.createElement('script');
    s.src='https://www.youtube.com/iframe_api';
    s.onerror=()=>{ytP=null;rej(new Error('yt'))};
    document.head.appendChild(s);
  });
  return ytP;
}

/* ---------- the Photos | Films switch. There is one, in the site header, on Work only (app.js puts it there) ---------- */
function toggleHTML(active){
  const a=(v,href,label)=>`<a href="${href}"${active===v?' aria-current="true"':''}>${label}</a>`;
  return `<div class="wk-tog" role="group" aria-label="Work view">${a('photos','#/portfolio','Photographs')}<span class="sep" aria-hidden="true"></span>${a('videos',HASH,'Films')}<i class="ul" aria-hidden="true"></i></div>`;
}

/* The gold underline under the current word is one element that slides to it (transform only). Used by the switch
   and by the category line: `group` holds the items, an <i class="ul">, and the current item has aria-current. */
function moveUL(group){
  const ul=group&&group.querySelector('.ul'),cur=group&&group.querySelector('[aria-current="true"]');
  if(!ul||!cur||!cur.offsetWidth)return;
  group.style.setProperty('--x',cur.offsetLeft+'px');group.style.setProperty('--w',cur.offsetWidth);
  if(!ul.dataset.on)requestAnimationFrame(()=>{ul.dataset.on='1'});   // the first placement is not animated
}
function syncUL(){document.querySelectorAll('.wk-tog,.cl-in').forEach(moveUL)}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(syncUL);
{let w=innerWidth;addEventListener('resize',()=>{if(innerWidth!==w){w=innerWidth;syncUL()}},{passive:true})}

/* the category line, shared by Photographs and Films: items = [[index into WORK_CATS, first slide], ...] */
function catLineHTML(items,label){
  const cats=window.WORK_CATS||[];
  return `<div class="cl" role="group" aria-label="${label}"><div class="cl-in">${items.map(([k,first])=>
    `<button class="cl-b" type="button" data-cat="${k}" data-first="${first}">${esc(cats[k])}</button>`).join('')}<i class="ul" aria-hidden="true"></i></div></div>`;
}
/* make `k` the current category, scroll the line so it shows, slide the underline to it */
function markCat(root,k,reduce){
  const line=root.querySelector('.cl'),inn=root.querySelector('.cl-in');if(!line)return;
  inn.querySelectorAll('.cl-b').forEach(b=>{
    const on=+b.dataset.cat===k;
    b.classList.toggle('on',on);
    if(on){b.setAttribute('aria-current','true');
      line.scrollTo({left:b.offsetLeft-line.clientWidth/2+b.offsetWidth/2,behavior:reduce?'auto':'smooth'})}
    else b.removeAttribute('aria-current');
  });
  moveUL(inn);
}

/* keep the switch's highlight in step with the view */
function markToggle(view){
  document.querySelectorAll('.wk-tog a').forEach(a=>{
    if(a.getAttribute('href')===(view==='videos'?HASH:'#/portfolio'))a.setAttribute('aria-current','true');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('.wk-tog').forEach(moveUL);
}

/* ---------- state while the feed is open ---------- */
let S=null;

const curId=d=>d.mode==='hl'?d.it.highlight.id:d.it.fullFilm.id;
const typeWord=d=>d.mode==='hl'?'Highlight':'Full film';
const metaText=d=>{const b=d.it.label||d.ev.event;return d.mode==='ff'&&/film/i.test(b)?b:b+' · '+typeWord(d)};
const ariaText=d=>d.it.couple+', '+metaText(d).replace(' · ',' ');

/* the six film groups sit under the shared category names (see WORK_CATS in app.js) */
const CAT_OF={'shendi':'Henna','haldi-holud':'Henna','nikkah':'Ceremony','wedding-ceremony':'Ceremony',
  'reception-walima':'Reception','engagements-shoots':'Portraits'};
function flatten(){
  const out=[],cats=window.WORK_CATS||[];
  ((window.VIDEOS&&window.VIDEOS.events)||[]).forEach((ev,ei)=>ev.items.forEach(it=>{
    if(it.highlight||it.fullFilm)out.push({ev,ei,cat:Math.max(0,cats.indexOf(CAT_OF[ev.slug])),it,mode:it.highlight?'hl':'ff'});
  }));
  return out.map((d,n)=>[d,n]).sort((x,y)=>x[0].cat-y[0].cat||x[1]-y[1]).map(x=>x[0]);   // wedding-week order, same order inside
}
function indexOfId(data,id){
  for(let i=0;i<data.length;i++){
    const it=data[i].it;
    if(it.highlight&&it.highlight.id===id)return {i,mode:'hl'};
    if(it.fullFilm&&it.fullFilm.id===id)return {i,mode:it.highlight?'ff':'ff'};
  }
  return null;
}

function slideHTML(d,i){
  const id=curId(d),url=watchUrl(id);
  const film=d.it.highlight&&d.it.fullFilm;
  return `<section class="vf-slide" data-i="${i}" aria-label="${esc(ariaText(d))}">
  <div class="vf-wrap">
    <div class="vf-frame">
      <img class="vf-thumb" alt="" decoding="async" data-id="${id}">
      <div class="vf-mount"></div>
      <span class="vf-play" aria-hidden="true">${I.play}</span>
      <button class="vf-hit" type="button" aria-label="Play or pause"></button>
      <p class="vf-err" hidden>This one won't play here. <a href="${url}" target="_blank" rel="noopener">Watch it on YouTube</a></p>
      <button class="vf-sound" type="button" aria-label="Unmute" hidden>${I.off}</button>
      <span class="vf-unmute-prompt" hidden>Press here to unmute</span>
      <div class="vf-ctl">
        <button class="vf-mute" type="button" aria-label="Unmute">${I.off}</button>
        <button class="vf-seek" type="button" aria-label="Seek. Use the left and right arrow keys."><i></i></button>
        <button class="vf-fs" type="button" aria-label="Full screen">${I.full}</button>
        <a class="vf-yt" href="${url}" target="_blank" rel="noopener" aria-label="Watch on YouTube (opens in a new tab)">YouTube</a>
      </div>
    </div>
    <div class="vf-cap">
      <div class="vf-id">
        <h2 class="vf-name">${esc(d.it.couple)}</h2>
        <p class="vf-meta mono">${esc(metaText(d))}</p>
      </div>
      <div class="vf-act">
        ${film?`<button class="vf-film" type="button" data-mode="ff">Watch full film (${fmtDur(d.it.fullFilm.duration)})</button>`:''}
        <a class="vf-ytc" href="${url}" target="_blank" rel="noopener">Watch on YouTube<span class="vf-sr"> (opens in a new tab)</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* the Films menu: the same kind of opening as Photographs (a headline, a few sentences, the contents), above the feed */
function prologueHTML(data,catsOn){
  const ch=typeof CHAPTERS!=='undefined'?CHAPTERS:[],cats=window.WORK_CATS||[];
  return `<section class="pro" id="vf-pro" aria-labelledby="vf-pro-h"><div class="pro-in">
    <h1 class="pro-h" id="vf-pro-h">Press play on a wedding.</h1>
    <p class="pro-p">Every film here is one real wedding. Watch the highlight first, then the full film if you want the whole day. Scroll for the next film.</p>
    <ol class="pro-list">${catsOn.map(([k,first])=>{
      const c=ch.find(x=>x.short===cats[k]),n=data.filter(d=>d.cat===k).length;
      return `<li><button class="pro-row" type="button" data-first="${first}">
        <span class="pro-n">${esc(c?c.name:cats[k])}</span>
        <span class="pro-a">${esc(c?c.alt.split(' · ').slice(0,3).join(' · '):'')}</span>
        <span class="pro-c">${n} ${n===1?'film':'films'}</span></button></li>`}).join('')}
    </ol></div></section>`;
}

/* ---------- open / close ---------- */
function open(id){
  const host=document.getElementById('wk-videos');
  if(!window.VIDEOS||!host)return;
  if(S){ if(id){const f=indexOfId(S.data,id);if(f)jump(f.i,f.mode)} else scrollTo({top:0,behavior:'instant'}); return; }
  const data=flatten(); if(!data.length)return;
  const found=id?indexOfId(data,id):null;
  if(found)data[found.i].mode=found.mode;
  const startAt=found?found.i:0;

  if(window.PS)PS.suspend();
  document.body.classList.add('wk-switch-right');
  setTimeout(()=>document.body.classList.remove('wk-switch-right'),420);
  const root=document.createElement('div');
  root.id='vf';root.className='vf';
  const catsOn=[];data.forEach((d,i)=>{if(!catsOn.some(c=>c[0]===d.cat))catsOn.push([d.cat,i])});
  root.innerHTML=`<div class="vf-bar">${catLineHTML(catsOn,'Jump to a category of films')}</div>
    <div class="vf-feed">${data.map(slideHTML).join('')}</div>
    <p class="vf-sr" role="status" aria-live="polite"></p>`;
  root.classList.add('wk-in');host.textContent='';host.insertAdjacentHTML('beforeend',prologueHTML(data,catsOn));host.appendChild(root);host.hidden=false;markToggle('videos');warm();
  const ph=document.getElementById('wk-photos');if(ph)ph.hidden=true;
  document.body.classList.add('vf-on');

  S={data,root,feed:$('.vf-feed',root),slides:[...root.querySelectorAll('.vf-slide')],
     live:$('.vf-sr[role=status]',root),
     players:new Map(),active:-1,target:null,soundOn:readSound(),reduce:reduceMotion(),
     noAuto:reduceMotion()||saveData(),away:true,inView:false,host,lastEv:-1,deb:0,cand:-1,flashT:0,promptT:0};

  const drop=()=>{if(S)S.target=null};
  S.feed.addEventListener('wheel',drop,{passive:true});
  S.feed.addEventListener('touchstart',drop,{passive:true});
  /* desktop: one film per wheel or trackpad gesture, then a single settle. At the first or last film the wheel is left alone so the page carries on. */
  cbWheel(S.feed,()=>S&&!document.body.classList.contains('locked')&&!document.body.classList.contains('vf-full'),dir=>{
    if(!S.aligned&&S.feed.scrollTop<4){             // the menu is still partly showing: down carries the page to the first film, up carries on to the menu
      if(dir<0)return false;
      const hdr=document.getElementById('hdr'),top=S.root.getBoundingClientRect().top+scrollY-(S.headerGap||(hdr?hdr.offsetHeight:0));
      S.aligned=true;cbGlide(document.scrollingElement,'y',Math.max(0,top),360);return true;
    }
    const tops=S.slides.map(el=>el.offsetTop),y=S.feed.scrollTop;
    let cur=0;tops.forEach((t,i)=>{if(Math.abs(t-y)<Math.abs(tops[cur]-y))cur=i});
    const n=cur+dir;if(n<0||n>=tops.length)return false;
    S.target=n;scrollToSlide(n);return true;
  });
  root.addEventListener('click',onClick);
  S.pro=document.getElementById('vf-pro');
  reserveEntryLayout(S);
  // The prologue is an ordinary page section. Let the browser carry the first
  // gesture into the feed instead of intercepting wheel/touch events globally.
  if(S.pro)S.pro.addEventListener('click',e=>{const b=e.target.closest('.pro-row');if(!b)return;jump(+b.dataset.first);alignFeed(true)});
  root.addEventListener('load',onImg,true);
  root.addEventListener('error',onImg,true);
  root.addEventListener('keydown',onSeekKey);
  document.addEventListener('keydown',onKey);
  document.addEventListener('visibilitychange',onVis);
  S.io=new IntersectionObserver(es=>{
    es.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>=0.6)S.cand=+e.target.dataset.i});
    clearTimeout(S.deb);
    S.deb=setTimeout(()=>{if(S&&S.cand>=0)activate(S.cand)},150);
  },{root:S.feed,threshold:[0.6]});
  S.slides.forEach(el=>S.io.observe(el));
  /* the feed is one block in the page: it only plays while at least half of it is on screen */
  S.vio=new IntersectionObserver(es=>{
    const e=es[es.length-1];
    S.inView=e.intersectionRatio>=0.5;
    document.body.classList.toggle('vf-in',S.inView);
    if(S.inView){const h=document.getElementById('hdr');if(h)h.classList.remove('hide')}
    syncAway();
  },{threshold:[0,0.5]});
  S.vio.observe(root);
  S.onScroll=()=>{if(S&&!S.st){S.st=1;requestAnimationFrame(()=>{if(!S)return;S.st=0;const h=document.getElementById('hdr');S.aligned=Math.abs(S.root.getBoundingClientRect().top-(h?h.offsetHeight:0))<=3})}};
  addEventListener('scroll',S.onScroll,{passive:true});
  S.poll=setInterval(tick,250);
  dbg('vf open, '+data.length+' slides, phone='+PHONE);

  if(startAt>0)S.feed.scrollTo({top:S.slides[startAt].offsetTop,behavior:'instant'});
  activate(startAt);
  if(found)alignFeed(false);                       // a link to one video lands on it at once
  else scrollTo({top:0,behavior:'instant'});       // the Films tab lands on the menu, like Photographs
}

/* Something above the feed changed size after it was lined up (the web fonts arriving and rewrapping the heading,
   the header changing height, the phone turning): line it up again, if the feed is the thing on screen. */
function realign(){if(S&&S.aligned&&!S.entry&&!document.body.classList.contains('vf-full'))requestAnimationFrame(()=>alignFeed(false))}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(realign);
{let w=innerWidth;addEventListener('resize',()=>{if(innerWidth!==w){w=innerWidth;if(S)reserveEntryLayout(S);setTimeout(realign,250)}},{passive:true})}

function reserveEntryLayout(state){
  if(document.documentElement.dataset.theme!=='paper')return;
  const h=document.getElementById('hdr');if(!h)return;
  const solid=h.classList.contains('solid');
  h.classList.remove('solid');const expanded=h.offsetHeight;
  h.classList.add('solid');state.headerGap=h.offsetHeight;
  h.classList.toggle('solid',solid);
  state.root.style.setProperty('--hh',state.headerGap+'px');
  if(state.pro)state.pro.style.setProperty('--hh',expanded+'px');
}
const entryGap=()=>S.headerGap||(document.getElementById('hdr')?.offsetHeight||0);
function canEnter(){
  return S&&!document.body.classList.contains('locked')&&!document.body.classList.contains('vf-full')&&
    S.root.getBoundingClientRect().top>entryGap()+3;
}
function cancelEntry(){
  if(!S?.entry)return;
  cancelAnimationFrame(S.entry.frame);S.entry=null;
  scrollTo({top:scrollY,behavior:'instant'});
}
/* The first gesture travels the outer document to the first film. Its tail
   cannot advance the inner feed until this handoff lands and the input rests. */
function startEntry(){
  if(!S||S.entry)return;
  const state=S,entry=state.entry={frame:0,start:performance.now(),last:performance.now(),stable:0};
  alignFeed(true);
  const land=now=>{
    if(S!==state||state.entry!==entry)return;
    entry.stable=Math.abs(state.root.getBoundingClientRect().top-entryGap())<=3?entry.stable+1:0;
    if(entry.stable>=3&&now-entry.last>=180||now-entry.start>=1500){state.entry=null;return}
    entry.frame=requestAnimationFrame(land);
  };
  entry.frame=requestAnimationFrame(land);
}
function enterWheel(e){
  if(!S||e.ctrlKey||e.defaultPrevented||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  if(S.entry&&e.deltaY<0){cancelEntry();return}
  if(e.deltaY<=0||(!S.entry&&!canEnter()))return;
  if(!S.entry&&Math.abs(e.deltaY)<8)return;
  e.preventDefault();startEntry();if(S.entry)S.entry.last=performance.now();
}
function entryTouchStart(e){
  if(!S)return;
  const t=e.touches[0];S.entryTouch=canEnter()&&e.touches.length===1?{x:t.clientX,y:t.clientY,lastY:t.clientY}:null;
}
function entryTouchMove(e){
  if(!S?.entryTouch||e.touches.length!==1)return;
  const t=e.touches[0],touch=S.entryTouch,dy=touch.y-t.clientY,dx=touch.x-t.clientX,reverse=t.clientY-touch.lastY;touch.lastY=t.clientY;
  if(S.entry&&reverse>8){cancelEntry();S.entryTouch=null;return}
  if(dy<=12||Math.abs(dx)>Math.abs(dy)||(!S.entry&&!canEnter()))return;
  if(e.cancelable)e.preventDefault();startEntry();if(S.entry)S.entry.last=performance.now();
}

/* put the feed's top edge just under the site header, so it fills the screen */
function alignFeed(smooth){
  if(!S)return;
  const hdr=document.getElementById('hdr');
  const top=S.root.getBoundingClientRect().top+scrollY-(S.headerGap||(hdr?hdr.offsetHeight:0));
  S.aligned=true;
  scrollTo({top:Math.max(0,top),behavior:smooth&&!S.reduce?'smooth':'instant'});
}

function jump(i,mode){
  if(!S)return;
  const d=S.data[i];
  if(mode==='ff'&&d.it.highlight&&d.mode!=='ff'&&S.active!==i)d.mode='ff';
  S.feed.scrollTo({top:S.slides[i].offsetTop,behavior:'instant'});
  activate(i);
}

function close(opts){
  if(!S)return;
  if(isFull())exitFull();
  document.body.classList.add('wk-switch-left');
  setTimeout(()=>document.body.classList.remove('wk-switch-left'),420);
  const s=S; S=null;
  if(s.entry)cancelAnimationFrame(s.entry.frame);
  clearTimeout(s.deb);clearTimeout(s.flashT);clearTimeout(s.nbT);clearInterval(s.poll);
  s.io.disconnect();s.vio.disconnect();removeEventListener('scroll',s.onScroll);
  s.players.forEach(r=>kill(r));
  s.players.clear();
  document.removeEventListener('keydown',onKey);
  document.removeEventListener('visibilitychange',onVis);
  s.root.remove();const vp=document.getElementById('vf-pro');if(vp)vp.remove();s.host.hidden=true;markToggle('photos');
  const ph=document.getElementById('wk-photos');if(ph){ph.hidden=false;ph.classList.remove('wk-in');void ph.offsetWidth;ph.classList.add('wk-in')}
  document.body.classList.remove('vf-on','vf-in');
  if(opts&&opts.focus){
    scrollTo({top:0,behavior:'instant'});
    const a=$('#main .wk-tog a[aria-current]');if(a)a.focus({preventScroll:true});
  }
}

function pauseAll(){ if(S)S.players.forEach(r=>pause(r)); }

/* ---------- players ---------- */
function mount(k){
  if(!S)return null;
  if(S.players.has(k))return S.players.get(k);
  const d=S.data[k],holder=$('.vf-mount',S.slides[k]),div=document.createElement('div');
  holder.textContent='';holder.appendChild(div);
  dbg('vf mount '+k+' (players '+(S.players.size+1)+')');
  const r={k,vid:curId(d),ready:false,want:false,user:false,paused:false,resume:false,state:-2,yt:null,dead:false,guard:0};
  S.players.set(k,r);
  const st=S;
  loadYT().then(YT=>{
    if(r.dead||S!==st)return;
    const pv={autoplay:0,controls:0,rel:0,playsinline:1,iv_load_policy:3,disablekb:1,modestbranding:1};
    if(/^https?:/.test(location.origin))pv.origin=location.origin;
    r.yt=new YT.Player(div,{videoId:r.vid,width:'100%',height:'100%',playerVars:pv,
      events:{onReady:()=>onReady(r),onStateChange:e=>onState(r,e.data),onError:()=>onErr(r)}});
  }).catch(()=>{if(!r.dead&&S===st)onErr(r)});
  return r;
}
function frameOf(k){return $('.vf-frame',S.slides[k])}
function kill(r){
  r.dead=true;clearTimeout(r.guard);
  try{if(r.yt&&r.yt.destroy)r.yt.destroy()}catch(e){}
}
function destroy(k,keepMode){
  const r=S.players.get(k); if(!r)return;
  kill(r); S.players.delete(k);dbg('vf destroy '+k);
  const el=S.slides[k],fr=$('.vf-frame',el);
  $('.vf-mount',el).textContent='';
  fr.classList.remove('is-ready','is-playing','is-error');
  $('.vf-err',el).hidden=true;
  const d=S.data[k];
  if(!keepMode&&d.mode==='ff'&&d.it.highlight){d.mode='hl';refreshSlide(k)}
}
function refreshSlide(k){
  const d=S.data[k],el=S.slides[k],id=curId(d);
  el.setAttribute('aria-label',ariaText(d));
  $('.vf-meta',el).textContent=metaText(d);
  const im=$('.vf-thumb',el);im.dataset.id=id;delete im.dataset.lo;if(im.getAttribute('src'))im.src=thumbUrl(id);
  $$('.vf-yt,.vf-ytc',el).forEach(a=>a.href=watchUrl(id));
  const b=$('.vf-film',el);
  if(b){
    if(d.mode==='hl'){b.dataset.mode='ff';b.textContent='Watch full film ('+fmtDur(d.it.fullFilm.duration)+')'}
    else{b.dataset.mode='hl';b.textContent='Back to highlight'}
  }
}
function $$(s,r){return [...r.querySelectorAll(s)]}

function onReady(r){
  if(r.dead||!S)return;
  try{r.yt.getIframe().referrerPolicy='strict-origin-when-cross-origin'}catch(e){}
  dbg('vf ready '+r.k);
  r.ready=true;
  frameOf(r.k).classList.add('is-ready');
  if(S.active===r.k&&r.want){ if(S.away)r.resume=true; else startPlay(r); }
}
function onErr(r){
  if(r.dead||!S)return;
  const el=S.slides[r.k];
  el.querySelector('.vf-frame').classList.add('is-error');
  $('.vf-err',el).hidden=false;
  clearTimeout(r.guard);
}
function onState(r,s){
  if(r.dead||!S)return;
  r.state=s;
  const fr=frameOf(r.k);
  if(r.k!==S.active){ if(s===1)pause(r); fr.classList.remove('is-playing'); return; }
  if(s===1&&S.away){pause(r);r.resume=true;return}
  fr.classList.toggle('is-playing',s===1||s===3);
  if(s===1){fr.classList.remove('is-error');mountNeighbours()}
  if(s===0&&AUTO_ADVANCE)advance();
}
function startPlay(r){
  if(!S||!r.yt||!r.ready||r.dead)return;
  r.paused=false;r.want=true;
  try{
    if(S.soundOn){r.yt.unMute();r.yt.setVolume(100)}else r.yt.mute();
    r.yt.playVideo();
  }catch(e){}
  guard(r,0);
}
/* If a video with sound doesn't start within ~1s, fall back to muted play. Never leave it stuck. */
function guard(r,n){
  clearTimeout(r.guard);
  r.guard=setTimeout(()=>{
    if(!S||r.dead||S.active!==r.k||r.paused||document.hidden)return;
    let st;try{st=r.yt.getPlayerState()}catch(e){return}
    if(st===1)return;
    if(st===3&&n<3){guard(r,n+1);return}
    if(S.soundOn){S.soundOn=false;updateSound()}
    try{r.yt.mute();r.yt.playVideo()}catch(e){}
  },1000);
}
function pause(r){
  r.want=false;clearTimeout(r.guard);
  try{if(r.yt&&r.ready)r.yt.pauseVideo()}catch(e){}
}
function playActive(){
  if(!S)return;
  const r=S.players.get(S.active); if(!r)return;
  if(S.noAuto&&!r.user)return;      // reduced motion / data saver: wait for a tap
  r.want=true;
  if(S.away){r.resume=true;return}
  if(r.ready)startPlay(r);
}
/* Players live for the slide on screen and its neighbours. A phone keeps only the one on screen: each YouTube
   player is a whole web page, and two of them on top of the site is too much for an iPhone. On bigger screens the
   neighbours wait until the one on screen is playing (or 2.5s), so they don't slow its start. */
function keepSet(a){
  const n=S.data.length,keep=[a];
  if(PHONE)return keep;
  if(a+1<n)keep.push(a+1);
  if(a>0)keep.push(a-1);
  return keep;
}
function syncWindow(){
  const a=S.active,n=S.data.length;
  clearTimeout(S.nbT);
  if(S.noAuto){
    for(let k=0;k<n;k++){ if(k!==a)destroy(k); }
    return;
  }
  const keep=keepSet(a);
  for(let k=0;k<n;k++){ if(!keep.includes(k))destroy(k); }
  mount(a);
  S.nbDone=false;
  S.nbT=setTimeout(mountNeighbours,2500);
}
function mountNeighbours(){
  if(!S||S.nbDone||S.noAuto)return;
  S.nbDone=true;clearTimeout(S.nbT);
  keepSet(S.active).forEach(k=>{if(k!==S.active)mount(k)});
}

/* ---------- activation ---------- */
function loadThumbs(){
  const a=S.active;
  S.slides.forEach((el,k)=>{
    if(Math.abs(k-a)>(PHONE?1:2))return;
    const im=$('.vf-thumb',el);
    if(!im.getAttribute('src'))im.src=thumbUrl(im.dataset.id);
  });
}
function activate(i){
  if(!S||i<0||i>=S.data.length)return;
  if(S.target===i)S.target=null;      // arrived; a manual scroll clears it too (below)
  if(i===S.active)return;
  const prevEv=S.lastEv,d=S.data[i];
  dbg('vf active '+i+' '+curId(d));
  if(isFull())exitFull();
  S.active=i;
  S.players.forEach((r,k)=>{if(k!==i)pause(r)});
  syncWindow();loadThumbs();
  S.slides.forEach((el,k)=>{el.inert=k!==i;el.classList.toggle('is-active',k===i)});
  S.lastEv=d.ei;
  markCat(S.root,d.cat,S.reduce);
  if(prevEv!==d.ei)flash(i);
  S.live.textContent=ariaText(d);
  setHash();
  updateSound();
  playActive();
}
function flash(i){
  const fr=frameOf(i);
  clearTimeout(S.flashT);
  $$('.vf-flash',S.root).forEach(n=>n.remove());
  const f=document.createElement('div');
  f.className='vf-flash';f.setAttribute('aria-hidden','true');f.textContent=S.data[i].ev.event;
  fr.appendChild(f);
  S.flashT=setTimeout(()=>f.remove(),1600);
}
function setHash(){
  const h=HASH+'/'+curId(S.data[S.active]);
  if(location.hash===h)return;
  try{history.replaceState(history.state,'',location.pathname+location.search+h)}catch(e){}
}

/* ---------- moving between slides ---------- */
/* instant: keys and chips never animate. Glide (desktop): one interruptible 360ms settle. Phones keep the native smooth scroll and snap. */
function scrollToSlide(n,instant){
  const top=S.slides[n].offsetTop;
  if(instant&&cbPaper()){cbGlide.stop(S.feed);S.feed.scrollTo({top,behavior:'instant'});return}
  if(cbDesk())cbGlide(S.feed,'y',top,360);
  else S.feed.scrollTo({top,behavior:S.reduce?'auto':'smooth'});
}
function step(d,instant){
  const base=S.target!=null?S.target:S.active;
  const n=Math.max(0,Math.min(S.data.length-1,base+d));
  if(n===base)return;
  S.target=n;scrollToSlide(n,instant);
}
function advance(){
  const n=S.active+1;
  if(n<S.data.length){S.target=n;scrollToSlide(n)}
}

/* ---------- play, pause, sound ---------- */
function tickIcon(kind){
  const fr=frameOf(S.active);
  $$('.vf-tick',fr).forEach(n=>n.remove());
  const t=document.createElement('span');
  t.className='vf-tick';t.setAttribute('aria-hidden','true');t.innerHTML=kind==='pause'?I.pause:I.play;
  fr.appendChild(t);setTimeout(()=>t.remove(),650);
}
function toggle(){
  if(!S)return;
  let r=S.players.get(S.active);
  if(!r){r=mount(S.active);r.want=true;r.user=true;tickIcon('play');return}
  r.user=true;
  if(!r.ready){r.want=!r.want;return}
  if(r.state===1||r.state===3){r.paused=true;r.want=false;clearTimeout(r.guard);try{r.yt.pauseVideo()}catch(e){}tickIcon('pause')}
  else{startPlay(r);tickIcon('play')}
}
function setSound(on){
  S.soundOn=on;writeSound(on);
  const r=S.players.get(S.active);
  if(r&&r.ready&&r.yt){
    try{
      if(on){r.yt.unMute();r.yt.setVolume(100)}else r.yt.mute();
    }catch(e){}
    if(on&&r.state!==1&&r.state!==3&&!r.paused)startPlay(r);
  }
  updateSound();
}
function updateSound(){
  if(!S)return;
  const r=S.players.get(S.active);
  S.slides.forEach((el,k)=>{
    const pill=$('.vf-sound',el),mute=$('.vf-mute',el);
    const show=k===S.active&&!S.soundOn&&!(S.noAuto&&!(r&&r.user));
    pill.hidden=!show;
    pill.setAttribute('aria-label',S.soundOn?'Mute':'Unmute');
    const prompt=$('.vf-unmute-prompt',el);if(prompt)prompt.hidden=!show;
    mute.innerHTML=S.soundOn?I.on:I.off;
    mute.setAttribute('aria-label',S.soundOn?'Mute':'Unmute');
  });
  clearTimeout(S.promptT);if(r&&!S.soundOn){S.promptT=setTimeout(()=>{const p=frameOf(S.active)?.querySelector('.vf-unmute-prompt');if(p)p.hidden=true},3200)}
}
function swapFilm(k,mode){
  const d=S.data[k]; if(!(d.it.highlight&&d.it.fullFilm))return;
  d.mode=mode;refreshSlide(k);
  const id=curId(d);
  if(mode==='ff'){S.soundOn=true;writeSound(true)}   // the click is a user gesture
  const r=S.players.get(k);
  if(r&&r.ready&&r.yt&&!r.dead){
    r.vid=id;r.paused=false;r.want=true;r.user=true;
    try{
      if(mode==='ff'){r.yt.unMute();r.yt.setVolume(100)}
      r.yt.loadVideoById(id);
    }catch(e){}
    frameOf(k).classList.remove('is-error');$('.vf-err',S.slides[k]).hidden=true;
    guard(r,0);
  }else{
    if(r)destroy(k,true);
    const n=mount(k);n.want=true;n.user=true;
  }
  setHash();updateSound();
}

/* ---------- progress ---------- */
function tick(){
  if(!S||document.hidden)return;
  const r=S.players.get(S.active);
  if(!r||!r.ready||r.state!==1)return;
  try{
    const c=r.yt.getCurrentTime(),t=r.yt.getDuration();
    if(t>0)$('.vf-seek',S.slides[S.active]).style.setProperty('--p',Math.min(1,c/t)*100+'%');
  }catch(e){}
}
function seekBy(secs){
  const r=S.players.get(S.active); if(!r||!r.ready)return;
  try{const t=r.yt.getDuration();r.yt.seekTo(Math.max(0,Math.min(t,r.yt.getCurrentTime()+secs)),true)}catch(e){}
}

/* ---------- full screen ----------
   Desktop, Android and iPad use the browser's real full screen on the player's frame. iPhone Safari only allows that
   for a bare <video>, never a YouTube player, so there the frame is laid over the whole page instead (turn the phone
   sideways and it fills the screen). Moving to another film, Escape, or the button again leaves it. */
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
function isFull(){return !!(fsEl()||(S&&S.root.querySelector('.vf-frame.is-full')))}
function markFull(on){
  if(!S)return;
  S.slides.forEach(el=>{const b=$('.vf-fs',el);b.innerHTML=on?I.unfull:I.full;b.setAttribute('aria-label',on?'Exit full screen':'Full screen')});
}
function enterFull(){
  if(!S)return;const fr=frameOf(S.active);
  const real=document.fullscreenEnabled&&fr.requestFullscreen?()=>fr.requestFullscreen()
    :document.webkitFullscreenEnabled&&fr.webkitRequestFullscreen?()=>fr.webkitRequestFullscreen():null;
  const pseudo=()=>{fr.classList.add('is-full');document.body.classList.add('vf-full');markFull(true)};
  if(real){try{const p=real();if(p&&p.catch)p.catch(pseudo)}catch(e){pseudo()}}
  else pseudo();
  const r=S.players.get(S.active);if(r)r.user=true;
}
function exitFull(){
  if(fsEl()){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}}
  if(S)S.root.querySelectorAll('.vf-frame.is-full').forEach(f=>f.classList.remove('is-full'));
  document.body.classList.remove('vf-full');markFull(false);
  setTimeout(realign,60);   // the phone may have turned while it was full screen
}
['fullscreenchange','webkitfullscreenchange'].forEach(t=>document.addEventListener(t,()=>{const f=isFull();markFull(f);if(!f)setTimeout(realign,60)}));

/* ---------- events ---------- */
function onClick(e){
  if(!S)return;
  const t=e.target;
  const chip=t.closest('.cl-b');
  if(chip){scrollTo_(+chip.dataset.first);return}
  if(t.closest('.vf-hit')){toggle();return}
  if(t.closest('.vf-sound')){setSound(true);return}
  if(t.closest('.vf-mute')){setSound(!S.soundOn);return}
  if(t.closest('.vf-fs')){isFull()?exitFull():enterFull();return}
  const sk=t.closest('.vf-seek');
  if(sk){
    if(e.detail===0)return;                       // a keyboard click; the arrow keys do the seeking
    const r=S.players.get(S.active); if(!r||!r.ready)return;
    const b=sk.getBoundingClientRect();
    try{const dur=r.yt.getDuration();if(dur>0){r.yt.seekTo(dur*Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),true);tick()}}catch(x){}
    return;
  }
  const fb=t.closest('.vf-film');
  if(fb){swapFilm(S.active,fb.dataset.mode);return}
}
function scrollTo_(n){ if(n>=0&&n<S.data.length){S.target=n;scrollToSlide(n,cbPaper())} }
function onSeekKey(e){
  if(!S||!e.target.closest||!e.target.closest('.vf-seek'))return;
  if(e.key==='ArrowRight'){e.preventDefault();seekBy(5)}
  else if(e.key==='ArrowLeft'){e.preventDefault();seekBy(-5)}
}
function onKey(e){
  if(S&&e.key==='Escape'&&document.body.classList.contains('vf-full')){exitFull();return}
  if(!S||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey)return;
  const t=e.target;
  if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
  if(document.body.classList.contains('locked'))return;   // the mobile menu is open
  const k=e.key;
  /* on the menu above the feed, Down / PageDown / Space carry the page to the first film in one go */
  if(S.away&&!document.hidden&&(k==='ArrowDown'||k==='PageDown'||(k===' '&&!(t.closest&&t.closest('button,a,[role="button"]'))))){
    const h=document.getElementById('hdr'),top=S.root.getBoundingClientRect().top-(h?h.offsetHeight:0);
    if(top>4){e.preventDefault();if(!S.keyLock){S.keyLock=1;setTimeout(()=>{if(S)S.keyLock=0},800);alignFeed(true)}}
    return;
  }
  if(S.away)return;                                      // the feed isn't on screen
  if((k==='ArrowUp'||k==='PageUp')&&S.active===0&&S.aligned){       // Up on the first film goes back to the menu
    e.preventDefault();scrollTo({top:0,behavior:S.reduce?'instant':'smooth'});S.aligned=false;return;
  }
  if(k==='ArrowDown'||k==='j'||k==='PageDown'){e.preventDefault();step(1,cbPaper())}
  else if(k==='ArrowUp'||k==='k'||k==='PageUp'){e.preventDefault();step(-1,cbPaper())}
  else if(k===' '||k==='Spacebar'){
    if(t&&t.closest&&t.closest('button,a,[role="button"]'))return;   // a focused button keeps its own Space
    e.preventDefault();toggle();
  }
  else if(k==='m'||k==='M'){setSound(!S.soundOn)}
  else if(k==='f'||k==='F'){isFull()?exitFull():enterFull()}
}
/* away = the tab is hidden, or less than half the feed is on screen */
function syncAway(){
  if(!S)return;
  const away=document.hidden||!S.inView;
  if(away===S.away)return;
  S.away=away;
  const r=S.players.get(S.active);
  if(away){
    if(r){r.resume=r.resume||((r.state===1||r.state===3)&&!r.paused);pause(r);r.want=false}
  }else if(r&&r.resume&&!r.paused){
    r.resume=false;
    if(!S.noAuto||r.user)startPlay(r);
  }
}
function onVis(){syncAway()}
/* thumbnails: YouTube answers a missing maxres image with a 120px placeholder */
function onImg(e){
  const im=e.target;
  if(!im||!im.classList||!im.classList.contains('vf-thumb')||im.dataset.lo)return;
  if(e.type==='error'||im.naturalWidth===120){im.dataset.lo='1';im.src=thumbLo(im.dataset.id)}
}

window.VF={toggleHTML,open,close,pauseAll,isOpen:()=>!!S,moveUL,syncUL,catLineHTML,markCat};
})();
