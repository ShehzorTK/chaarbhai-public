/* Work page, Photographs view: a stage that snaps one couple at a time. It is part of the page, not a scroller of its own,
   so the wheel, a swipe or the keys scroll it the same wherever the pointer is, and scrolling back up always reaches the prologue.
   A slide is about 84% of the stage, so the next couple peeks in underneath. Only the active slide and its two
   neighbours hold a strip and real pictures (the page killed iPhone Safari before, see app.js photoWindow);
   every other slide is its heading and an empty box of the same height.
   Uses CHAPTERS, pic(), sequences(), dragScroll(), warmRow() and coolRow() from app.js, at call time.
   Exposes window.PS. */
(function(){
'use strict';

let S=null;
const $=(s,r)=>r.querySelector(s);

/* one entry per slide, in category order (app.js already dropped couples with 3 frames or fewer): each category opens
   with a chapter-opener slide, then one slide per couple */
function flat(){
  const out=[];
  CHAPTERS.forEach((c,ci)=>{
    out.push({open:true,c,ci});
    c.seqs.forEach(q=>out.push({c,ci,q}));
  });
  return out;
}
const catIndex=c=>(window.WORK_CATS||[]).indexOf(c.short);

/* the prologue: a person talking, the contents (which is also the way in), and a cut-short bottom so the stage peeks in */
function prologueHTML(){
  return `<section class="pro" id="pro" aria-labelledby="pro-h">
  <div class="pro-in">
    <h1 class="pro-h" id="pro-h">Come meet the couples.</h1>
    <p class="pro-p">Every couple here is a real client. We start with portraits, then follow the wedding week as it happened, from the first night to the farewell. Swipe sideways for more of a couple. Scroll for the next one.</p>
    <ol class="pro-list">${CHAPTERS.map(c=>`
      <li><button class="pro-row" type="button" data-ch="${c.id}">
        <span class="pro-n">${esc(c.name)}</span>
        <span class="pro-a">${esc(c.alt.split(' · ').slice(0,3).join(' · '))}</span>
        <span class="pro-c">${c.seqs.length} ${c.seqs.length===1?'couple':'couples'}</span>
      </button></li>`).join('')}
    </ol>
  </div>
</section>`;
}

function openerHTML(d){
  const c=d.c;
  return `<div class="ps-open-in">
    <h2 class="ps-oname">${esc(c.name)}</h2>
    <p class="ps-oalt">${esc(c.alt)}</p>
    <p class="ps-odesc">${esc(c.desc)}</p>
  </div>`;
}
function headHTML(d){
  const q=d.q;
  return `<div class="ps-head"><div class="ps-id"><h3 class="ps-name">${q.couple}</h3>
    <p class="ps-tags">${q.tags.map(esc).join(' · ')}</p></div></div>`;
}
/* what a live slide holds: the sideways strip, one caption line with the count, and the progress bar */
function bodyHTML(d){
  const q=d.q;
  return `<div class="seq-strip">${q.frames.map(f=>`
    <figure class="frame" style="--ar:${f.ar}">
      <div class="fr-img" tabindex="0" role="button" aria-label="Open larger: ${esc(f.cap)}">${pic(f,'(max-width: 600px) 90vw, 620px',{parked:true})}</div>
      <figcaption class="fr-cap vf-sr"><span>${f.cap}</span></figcaption>
    </figure>`).join('')}</div>
  <div class="ps-foot">
    <p class="ps-cap-t"></p>
    <span class="seq-count">1 of ${q.frames.length}</span>
    <span class="ps-arrows"><button class="sq-prev" type="button" aria-label="Previous frame" disabled>${ARROW('l')}</button>
    <button class="sq-next" type="button" aria-label="Next frame">${ARROW('r')}</button></span>
  </div>
  <div class="seq-bar"><i></i></div>`;
}

function html(){
  const data=flat();if(data.length<2)return '';
  const cats=[];data.forEach((d,i)=>{const k=catIndex(d.c);if(!cats.some(x=>x[0]===k))cats.push([k,i])});
  const feedPreview=new URLSearchParams(location.search).get('photos-scroll')==='feed';
  return prologueHTML()+`<div class="ps wk-in${feedPreview?' ps-internal':''}" id="ps" data-n="${data.length}">
  <div class="ps-groundwrap" aria-hidden="true"><i class="ps-ground"></i></div>
  <div class="ps-bar">${VF.catLineHTML(cats,'Jump to a category of photographs')}</div>
  <div class="ps-feed" role="region" aria-label="Photographs, one couple at a time">${data.map((d,i)=>d.open
    ?`<article class="ps-slide ps-open" data-i="${i}" aria-label="${esc(d.c.name)}">${openerHTML(d)}</article>`
    :`<article class="seq ps-slide" data-i="${i}" data-label="${esc([d.q.couple,...d.q.tags].join(' · '))}" aria-label="${esc(d.q.couple+', '+d.c.name)}">${headHTML(d)}<div class="ps-body"></div></article>`).join('')}
    <div class="ps-end" aria-hidden="true"></div></div>
  <p class="vf-sr" role="status" aria-live="polite"></p>
</div>`;
}

/* The ground's tint. Each slide carries a final ground colour (tints.py makes them). The stage sets one CSS
   variables on the page when a slide settles and the CSS eases the background (800ms, ease-out quint). Only the couple on
   screen sets it: hovering a category, a contents row or a photograph changes nothing. */
/* only a couple's slide has a colour (its own, else its chapter's): the prologue and the chapter openers stay the site's navy */
const tintOf=d=>d.open?null:((d.q&&d.q.t)||d.c.tint||null);
/* Light mode takes the same hue as the dark ground, as a pale shade (OKLCH L .955, chroma under .02: as quiet as the dark one) */
const lin=v=>(v/=255)<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4),gam=v=>255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055);
function lightOf(hex){
  const n=parseInt(hex.slice(1),16),r=lin(n>>16&255),g=lin(n>>8&255),b=lin(n&255);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),q=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const A=1.9779984951*l-2.428592205*m+.4505937099*q,B=.0259040371*l+.7827717662*m-.808675766*q,h=Math.atan2(B,A);
  let C=Math.min(.018,Math.max(.008,Math.hypot(A,B)+.002));
  for(let k=0;k<12;k++,C*=.85){
    const a=C*Math.cos(h),bb=C*Math.sin(h),L=.955,l3=Math.pow(L+.3963377774*a+.2158037573*bb,3),m3=Math.pow(L-.1055613458*a-.0638541728*bb,3),s3=Math.pow(L-.0894841775*a-1.291485548*bb,3);
    const c=[4.0767416621*l3-3.3077115913*m3+.2309699292*s3,-1.2684380046*l3+2.6097574011*m3-.3413193965*s3,-.0041960863*l3-.7034186147*m3+1.707614701*s3];
    if(c.every(v=>v>=0&&v<=1))return '#'+c.map(v=>Math.round(gam(v)).toString(16).padStart(2,'0')).join('');
  }
  return null;
}
function setTint(t){
  if(!S||S.notint||document.documentElement.dataset.theme==='paper')return;   // Paper: the Work page keeps one colour, no tinted grounds
  const st=S.host.style;
  if(t){st.setProperty('--tint',t.g);const lt=t.lt||(t.lt=lightOf(t.g));if(lt)st.setProperty('--tint-l',lt);else st.removeProperty('--tint-l')}
  else{st.removeProperty('--tint');st.removeProperty('--tint-l')}
}

/* the ground only takes the colour while the stage is up under the header; the menu above it stays navy */
function applyTint(){
  if(!S)return;
  const t=S.inStage?S.tintNow:null,k=t?t.g:'';
  if(S.tintApplied===k)return;
  S.tintApplied=k;setTint(t);
}

function warm(i){
  const el=S.slides[i];if(!el||el._live||S.data[i].open)return;
  el._live=true;
  $('.ps-body',el).innerHTML=bodyHTML(S.data[i]);
  sequences([el]);dragScroll([$('.seq-strip',el)]);
  warmRow(el);
}
function cool(i){
  const el=S.slides[i];if(!el||!el._live)return;
  el._live=false;
  coolRow(el);
  $('.ps-body',el).textContent='';
}
function activate(i,entrance=true){
  if(!S||i<0||i>=S.data.length)return;
  const changed=i!==S.active;
  const pv=S.active;S.active=i;
  if(changed){
    if(pv>=0){S.slides[pv].inert=true;S.slides[pv].classList.remove('is-active','is-jump')}
    S.slides[i].inert=false;
    S.slides[i].classList.toggle('is-jump',!entrance);
    S.slides[i].classList.add('is-active');
  }
  // Release old strips before warming the new neighbourhood. A jump may have
  // prepared one distant strip; cancellation restores the same three-slot window.
  S.slides.forEach((el,k)=>{if(el._live&&Math.abs(k-i)>1)cool(k)});
  for(let k=Math.max(0,i-1);k<=Math.min(S.slides.length-1,i+1);k++)warm(k);
  if(!changed)return;
  const d=S.data[i];
  S.tintNow=tintOf(d);applyTint();
  VF.markCat(S.root,catIndex(d.c),S.reduce);
  S.live.textContent=d.open?d.c.name:d.q.couple+', '+d.c.name;
  if(window.cbLog)cbLog('ps active '+i+', live '+S.slides.filter(e=>e._live).length);
}

/* where the page must be scrolled for slide i to sit just under the header and the category line */
const headH=()=>{const h=document.getElementById('hdr');return h?h.offsetHeight:0};
const slideTop=i=>S.slides[i].getBoundingClientRect().top+scrollY-headH()-S.bar.offsetHeight;
const feedTop=(state,i)=>state.slides[i].getBoundingClientRect().top-state.feed.getBoundingClientRect().top+state.feed.scrollTop-(state.contained?headH()+state.bar.offsetHeight:0);

/* The header condenses as the document starts moving. Its live --hh must not
   resize every slide while Safari is travelling to a chapter. Each region
   reserves the header state it actually appears beneath; the header itself
   keeps its existing condensed appearance and behaviour. */
function sizeLayout(state){
  state.layoutWidth=innerWidth;
  if(document.documentElement.dataset.theme!=='paper'||state.internal)return;
  const h=document.getElementById('hdr');if(!h)return;
  const solid=h.classList.contains('solid');
  h.classList.remove('solid');const expanded=h.offsetHeight;
  h.classList.add('solid');const condensed=h.offsetHeight;
  h.classList.toggle('solid',solid);
  state.root.style.setProperty('--hh',condensed+'px');
  const pro=document.getElementById('pro');if(pro)pro.style.setProperty('--hh',expanded+'px');
}

/* The first couple peeks below an opener. Prepare it at the start of a jump
   when an offscreen source slot is available, otherwise as it approaches. Never exceed three live
   strips, or clear the current story while it remains the active selection. */
function prepareLanding(state,i,early=false){
  const next=i+1,slide=state.slides[next];
  if(!slide||slide._live||state.data[next].open)return;
  const r=state.slides[i].getBoundingClientRect();
  if(!early&&(r.top>innerHeight*2||r.bottom<-innerHeight))return;
  const edge=headH()+state.bar.offsetHeight;
  state.slides.forEach((el,k)=>{
    if(!el._live||k===state.active||k===next)return;
    const box=el.getBoundingClientRect();
    if(box.bottom<=edge||box.top>=innerHeight)cool(k);
  });
  if(state.slides.filter(el=>el._live).length<3)warm(next);
}

/* Decode the landing photos before the journey, rather than creating a strip
   and starting image decoding during the fastest part of a distant scroll. */
function decodeLanding(state,i,jump){
  if(jump.ready)return;
  const slide=state.slides[i+1];if(!slide||!slide._live)return;
  const images=[...slide.querySelectorAll('.fr-img img')].slice(0,2);
  if(!images.length){jump.loaded=true;return}
  jump.ready=Promise.allSettled(images.map(im=>{
    if(im.dataset.on!=='1')hydrate(im);
    if(im.decode)return im.decode();
    if(im.complete)return Promise.resolve();
    return new Promise(resolve=>{im.addEventListener('load',resolve,{once:true});im.addEventListener('error',resolve,{once:true})});
  })).then(()=>{jump.loaded=true});
}
function clearVeil(state,immediate=false){
  const veil=state.veil;if(!veil)return;
  clearTimeout(veil.wait);clearTimeout(veil.exit);
  if(immediate){veil.el.remove();state.veil=null;return}
  veil.el.classList.remove('is-moving');
  veil.exit=setTimeout(()=>{veil.el.remove();if(state.veil===veil)state.veil=null},180);
}
function beginLanding(state,i,jump,smooth){
  clearVeil(state,true);
  prepareLanding(state,i,true);decodeLanding(state,i,jump);
  if(!smooth||state.reduce||state.internal||Math.abs(slideTop(i)-scrollY)<innerHeight*2)return;
  const el=document.createElement('i');el.className='ps-jump-veil';el.setAttribute('aria-hidden','true');
  state.root.appendChild(el);state.veil={el,jump,wait:0,exit:0};
  requestAnimationFrame(()=>{if(state.veil?.jump===jump)el.classList.add('is-moving')});
}

/* Once entered, the preview has one native vertical scroll owner, including
   gestures on its fixed header and rail. Restore those nodes before hiding or
   replacing Work; their existing listeners and navigation remain intact. */
function containFeed(state){
  if(!state.internal||state.contained)return;
  state.pageY=scrollY;
  state.header=document.getElementById('hdr');
  state.headerHome=document.createComment('Photos header return point');
  state.header.before(state.headerHome);
  state.contained=true;
  const pro=document.getElementById('pro');if(pro)pro.inert=true;
  state.feed.prepend(state.header,state.bar);
  state.root.classList.add('ps-contained');
  document.body.classList.add('ps-viewing');
  document.documentElement.classList.add('ps-viewing');
  state.header.classList.remove('hide');
  if(!state.jump)observe();
}
function releaseFeed(){
  if(!S)return;
  S.suspended=true;
  finishJump(S,false);clearVeil(S,true);
  document.documentElement.classList.remove('snap-y');
  if(!S.contained)return;
  const state=S;
  state.headerHome.replaceWith(state.header);
  state.root.insertBefore(state.bar,state.feed);
  state.root.classList.remove('ps-contained');
  state.contained=false;
  const pro=document.getElementById('pro');if(pro)pro.inert=false;
  document.body.classList.remove('ps-viewing');
  document.documentElement.classList.remove('ps-viewing');
  scrollTo({top:state.pageY,behavior:'instant'});
}

/* Keep the working smooth, feed-rooted category handoff. */
function goFeed(state,i,smooth){
  const jump=state.jump={frame:0,start:performance.now(),stable:0};
  state.cand=i;
  if(state.io){state.io.disconnect();state.io.takeRecords()}
  containFeed(state);
  const behavior=smooth&&!state.reduce?'smooth':'instant';
  state.feed.scrollTo({top:feedTop(state,i),behavior});
  const land=now=>{
    if(S!==state||state.jump!==jump)return;
    if(!shown()){finishJump(state);return}
    const top=Math.min(feedTop(state,i),Math.max(0,state.feed.scrollHeight-state.feed.clientHeight));
    jump.stable=Math.abs(state.feed.scrollTop-top)<=2?jump.stable+1:0;
    prepareLanding(state,i);
    if(jump.stable>=3){activate(i,false);finishJump(state);return}
    if(now-jump.start>=3000){finishJump(state);return}
    jump.frame=requestAnimationFrame(land);
  };
  jump.frame=requestAnimationFrame(land);
}

/* A category jump owns the selection until the page has actually landed. Safari can
   keep an old snap target through layout changes and queued observer callbacks. */
function finishJump(state,resume=true){
  if(!state.jump)return;
  const jump=state.jump;cancelAnimationFrame(jump.frame);state.jump=null;
  if(!resume)clearVeil(state,true);
  else if(state.veil?.jump===jump){
    if(jump.loaded||!jump.ready)clearVeil(state);
    else{
      const veil=state.veil,release=()=>{if(state.veil===veil)clearVeil(state)};
      jump.ready.then(release,release);
      veil.wait=setTimeout(release,800); // A failed/stalled photo must not leave the scene obscured.
    }
  }
  if(resume&&S===state){observe();measure()}
}
function cancelJump(){if(S){clearVeil(S,true);if(S.jump)finishJump(S)}}

/* open on a category, instantly; ordinary Work entry stays on the prologue */
function go(id,smooth){
  if(!S)return;
  S.suspended=false;
  let i=0;
  if(id){const k=S.data.findIndex(d=>d.c.id===id);if(k>=0)i=k}
  const state=S;
  finishJump(state,false);
  clearTimeout(state.deb);
  if(!id&&!smooth){activate(i);onScroll();return}
  if(state.internal){goFeed(state,i,smooth);return}
  const jump=state.jump={frame:0,start:performance.now(),stable:0,scrolled:false,activated:false,activatedAt:0};
  if(state.io){state.io.disconnect();state.io.takeRecords()}
  beginLanding(state,i,jump,smooth);
  // Openers already exist. Keep the current strips intact until the native
  // scroll has landed, so their replacement cannot re-snap the old destination
  // before the browser has established the requested opener as its destination.
  state.cand=i;
  const land=now=>{
    if(S!==state||state.jump!==jump)return;
    if(!shown()){finishJump(state);return}
    if(!jump.scrolled){
      jump.scrolled=true;
      state.slides[i].scrollIntoView({behavior:smooth&&!state.reduce?'smooth':'instant',block:'start',inline:'nearest'});
      measure();
    }
    const max=Math.max(0,state.host.scrollHeight-innerHeight);
    const top=Math.max(0,Math.min(max,slideTop(i)));
    const landed=Math.abs(scrollY-top)<=2;
    prepareLanding(state,i);
    decodeLanding(state,i,jump);
    jump.stable=landed?jump.stable+1:0;
    if(now-jump.start>=(smooth&&!state.reduce?3000:1200)){finishJump(state);return}
    if(!jump.activated&&jump.stable>=3&&now-jump.start>=180){
      // Only now replace neighbouring strips and update the category marker.
      // Keep observer ownership through a short post-activation landing check.
      jump.activated=true;jump.activatedAt=now;jump.stable=0;
      activate(i,false);measure();
    }else if(jump.activated&&jump.stable>=3&&now-jump.activatedAt>=180){
      finishJump(state);return;
    }
    // Unexpected landings are observed, never chased with another scroll or a
    // snap-property change. Manual gestures still release ownership immediately.
    onScroll();jump.frame=requestAnimationFrame(land);
  };
  jump.frame=requestAnimationFrame(()=>{
    if(S===state&&state.jump===jump)jump.frame=requestAnimationFrame(land);
  });
}

/* what the page's position means for the stage: is it under the header, should it snap, has the prologue tucked away.
   One cheap read per frame while the page scrolls. */
function measure(){
  if(!S)return;
  S.tick=0;
  if(!shown())return;
  const r=S.root.getBoundingClientRect(),hh=headH(),vh=innerHeight;
  if(S.internal&&!S.contained&&r.top<=hh+1&&r.bottom>hh+S.bar.offsetHeight)containFeed(S);
  S.inStage=S.contained||(r.top<=hh+1&&r.bottom>hh+S.bar.offsetHeight);                   // the stage is up under the header
  applyTint();
  // The internal stage no longer pulls the document through a tall photo page.
  // Keep the opening contents visible until they have passed behind the header.
  S.tucked=S.internal?r.top<=hh:r.top<=vh*.5;
  document.body.classList.toggle('vf-in',S.inStage);
  if(S.inStage){const h=document.getElementById('hdr');if(h)h.classList.remove('hide')}
  /* hard snapping, one slide per swipe, only while the stage fills the screen: elsewhere (prologue, footer) the page scrolls freely */
  document.documentElement.classList.toggle('snap-y',!S.internal&&S.inStage&&r.bottom>=vh-4);
  const pro=document.getElementById('pro');if(pro)pro.classList.toggle('tucked',S.tucked);
}
/* Scrolling is the browser's own. The page snaps one slide at a time only while the stage fills the screen (html.snap-y, set in
   measure()); the menu above it scrolls freely. Left and Right step the photographs of the couple on screen. */
const shown=()=>S&&!S.suspended&&S.root.getClientRects().length>0&&!document.body.classList.contains('vf-on');
function onKey(e){
  const k=e.key;
  if((k!=='ArrowRight'&&k!=='ArrowLeft')||!shown()||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||!S.inStage||S.active<0)return;
  const t=e.target;
  if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||(t.closest&&t.closest('.seq-strip'))))return;   // a focused strip scrolls itself
  if(document.documentElement.classList.contains('lb-open')||document.body.classList.contains('locked')||document.body.classList.contains('vf-on'))return;
  const b=S.slides[S.active].querySelector(k==='ArrowRight'?'.sq-next':'.sq-prev');
  if(b&&!b.disabled){e.preventDefault();b.click()}
}
function onScroll(){if(S&&!S.tick){S.tick=1;requestAnimationFrame(measure)}}
/* Desktop: one couple per wheel or trackpad gesture, then one 360ms settle (no CSS snapping there, see style.css). At the first or last
   couple the wheel is left alone, so the page carries on to the menu above or the footer below. Phones keep native snapping. */
cbWheel(window,()=>shown()&&S.inStage&&!S.jump&&!document.documentElement.classList.contains('lb-open')&&!document.body.classList.contains('locked')&&
  (S.internal?S.contained:document.documentElement.classList.contains('snap-y')),dir=>{
  const st=S,el=st.internal?st.feed:document.scrollingElement;
  const tops=st.slides.map((_,i)=>st.internal?feedTop(st,i):slideTop(i)),y=el.scrollTop;
  let cur=0;tops.forEach((t,i)=>{if(Math.abs(t-y)<Math.abs(tops[cur]-y))cur=i});
  const n=cur+dir;if(n<0||n>=tops.length)return false;
  const max=Math.max(0,el.scrollHeight-el.clientHeight);
  cbGlide(el,'y',Math.max(0,Math.min(max,tops[n])),360);return true;
});

function observe(){
  if(S.io)S.io.disconnect();
  const top=S.internal&&!S.contained?0:headH()+S.bar.offsetHeight;
  const state=S,visibleSlides=new Set();
  const observer=new IntersectionObserver(es=>{
    if(S!==state||state.io!==observer||state.jump)return;
    // Choose from current geometry rather than stale observer entry order.
    const edge=headH()+state.bar.offsetHeight;
    es.forEach(e=>{if(e.isIntersecting)visibleSlides.add(e.target);else visibleSlides.delete(e.target);});
    const candidates=[...visibleSlides].map(el=>({i:+el.dataset.i,r:el.getBoundingClientRect()})).filter(x=>x.r.bottom>edge&&x.r.top<innerHeight);
    if(candidates.length)state.cand=candidates.reduce((a,b)=>Math.abs(b.r.top-edge)<Math.abs(a.r.top-edge)?b:a).i;
    clearTimeout(S.deb);
    S.deb=setTimeout(()=>{if(S===state&&!state.jump&&state.cand>=0)activate(state.cand)},90);     // not while a fling is still going past
  },{root:S.internal?S.feed:null,rootMargin:'-'+top+'px 0px 0px 0px',threshold:[0.6]});
  S.io=observer;
  S.slides.forEach(el=>S.io.observe(el));
}
function onResize(){if(!S)return;if(S.layoutWidth!==innerWidth)sizeLayout(S);if(!S.jump)observe();onScroll()}

/* ?notint switches the ground tint off, to find out whether it is what a browser chokes on (read once, at mount) */
const Q={has:k=>new URLSearchParams(location.search).has(k)};
function mount(then){
  unmount();
  const root=document.getElementById('ps');if(!root)return;
  const data=flat();
  S={root,data,bar:$('.ps-bar',root),feed:$('.ps-feed',root),internal:root.classList.contains('ps-internal'),slides:[...root.querySelectorAll('.ps-slide')],live:$('.vf-sr[role=status]',root),
     reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,active:-1,cand:-1,deb:0,
     host:document.documentElement,notint:Q.has('notint')};
  S.slides.forEach(el=>{el.inert=true});
  sizeLayout(S);
  addEventListener('resize',onResize,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});
  if(S.internal)S.feed.addEventListener('scroll',onScroll,{passive:true});
  addEventListener('wheel',cancelJump,{passive:true});
  addEventListener('touchmove',cancelJump,{passive:true});
  document.addEventListener('keydown',onKey);
  observe();
  const jump=b=>{if(S&&S.root===root&&b)go(S.data[+b.dataset.first].c.id,true)};
  let touchJumpAt=0;
  root.addEventListener('click',e=>{if(performance.now()-touchJumpAt>500)jump(e.target.closest('.cl-b'));});
  // iPhone Safari can suppress click after a scroll. Handle a stationary touch explicitly,
  // while leaving sideways category swipes and vertical page scrolling to the browser.
  let tap=null;
  S.bar.addEventListener('touchstart',e=>{
    const b=e.target.closest('.cl-b'),t=e.touches[0];
    tap=b&&e.touches.length===1?{b,x:t.clientX,y:t.clientY}:null;
  },{passive:true});
  S.bar.addEventListener('touchmove',e=>{
    const t=e.touches[0];
    if(tap&&(!t||e.touches.length!==1||Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>8))tap=null;
  },{passive:true});
  S.bar.addEventListener('touchend',e=>{
    const start=tap;tap=null;const t=e.changedTouches[0];
    if(!start||!t||e.touches.length||Math.hypot(t.clientX-start.x,t.clientY-start.y)>8||e.target.closest('.cl-b')!==start.b)return;
    if(e.cancelable)e.preventDefault();
    touchJumpAt=performance.now();jump(start.b);
  },{passive:false});
  S.bar.addEventListener('touchcancel',()=>{tap=null},{passive:true});
  /* the contents list is the way in: open the stage on that chapter */
  const pro=document.getElementById('pro');
  if(pro){S.proClick=e=>{const b=e.target.closest('.pro-row');if(b)go(b.dataset.ch,true)};pro.addEventListener('click',S.proClick)}
  go(then);
  measure();
}
function unmount(){
  if(!S)return;
  releaseFeed();
  finishJump(S,false);
  clearVeil(S,true);
  clearTimeout(S.deb);if(S.io)S.io.disconnect();
  const pro=document.getElementById('pro');if(pro&&S.proClick)pro.removeEventListener('click',S.proClick);
  S.host.style.removeProperty('--tint');S.host.style.removeProperty('--tint-l');
  document.documentElement.classList.remove('snap-y');
  S.feed.removeEventListener('scroll',onScroll);
  removeEventListener('wheel',cancelJump);removeEventListener('touchmove',cancelJump);
  removeEventListener('resize',onResize);removeEventListener('scroll',onScroll);document.removeEventListener('keydown',onKey);
  S=null;
  if(!(window.VF&&VF.isOpen()))document.body.classList.remove('vf-in');
}
/* coming back from Films: land on the menu, like arriving on the page */
function restore(){
  if(!S||!S.root.getClientRects().length)return;
  releaseFeed();
  S.suspended=false;
  finishJump(S,false);
  clearTimeout(S.deb);
  if(S.internal){S.feed.scrollTo({top:0,behavior:'instant'});activate(0)}
  scrollTo({top:0,behavior:'instant'});                  // switching tabs lands on the menu
  observe();measure();
  VF.syncUL();
}

window.PS={html,mount,unmount,restore,go,suspend:releaseFeed};
})();
