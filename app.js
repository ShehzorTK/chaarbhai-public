/* Preload the same native player during the initial site loader, before Home mounts. */
const HERO_SRC=matchMedia('(max-width:700px)').matches?'media/hero-v40-54-720.mp4':'media/hero-v40-54-1080.mp4';
const heroVideo=document.createElement('video');
heroVideo.id='hero-video';heroVideo.className='vhero-video';
heroVideo.muted=true;heroVideo.defaultMuted=true;heroVideo.loop=true;heroVideo.playsInline=true;
heroVideo.setAttribute('muted','');heroVideo.setAttribute('playsinline','');
heroVideo.preload='auto';heroVideo.poster='media/hero-v40-54-poster.webp';
heroVideo.setAttribute('aria-hidden','true');
let heroController=null,heroDownload=null;
function preloadHero(){
  if(heroDownload)return heroDownload;
  // Faststart MP4s can play while the rest downloads; keep one native player.
  heroVideo.src=HERO_SRC;heroVideo.load();
  heroDownload=Promise.resolve();
  return heroDownload;
}
if(!location.hash||location.hash==='#/')preloadHero();

const T=['#191C26','#1D2030','#232735','#1B1E29','#202431','#262A38'];   /* image-failed fallbacks, from the ink ramp */
/* One photo from PORTFOLIO or PICKS: web-sized WebP copies in site/photos.
   `sizes` says how wide it shows, so the browser fetches the smallest copy that
   stays sharp. Everything below the first screen loads lazily. */
/* `parked`: the Work strips. The tag carries no picture at all, only a 1px placeholder, with the real
   copies kept in data-u / data-ss / data-sz. photoWindow() puts the picture in when its row nears the screen. */
const TINY='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function pic(f,sizes,{alt=f.alt,eager=false,cls='',parked=false}={}){const a=T[0],b=T[2];
 const set=f.ws.map(w=>`${f.src}-${w}.webp ${w}w`).join(', ');
 const load=parked?`src="${TINY}" data-u="${f.src}-${f.ws[0]}.webp" data-ss="${set}" data-sz="${sizes}"`
   :`src="${f.src}-${f.ws[0]}.webp" srcset="${set}" sizes="${sizes}" ${eager?'fetchpriority="high"':'loading="lazy"'}`;
 return `<img${cls?` class="${cls}"`:''} ${load}
 width="${f.ws[0]}" height="${Math.round(f.ws[0]/f.ar)}" decoding="async"
 draggable="false" alt="${esc(alt)}"${f.pos?` style="object-position:${f.pos}"`:''}
 onerror="this.style.display='none';(this.closest('.fr-img,.arch,.thumb,.pk-m,.cta-bg,.hero-arch')||this.parentNode).style.background='linear-gradient(150deg,${a},${b})'">`}

/* The categories of Work: Portraits first (the strongest frames), then the wedding week in order. Photographs and Films share this list (see video-feed.js). */
window.WORK_CATS=['Portraits','Night before','Henna','Arrival','Ceremony','Reception','Farewell'];
const HIDE_MAX=3;
const CHAPTERS=[
 {id:'before',no:'07',short:'Portraits',name:'Portraits',
  alt:'Engagement · Nikkah and reception portraits',
  desc:'An hour away from everyone, sometimes months before, sometimes between the ceremony and the reception. Two people, whatever light there is, and nobody watching.'},

 {id:'night',no:'01',short:'Night before',name:'The night before',
  alt:'Dholki · Sangeet · Jaggo · Mayoun',
  desc:'Days before anything official happens. The house fills up, someone digs the dhol out of a cupboard, and nobody goes home.'},

 {id:'henna',no:'02',short:'Henna',name:'Henna and haldi',
  alt:'Mehndi · Haldi · Gaye holud · Vatna',
  desc:'Henna, turmeric, or both, depending on the family. Whatever yours calls it, it is the loudest and most crowded room of the week.'},

 {id:'arrival',no:'04',short:'Arrival',name:'The arrival',
  alt:'Baraat · Milni · Entrances',
  desc:'Both families walking in. You hear it a long time before you see it, and there is always somebody’s grandmother waving at the back.'},

 {id:'ceremony',no:'03',short:'Ceremony',name:'The ceremony',
  alt:'Nikkah · Anand Karaj · Pheras · Bibaho',
  desc:'Usually the quietest hour of the whole week, and the only part of it that is actually binding.'},

 {id:'reception',no:'05',short:'Reception',name:'The reception',
  alt:'Walima · Reception · Bou bhat',
  desc:'The formal one. The photographed one. The one the aunts have opinions about.'},

 {id:'farewell',no:'06',short:'Farewell',name:'The farewell',
  alt:'Rukhsati · Vidaai · Doli',
  desc:'Twenty minutes, and the hardest part of the whole week to shoot properly.'}
]
/* Each chapter shows the real weddings in PORTFOLIO, one slide per couple on Work. A couple with 3 frames or fewer
   gets no slide (the photos stay in portfolio.json, and drafts/portfolio/build_portfolio.py lists who is hidden), and a
   chapter with no slides yet stays hidden until one is added. Keep HIDE_MAX in step with the script. */
 .map(c=>({...c,seqs:(PORTFOLIO[c.id]||[]).filter(q=>q.frames.length>HIDE_MAX),cover:PICKS.covers[c.id],pcover:(PICKS.paperCovers||PICKS.covers)[c.id],tint:(PICKS.tints||{})[c.id]}))
 .filter(c=>c.seqs.length)
 .map((c,i)=>({...c,no:String(i+1).padStart(2,'0'),frames:c.seqs.reduce((n,q)=>n+q.frames.length,0)}));

/* Packages, from the Chaar Bhai Price Book (still marked as a draft: see PRODUCT.md).
   One source for the package cards, the compare table and the builder.
   Package prices are hours × the hourly rate, unless a package sets its own. */
const PR_RATE={both:550,photo:350,video:450};
const PR_COMMON=[['Professional retouching','photo'],['Online gallery of your fully edited photos','photo'],
  ['Film delivered via a private download link','video'],['Audio equipment and on-camera interviews','video']];
const PR_BIG=[['Rehearsal dinner coverage'],['Get-ready session'],['Pre-wedding e-shoot'],
  ['Your choice of one complimentary album, standard, premium, or parent','photo'],['Set of framed prints','photo']];
const PR=[
 {id:'first-light',name:'First Light',hours:6,tier:1,photographers:1,videographers:1,freeKeepsakes:0,
  tag:'Six hours, one event. Enough to cover a ceremony or reception properly, start to finish.',rows:PR_COMMON},
 {id:'golden-hour',name:'Golden Hour',hours:10,tier:2,photographers:1,videographers:1,freeKeepsakes:0,
  tag:'Ten hours, one full day. Getting ready through the last dance.',rows:[...PR_COMMON,['Get-ready session']]},
 {id:'till-dusk',name:'Till Dusk',hours:16,tier:3,photographers:1,videographers:1,freeKeepsakes:1,
  tag:'Sixteen hours across two events, with a get-ready session, a pre-wedding shoot and your pick of a complimentary album.',rows:[...PR_COMMON,...PR_BIG]},
 {id:'till-sunrise',name:'Till Sunrise',hours:24,tier:4,priceBoth:12600,photographers:1,videographers:1,freeKeepsakes:1,
  tag:'Twenty-four hours, the whole weekend covered, with one complimentary album of your choice.',rows:[...PR_COMMON,...PR_BIG,['Next-day edit','video']]}]
 .map(p=>({priceBoth:p.hours*PR_RATE.both,pricePhoto:p.hours*PR_RATE.photo,priceVideo:p.hours*PR_RATE.video,...p}));
const PR_CMP=[
 ['Coverage',null,['6 hours','10 hours','16 hours','24 hours']],
 ['Extra hour',null,['$550','$550','$750','$750']],
 ['Best for',null,['One event','One full day','Two events','Full weekend']],
 ['Professional retouching','photo',[1,1,1,1]],
 ['Photo gallery','photo',[1,1,1,1]],
 ['Video via download link','video',[1,1,1,1]],
 ['Audio and interviews','video',[1,1,1,1]],
 ['Rehearsal dinner coverage',null,[0,0,1,1]],
 ['Get-ready session',null,[0,1,1,1]],
 ['Pre-wedding e-shoot',null,[0,0,1,1]],
 ['Complimentary album picks','photo',[0,0,'Choice of 1','Choice of 1']],
 ['Framed prints','photo',[0,0,1,1]],
 ['Next-day edit','video',[0,0,0,1]]];
const PR_CHECK='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.6 6.4 12 13 4.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svcAttr=v=>v?` data-service="${v}"`:'';
/* estimate chosen on the Prices page, carried into the contact letter */
let EST=null;
let homeSceneFrame=0;
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Ratings shown on the site, with links to the full lists. The figures are
   typed in by hand: update them when they change.
   google.url opens the Chaar Bhai Canada listing by its
   permanent Maps id. Not the older Pakistan listing. */
const PROOF={
  google:{rating:4.8,count:37,url:'https://www.google.com/maps?cid=901197728530734372'},
  meta:{recommend:94,count:344,url:'https://www.facebook.com/chaarbhai/reviews'}};
/* Platform marks, drawn from the brands' own artwork: Google's four-colour G,
   and Meta's symbol (path from Simple Icons) in Meta's blue gradient. */
const G_LOGO=`<svg class="pb-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
const M_LOGO=`<svg class="pb-logo pb-meta" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="metag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0064E1"/><stop offset=".6" stop-color="#0073EE"/><stop offset="1" stop-color="#0082FB"/></linearGradient></defs><path fill="url(#metag)" d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/></svg>`;
const STAR_P='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
const STARS=r=>`<span class="stars" role="img" aria-label="${r} out of 5 stars"><span class="stars-fill" style="width:${r/5*100}%">${STAR_P.repeat(5)}</span>${STAR_P.repeat(5)}</span>`;
const revRating=r=>r.s?STARS(r.s):'<span class="rev-rec">Recommends</span>';
const proof=(cls='')=>`<div class="proof ${cls}">
  <a class="pb pb-g" href="${PROOF.google.url}" target="_blank" rel="noopener" aria-label="Rated ${PROOF.google.rating} out of 5 from ${PROOF.google.count} reviews on Google. Read them on Google.">
    ${G_LOGO}
    <span class="pb-body">
      <span class="pb-name">Google Reviews</span>
      <span class="pb-score"><b>${PROOF.google.rating.toFixed(1)}</b>${STARS(PROOF.google.rating)}</span>
      <span class="pb-sub">Based on ${PROOF.google.count} reviews</span>
    </span>
  </a>
  <a class="pb pb-m" href="${PROOF.meta.url}" target="_blank" rel="noopener" aria-label="${PROOF.meta.recommend}% recommend, from ${PROOF.meta.count} reviews on Meta. Read them on Facebook.">
    ${M_LOGO}
    <span class="pb-body">
      <span class="pb-name">Meta Reviews</span>
      <span class="pb-score"><b>${PROOF.meta.recommend}%</b><span class="pb-rec">recommend</span></span>
      <span class="pb-sub">Based on ${PROOF.meta.count} reviews</span>
    </span>
  </a>
</div>`;
const paperProof=()=>`<div class="paper-proof" aria-label="Read our reviews">
  <a data-review-source="google" href="${PROOF.google.url}" target="_blank" rel="noopener" aria-label="Rated ${PROOF.google.rating} out of 5 from ${PROOF.google.count} Google reviews. Read them on Google."><span>Google</span><small>${PROOF.google.rating.toFixed(1)} out of 5 · ${PROOF.google.count} reviews</small></a>
  <a data-review-source="meta" href="${PROOF.meta.url}" target="_blank" rel="noopener" aria-label="${PROOF.meta.recommend}% recommend, from ${PROOF.meta.count} reviews on Facebook. Read them on Facebook."><span>Facebook</span><small>${PROOF.meta.recommend}% recommend · ${PROOF.meta.count} reviews</small></a>
</div>`;

const ARROW=d=>`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d==='l'?'M13 8H3M7 4 3 8l4 4':'M3 8h10M9 4l4 4-4 4'}" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const HERO_SOUND_ICON=muted=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z${muted?'M16 9.5l5 5M21 9.5l-5 5':'M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11'}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const HERO_PLAY_ICON=paused=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paused?'M8 5.5v13l11-6.5z':'M7 5h3.6v14H7zM13.4 5H17v14h-3.6z'}" fill="currentColor"/></svg>`;

/* ================= PAGES ================= */

/* Paper theme only: Home's Recent work is three full-screen cards (see theme-paper.css). Photo = the first chapter's cover in each group. */
const PAPER=document.documentElement.dataset.theme==='paper';
function paperCards(){
  const list=[...CHAPTERS].sort((a,b)=>a.no-b.no).filter(c=>c.pcover);
  return `<section class="pcards" aria-label="Recent work" style="--pc-n:${list.length}">
  <div class="pcards-stick">
    <div class="pcards-track" tabindex="0" role="group" aria-label="Recent work, ${list.length} chapters">${list.map((c,i)=>`
      <article class="pcard pc-${i+1}" id="paper-chapter-${c.id}">
        <figure class="pc-ph">${pic(c.pcover,'(max-width:900px) 80vw, 46vw')}</figure>
        <div class="pc-tx"><span class="pc-no" aria-hidden="true">${c.no}</span><h2>${c.name}</h2><p>${c.desc}</p><span class="pc-tag">${c.alt}</span>
          <button class="btn" data-nav-to="#/portfolio/photos/${c.id}"><span>View the work</span><i></i></button></div>
      </article>`).join('')}</div>
    <nav class="pc-chapter-nav" aria-label="Recent work chapters"><ol class="pc-dots">${list.map((h,j)=>`<li><a href="#paper-chapter-${h.id}" data-paper-chapter="${j}" aria-label="Go to chapter ${h.no}: ${esc(h.name)}"${j===0?' aria-current="step"':''}>${h.no}</a></li>`).join('')}</ol></nav>
  </div>
</section>`;
}

/* Paper: the big testimonial is written in as you scroll. Each word wipes in left to right in turn (a soft-edged mask driven by --p),
   so the line reads as being written in script. The real sentence stays in the page for screen readers. */
function paperWrite(text){
  const words=text.split(' ');
  return `<p class="wi"><span class="sr">“${text}”</span><span aria-hidden="true">${words.map((w,i)=>`<span class="wi-w">${i===0?'“':''}${w}${i===words.length-1?'”':''}</span>`).join(' ')}</span></p>`;
}
function paperWritePaint(){
  const q=document.querySelector('.wi');if(!q)return;
  const ws=q.querySelectorAll('.wi-w'),n=ws.length;
  if(reduceMotion()){ws.forEach(w=>w.style.setProperty('--p',1));return}
  const top=q.getBoundingClientRect().top,P=Math.max(0,Math.min(1,(innerHeight*.85-top)/(innerHeight*.5)));
  ws.forEach((w,i)=>w.style.setProperty('--p',Math.max(0,Math.min(1,P*n-i)).toFixed(3)));
}

/* Paper: a small italic "chapter 03 ——— chapter 04" line along the bottom of each Home screen, so the page reads like a book */
function paperRails(){
  const secs=[...document.querySelectorAll('#page>section')].filter(x=>!x.classList.contains('cta')&&!x.classList.contains('pcards'));
  const all=[...document.querySelectorAll('#page>section')];
  secs.forEach(sec=>{
    const i=all.indexOf(sec)+1,r=document.createElement('div');r.className='rail';r.setAttribute('aria-hidden','true');
    r.innerHTML=`<span>chapter ${String(i).padStart(2,'0')}</span><i></i><span>chapter ${String(i+1).padStart(2,'0')}</span>`;
    sec.appendChild(r);
  });
}
function paperCardsPaint(pc){
  const cards=[...pc.querySelectorAll('.pcard')],n=cards.length;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  if(matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches){
    // One viewport of vertical travel maps directly to one chapter destination.
    const r=pc.getBoundingClientRect(),y=Math.max(0,-r.top)/innerHeight,u=Math.max(0,Math.min(n-1,y));
    pc.querySelector('.pcards-track').style.transform=`translate3d(${-u*100}vw,0,0)`;
  }else pc.querySelector('.pcards-track').style.removeProperty('transform');
  const current=clamp(Math.round(pc.querySelector('.pcards-track').scrollLeft/Math.max(1,cards[0]?.getBoundingClientRect().width||innerWidth)),0,n-1);
  const desktop=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches;
  const index=desktop?clamp(Math.round(Math.max(0,-pc.getBoundingClientRect().top)/Math.max(1,innerHeight)),0,n-1):current;
  pc.querySelectorAll('[data-paper-chapter]').forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});
  const nav=pc.querySelector('.pc-chapter-nav');if(nav&&cards[index])nav.style.color=getComputedStyle(cards[index]).getPropertyValue('--paper').trim();
}

const P={};

P['/']=()=>`
<section class="vhero">
  <div class="vhero-media">
    <!-- The pen mark waits for the fully downloaded native loop. -->
    <div class="cb-hero-placeholder" aria-hidden="true"><img src="img/pen-loader-1.png" alt="" width="2048" height="981"></div>
    <div class="cb-video-cover" aria-hidden="true"></div>
    <div class="vhero-player"><div id="reel"></div></div>
    <button class="hero-sound mono" type="button" aria-label="Unmute background music" aria-pressed="false" hidden>${HERO_SOUND_ICON(true)}</button>
    <span class="hero-unmute-prompt" hidden>Press here to unmute</span>
    <button class="hero-play mono" type="button" aria-label="Play film" hidden>${HERO_PLAY_ICON(true)}</button>
  </div>
  <div class="vhero-in">
    <h1>
      <span class="rv-l"><span>The photographs</span></span>
      <span class="rv-l" data-d="1"><span>your family keeps</span></span>
    </h1>
    <p class="rv" data-d="2">We photograph and film weddings, and have done since 2013. Over eighteen hundred of them so far. We’re based in the Greater Toronto Area and we travel.</p>
    <div class="acts rv" data-d="3">
      <a href="#/contact" data-nav class="btn"><span>See if your date is free</span><i></i></a>
      <span class="quiet mono">Tell us the date and we’ll come back to you</span>
    </div>
  </div>
  <div class="scroll-cue" aria-hidden="true" style="display:none"><span>Scroll</span><i></i></div>
  <div class="vhero-foot mono">
    <span>Photo and film</span><span>Based in the GTA</span><span>Since 2013</span>
  </div>
</section>

<section class="plan">
  <div class="band-in" style="align-items:start">
    <div>
      <h2 class="d2 rv" data-d="1">We plan the<br>boring parts</h2>
    </div>
    <div>
      <p class="lead rv" data-d="2">We sit down with you before the day and go through it properly. Which events matter most, who has to be in the family photos, what you want us nowhere near.</p>
      <p class="lead rv" data-d="3" style="margin-top:20px">It’s not the interesting part of the job. It’s the reason things don’t get missed.</p>
      <div class="rv plan-btn" data-d="3" style="margin-top:34px"><a href="#/about" data-nav class="btn"><span>More about us</span><i></i></a></div>
    </div>
  </div>
</section>

${PAPER?paperCards():`<section class="day" style="padding-top:0">
  <div class="day-pin">
    <h2 class="d2" style="margin-bottom:clamp(26px,3vw,40px)">Recent work</h2>
    <div class="day-sky"><i class="day-sun"></i><ol class="day-hours">${CHAPTERS.map(c=>`<li><a href="#recent-${c.id}" data-day-link="${c.id}">${c.short}</a></li>`).join('')}</ol></div>
    <div class="day-track">${CHAPTERS.map(c=>`
      <div class="day-panel" id="recent-${c.id}">
        <figure class="day-ph arch">${pic(c.cover,'(max-width:900px) 90vw, 46vw')}</figure>
        <div class="day-tx"><span class="mono">${c.no}</span><h3>${c.name}</h3><p class="mono">${c.alt}</p><p class="lead">${c.desc}</p>
          <button class="btn" data-nav-to="#/portfolio/photos/${c.id}"><span>View</span><i></i></button>
        </div>
      </div>`).join('')}</div>
    <div class="day-end" style="margin-top:44px"><a href="#/portfolio" data-nav class="btn"><span>The full archive</span><i></i></a></div>
  </div>
</section>`}

<section class="band">
  <div class="band-in">
    <div>
      <h2 class="d2 rv" data-d="1">We stay out<br>of the way</h2>
      <p class="lead rv" data-d="2" style="margin-top:26px">The aim is to be as unobtrusive as we can, so most of the day gets documented as it actually happens. When a shot needs setting up we’ll step in and direct it, then get out of the way again.</p>
    </div>
    <figure class="arch rv-img" data-d="2" style="aspect-ratio:4/5">${pic(PICKS.stay,'(max-width: 800px) 92vw, 44vw')}</figure>
  </div>
  ${PAPER?`<div class="cta-ph" aria-hidden="true">${PICKS.stayOut.map(f=>`<span>${pic(f,'20vw')}</span>`).join('')}</div>`:''}
</section>

<section class="tally${reduceMotion()?'':' tally-live'}">
  <div class="tally-pin">
    ${(()=>{const t=mosaicTiles(innerWidth<=900?35:45),mid=Math.floor(t.length/2);
      // the centre tile opens the scene at full screen, so it asks for the 1920 copy
      return `<div class="mosaic">${t.map((f,i)=>`<div class="mo-t${i===mid?' mo-mid':''}">${pic(f,i===mid?'100vw':'12vw',{alt:i===mid?f.alt:'',eager:i===mid&&!reduceMotion()})}</div>`).join('')}</div>`})()}
    <div class="tally-cap">
      <p class="tally-big"><span>336,600+</span></p>
      <p class="tally-copy">photographs we’ve delivered since 2013, for more than 1,800 couples.</p>
      <p class="tally-more">That’s before the 1,800 films.</p>
    </div>
  </div>
</section>

<section class="band voices">
  <figure class="v-lead">
    <blockquote>${PAPER?paperWrite('They turned my dream Bollywood wedding into a reality.'):'<p><span class="hang">“</span>They turned my dream Bollywood wedding into a reality.”</p>'}</blockquote>
    <figcaption>Zainab Jafari</figcaption>
    ${PAPER?`<div class="rv" data-d="2">${paperProof()}</div>`:proof('proof-s')}
  </figure>
  <div class="v-more">
    <figure${PAPER?' class="rv" data-d="1"':''}><blockquote><p>“You guys have literally covered each and every moment.”</p></blockquote><figcaption>Jannat Hashmi</figcaption></figure>
    <figure${PAPER?' class="rv" data-d="2"':''}><blockquote><p>“They made us feel completely at ease and captured every special moment so naturally.”</p></blockquote><figcaption>Zair Syed</figcaption></figure>
    <figure${PAPER?' class="rv" data-d="3"':''}><blockquote><p>“Truly mesmerizing, especially the candid shots.”</p></blockquote><figcaption>Zohra Masudi</figcaption></figure>
    <a href="#/testimonials" data-nav class="btn${PAPER?' rv':''}"${PAPER?' data-d="4"':''}><span>Read all ${REVIEWS.length}</span><i></i></a>
  </div>
</section>

<section class="cta">
  ${PAPER?`<div class="cta-ph" aria-hidden="true">${['night','ceremony','reception','arrival'].map(k=>`<span>${pic(CHAPTERS.find(c=>c.id===k).pcover,'20vw')}</span>`).join('')}</div>`:''}
  <h2 class="rv">Tell us about<br>your wedding</h2>
  <p class="lead rv" data-d="1" style="margin-top:24px">Send us the date and the venue and we’ll come back to you.</p>
  <div class="rv" data-d="2" style="margin-top:38px"><a href="#/contact" data-nav class="btn"><span>Check your date</span><i></i></a></div>
</section>`;

P['/portfolio']=()=>`
<div id="wk-videos" hidden></div>

<div id="wk-photos">${PS.html()}</div>
`;

P['/about']=()=>`
<section class="hero" style="min-height:70svh;justify-content:flex-end">
  <h1 class="d1 rv" data-d="1">Chaar Bhai is Urdu<br>for four brothers</h1>
  <div class="hero-foot mono"><span>Since 2013</span><span>Photo and film</span><span>We travel</span></div>
</section>

<section class="ab-story">
  <div class="ab-grid">
    <h2 class="d2 ab-head" aria-label="When your brothers are at the wedding, you don’t worry. They’ve got it covered.">${['When your brothers are at the wedding,','you don’t worry.','They’ve got it covered.'].map(l=>`<span class="ab-l" aria-hidden="true">${l}</span>`).join(' ')}</h2>
    <div class="ab-paras">
      <p class="lead">We started in 2013 as four friends, and life has since taken the four of us to different parts of the world. The name stayed, because of what it came to mean.</p>
      <p class="lead">What we’ve learnt, and what our couples tell us they expect, is that feeling: the comfort of knowing Chaar Bhai have it covered, so the family can get on with the day.</p>
      <p class="lead">It’s why our clients so often span three generations of one family. Somewhere along the way we stop being the people with the cameras and become family.</p>
    </div>
  </div>
</section>

<section style="padding-top:0">
  <div class="ilist">
    ${[
      ["01","How we shoot","Candid first. We chase as many unposed frames as we can get, and we are just as comfortable directing when a shot needs setting up."],
      ["02","How we edit","Tailored to your taste rather than to a house preset. Tell us how you want it to look and we work to that, technically correct either way."],
      ["03","What you get","Every image and video from the day, professionally retouched, in an online gallery."]
    ].map(([n,t,d],i)=>`
      <div class="irow plain rv" data-d="${i%3}">
        <span class="t">${t}</span>
        <span class="d">${d}</span>
      </div>`).join('')}
  </div>
</section>

<section class="work-founder" aria-labelledby="founder-name">
  <figure class="founder-portrait" aria-label="Space reserved for a portrait of Fahad Raza">
    <span aria-hidden="true">Fahad Raza</span>
  </figure>
  <div class="founder-copy">
    <span class="mono">Founder</span>
    <h2 id="founder-name">Fahad Raza</h2>
    <p class="lead">Originally from Pakistan, Fahad has been taking photographs since 2009. He loves getting to know the people in front of his camera, sharing a laugh, and catching the little moments in between. You’ll usually find him with a camera in his hands and a smile on his face.</p>
  </div>
</section>

<section class="band">
  <div class="band-in">
    <figure class="arch rv-img" style="aspect-ratio:4/5">${pic(PICKS.back,'(max-width: 800px) 92vw, 44vw')}</figure>
    <div>
      <h2 class="d2 rv" data-d="1">We show you the<br>back of the camera</h2>
      <p class="lead rv" data-d="2" style="margin-top:26px">During the day we’ll come over and show you what we just shot, so you can tell us if something’s off while there’s still time to fix it. Costs us two minutes. Saves a lot of disappointment later.</p>
    </div>
  </div>
</section>

<section>
  <div class="gta">
    <div>
      <h2 class="d2 rv" data-d="1" style="max-width:18ch">Based in the Greater<br>Toronto Area, and we travel</h2>
      <p class="lead rv" data-d="2" style="margin-top:24px">The Greater Toronto Area is home, but a wedding somewhere else is not a problem. We have shot in Pakistan, the UAE, Thailand and the United States. Tell us where yours is and we’ll tell you whether we can be there.</p>
    </div>
    ${CANADA_MAP}
  </div>
</section>

<section class="band hire" aria-labelledby="hire-h">
  <div class="hire-in">
    <div>
      <h2 class="d2" id="hire-h">Want to work<br>with us?</h2>
      <p class="lead" style="margin-top:22px">Send us your CV and a link to your work. We read everything that comes in.</p>
    </div>
    <div class="hire-mail">
      <a class="hire-addr" href="mailto:info@chaarbhai.com?subject=CV%20for%20Chaar%20Bhai">info<wbr>@chaarbhai.com</a>
      <a class="btn" href="mailto:info@chaarbhai.com?subject=CV%20for%20Chaar%20Bhai"><span>Email your CV</span><i></i></a>
    </div>
  </div>
</section>

<section class="cta">
  <h2 class="rv">Want to talk?</h2>
  <div class="rv" data-d="1" style="margin-top:38px"><a href="#/contact" data-nav class="btn"><span>Get in touch</span><i></i></a></div>
</section>`;

P['/services']=()=>`
<div class="pr">
<section class="hero" style="min-height:62svh;justify-content:flex-end">
  <h1 class="d1 rv" data-d="1">What it costs</h1>
  <p class="lead rv" data-d="2" id="hero-lede" style="margin-top:24px">Four packages built around how long your wedding day actually runs. Every one includes a photographer and a videographer, professional retouching, and a private online gallery.</p>
  <div class="pr-bar mono rv" data-d="3">
    <span id="price-bar-note">All prices in CAD</span>
    <div class="currency-toggle" role="group" aria-label="Wedding location">
      <button type="button" data-currency-btn data-currency-value="CAD" class="is-active">In Canada</button>
      <button type="button" data-currency-btn data-currency-value="USD">Outside Canada</button>
    </div>
  </div>
  <div class="note-box is-hidden" id="international-note">
    <p><strong>Travelling outside Canada.</strong> Travel and accommodation for the crew are billed separately for events outside Canada.</p>
  </div>
  <div class="filter-bar rv" data-d="3">
    <span class="filter-bar-label mono">Showing</span>
    <div class="filter-toggle" role="group" aria-label="Filter packages by service">
      <button type="button" data-filter-btn data-filter-value="both" class="is-active">Photo + Video</button>
      <button type="button" data-filter-btn data-filter-value="photo">Photo only</button>
      <button type="button" data-filter-btn data-filter-value="video">Video only</button>
    </div>
  </div>
</section>

<section class="pr-pkgs" style="padding-top:0" aria-label="Packages, one at a time">
  ${PR.map(p=>`
  <article class="pkg-section" id="section-${p.id}">
    <div class="pkg-intro">
      <div class="pr-tier mono rv">${p.hours} hours</div>
      <h2 class="rv" data-d="1">${p.name}</h2>
      <p class="pkg-price rv" data-d="2"><span class="price-value">$${p.priceBoth.toLocaleString('en-CA')}</span><sup>CAD</sup></p>
      <p class="lead rv" data-d="2">${p.tag}</p>
      <div class="pkg-cta rv" data-d="3"><button type="button" class="btn" data-goto-pkg="${p.id}"><span>Customize this one</span><i></i></button></div>
    </div>
    <ul class="feature-rows rv" data-d="2">
      <li class="coverage-line">${p.hours} hours of photo and video coverage</li>
      ${p.rows.map(([t,v])=>`<li${svcAttr(v)}>${t}</li>`).join('')}
    </ul>
  </article>`).join('')}
</section>

<section aria-labelledby="compare-heading">
  <h2 class="d2 rv" data-d="1" id="compare-heading">All four, side by side</h2>
  <p class="lead rv" data-d="2" style="margin-top:20px">The same details, without the scrolling.</p>
  <div class="compare-wrap rv" data-d="2">
    <div class="compare-grid">
      <div></div>
      ${PR.map(p=>`<div class="col-head" data-pkg="${p.id}"><h3>${p.name}</h3><span class="col-price">$${p.priceBoth.toLocaleString('en-CA')}</span></div>`).join('')}
      ${PR_CMP.map(([label,v,vals])=>`<div class="row-label"${svcAttr(v)}>${label}</div>`+vals.map(x=>
        x===1?`<div class="yes"${svcAttr(v)}>${PR_CHECK}<span class="sr">Included</span></div>`:
        x===0?`<div class="no"${svcAttr(v)}>—<span class="sr">Not included</span></div>`:
        `<div${svcAttr(v)}>${x}</div>`).join('')).join('')}
    </div>
  </div>
</section>

<section aria-labelledby="builder-heading" style="padding-top:0">
  <h2 class="d2 rv" data-d="1" id="builder-heading">Pick your starting point, then customize</h2>
  <p class="lead rv" data-d="2" style="margin-top:20px">Choose a package, add whatever your day needs, and watch your total update as you go. When it looks right, send it to us.</p>
  <div class="filter-bar rv" data-d="2">
    <span class="filter-bar-label mono">Showing</span>
    <div class="filter-toggle" role="group" aria-label="Filter customization by service">
      <button type="button" data-filter-btn data-filter-value="both" class="is-active">Photo + Video</button>
      <button type="button" data-filter-btn data-filter-value="photo">Photo only</button>
      <button type="button" data-filter-btn data-filter-value="video">Video only</button>
    </div>
  </div>

    <div class="builder-grid rv" data-d="2">
      <div class="builder-options">

        <div class="option-block">
          <p class="option-label">1. Choose your package</p>
          <div class="package-pills" id="package-pills">
            <label class="pill" data-pkg="first-light">
              <input type="radio" name="package" id="pkg-first-light" value="first-light" checked>
              <span class="pill-inner">
                <span class="pill-name">First Light</span>
                <span class="pill-price">$3,300</span>
              </span>
            </label>
            <label class="pill" data-pkg="golden-hour">
              <input type="radio" name="package" id="pkg-golden-hour" value="golden-hour">
              <span class="pill-inner">
                <span class="pill-name">Golden Hour</span>
                <span class="pill-price">$5,500</span>
              </span>
            </label>
            <label class="pill" data-pkg="till-dusk">
              <input type="radio" name="package" id="pkg-till-dusk" value="till-dusk">
              <span class="pill-inner">
                <span class="pill-name">Till Dusk</span>
                <span class="pill-price">$8,800</span>
              </span>
            </label>
            <label class="pill" data-pkg="till-sunrise">
              <input type="radio" name="package" id="pkg-till-sunrise" value="till-sunrise">
              <span class="pill-inner">
                <span class="pill-name">Till Sunrise</span>
                <span class="pill-price">$12,600</span>
              </span>
            </label>
          </div>
        </div>

        <div class="option-block">
          <p class="option-label">2. Coverage &amp; team</p>
          <ul class="addon-list">
            <li class="addon-row stepper-row">
              <div class="addon-label-group">
                <span class="addon-name">Extra hours of coverage</span>
                <span class="addon-sub" id="hour-rate-sub">$550 per hour on First Light</span>
              </div>
              <div class="stepper">
                <button type="button" id="hour-decrement" aria-label="Remove an extra hour">&#8722;</button>
                <span id="hour-qty" aria-live="polite">0</span>
                <button type="button" id="hour-increment" aria-label="Add an extra hour">+</button>
              </div>
            </li>
            <li class="addon-row" data-row data-service="photo">
              <label class="addon-check">
                <input type="checkbox" id="addon-second-photographer" data-rate="120">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Second photographer</span>
                  <span class="addon-sub">Add-on on every package, $120 per booked hour</span>
                </span>
              </label>
              <span class="addon-price">$720</span>
            </li>
            <li class="addon-row" data-row data-service="video">
              <label class="addon-check">
                <input type="checkbox" id="addon-second-videographer" data-rate="120">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Second videographer</span>
                  <span class="addon-sub">Add-on on every package, $120 per booked hour, drone coverage comes with it</span>
                </span>
              </label>
              <span class="addon-price">$720</span>
            </li>
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-venue-lighting" data-price="350">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Venue lighting Package</span>
                  <span class="addon-sub">For venues with tricky ambience, we will come in with extra lights to illuminate it the way you have envisioned.</span>
                </span>
              </label>
              <span class="addon-price">$350</span>
            </li>
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-rehearsal-dinner" data-price="600" data-includes="till-dusk,till-sunrise">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Rehearsal dinner coverage</span>
                  <span class="addon-sub">Photo and video coverage of your rehearsal dinner.</span>
                </span>
              </label>
              <span class="addon-price">$600</span>
            </li>
          </ul>

          <div class="note-box" data-service="video" id="video-note-box">
            <p><strong>Audio &amp; interviews.</strong> Professional audio equipment and on-camera interview capability are standard on every video package.</p>
            <p id="drone-status-line"><strong>Drone coverage.</strong> Comes with a second videographer.</p>
          </div>
          <div class="note-box">
            <p>A second ceremony or reception venue is already covered. Travel, setup, and tear-down between locations aren't extra.</p>
          </div>
        </div>

        <div class="option-block">
          <p class="option-label">3. Sessions</p>
          <ul class="addon-list">
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-get-ready" data-price="500" data-includes="golden-hour,till-dusk,till-sunrise">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Get-ready session</span>
                  <span class="addon-sub">Coverage of the getting ready, before the first event starts.</span>
                </span>
              </label>
              <span class="addon-price">$500</span>
            </li>
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-eshoot" data-price="950" data-includes="till-dusk,till-sunrise">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Pre-wedding e-shoot</span>
                  <span class="addon-sub">A portrait session together before the wedding.</span>
                </span>
              </label>
              <span class="addon-price">$950</span>
            </li>
          </ul>
        </div>

        <div class="option-block" data-service="photo">
          <p class="option-label">4. Keepsakes &amp; prints</p>
          <p class="option-sub" id="keepsake-hint"></p>
          <ul class="addon-list">
            <li class="addon-row" data-row data-pool="keepsake">
              <label class="addon-check">
                <input type="checkbox" id="addon-album-standard" data-price="1200">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Printed album, standard</span>
                  <span class="addon-sub">A printed album of your wedding photos.</span>
                </span>
              </label>
              <span class="addon-price">$1,200</span>
            </li>
            <li class="addon-row" data-row data-pool="keepsake">
              <label class="addon-check">
                <input type="checkbox" id="addon-album-premium" data-price="1800">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Premium album, large format</span>
                  <span class="addon-sub">A larger-format printed album of your wedding photos.</span>
                </span>
              </label>
              <span class="addon-price">$1,800</span>
            </li>
            <li class="addon-row" data-row data-pool="keepsake">
              <label class="addon-check">
                <input type="checkbox" id="addon-parent-album" data-price="300">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Parent album</span>
                  <span class="addon-sub">Requires a standard or premium album pick</span>
                </span>
              </label>
              <span class="addon-price">$300</span>
            </li>
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-framed-prints" data-price="250" data-includes="till-dusk,till-sunrise">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Set of framed prints</span>
                  <span class="addon-sub">A set of your photos, printed and framed.</span>
                </span>
              </label>
              <span class="addon-price">$250</span>
            </li>
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-extra-prints" data-price="190">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Additional prints, pack of 10</span>
                  <span class="addon-sub">Ten more prints of photos you choose.</span>
                </span>
              </label>
              <span class="addon-price">$190</span>
            </li>
          </ul>
        </div>

        <div class="option-block">
          <p class="option-label">5. Delivery &amp; extras</p>
          <ul class="addon-list">
            <li class="addon-row" data-row data-service="video">
              <label class="addon-check">
                <input type="checkbox" id="addon-sneak-peek" data-price="1000" data-includes="till-sunrise">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Next-day edit</span>
                  <span class="addon-sub">$1,000 value &#8211; your film's highlights, ready the day after</span>
                </span>
              </label>
              <span class="addon-price">$1,000</span>
            </li>
            <li class="addon-row" data-row>
              <label class="addon-check">
                <input type="checkbox" id="addon-rush-delivery" data-price="500">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Rush full-gallery delivery</span>
                  <span class="addon-sub">Your full edited gallery, delivered ahead of the usual timeline.</span>
                </span>
              </label>
              <span class="addon-price">$500</span>
            </li>
            <li class="addon-row" data-row data-service="photo">
              <label class="addon-check">
                <input type="checkbox" id="addon-slideshow" data-price="200">
                <span class="checkbox-box" aria-hidden="true"></span>
                <span class="addon-label-group">
                  <span class="addon-name">Digital slideshow</span>
                  <span class="addon-sub">A slideshow of your photos to share online.</span>
                </span>
              </label>
              <span class="addon-price">$200</span>
            </li>
          </ul>
        </div>

      </div>

      <aside class="builder-summary">
        <h3>Your estimate</h3>
        <ul class="summary-lines" id="summary-lines"></ul>
        <div class="summary-total">
          <span>Estimated total</span>
          <span id="summary-total-value">$3,300</span>
        </div>
        <p class="summary-note">We'll confirm your exact quote by email once we've reviewed your date and details.</p>

        <a href="#/contact" class="btn" id="submit-cta"><span>Write to us about this</span><i></i></a>

        <button type="button" class="reset-btn" id="reset-btn">Start over</button>
      </aside>

    </div>
</section>
</div>

<section class="cta">
  <h2 class="rv">Rather talk it through<br>with one of us?</h2>
  <p class="lead rv" data-d="1" style="margin-top:24px">Send us your date and what you’re planning, and we’ll go through the options with you.</p>
  <div class="rv" data-d="2" style="margin-top:38px"><a href="#/contact" data-nav class="btn"><span>Start the conversation</span><i></i></a></div>
</section>`;

P['/testimonials']=()=>`
<section class="hero" style="min-height:56svh;justify-content:flex-end">
  <h1 class="d1 rv" data-d="1">What couples<br>have said</h1>
  <p class="lead rv" data-d="2" style="margin-top:24px">${REVIEWS.length} of them below, from Google and Facebook, copied across as written, typos and all. Tap one to read it in full where it was posted.</p>
  ${PAPER?paperProof():proof()}
</section>

<section style="padding-top:0">
  <div class="rgrid">
    ${REVIEWS.map((r,i)=>`
      <article class="rev rv" data-d="${i%3}">
        <div class="rev-top">${revRating(r)}${r.src==='g'?G_LOGO:M_LOGO}</div>
        <p class="rev-x"><q>${esc(r.x)}</q></p>
        <div class="who"><a class="rev-open" href="${esc(r.l)}" target="_blank" rel="noopener" aria-label="${esc(r.n)}’s full review on ${r.src==='g'?'Google':'Facebook'}">${esc(r.n)}</a></div>
      </article>`).join('')}
  </div>
</section>

<section class="cta">
  <h2 class="rv">Add yours</h2>
  <div class="rv" data-d="1" style="margin-top:38px"><a href="#/contact" data-nav class="btn"><span>Work with us</span><i></i></a></div>
</section>`;

/* ---------- enquiry form ----------
   Studio Ninja's contact form, embedded. Enquiries go straight into Studio
   Ninja as leads. The form's fields and look are edited in Studio Ninja's
   form builder, not here. */
const SN_FORM='https://app.studioninja.co/contactform/parser/0a800fc8-7cc8-186f-817c-e0d40ca12ec6/0a800fc8-86e5-1a1e-8186-ee1ec0214c29';
const SN_RESIZER='https://app.studioninja.co/client-assets/form-render/assets/scripts/iframeResizer.js';

P['/contact']=()=>`
<section class="cg">
  <div class="cg-side">
    <h1 class="letter-h">Write to us</h1>
    <p class="lead">Tell us a little about your wedding and we’ll come back to you, usually within a day or two.</p>
    <ul class="quickline">
      <li><b>Instagram</b> <a href="https://instagram.com/chaarbhai" target="_blank" rel="noopener">@chaarbhai</a></li>
      <li><b>Based in</b> the Greater Toronto Area</li>
      <li><b>Booking</b> 2026 and 2027</li>
    </ul>
  </div>

  <div class="sn-wrap">
    ${EST?`<div class="sn-est">
      <span class="k">Your estimate from Prices</span>
      <p id="sn-est-text">${esc(EST)}</p>
      <button type="button" class="sn-copy" id="sn-copy">Copy it for your message</button>
    </div>`:''}
    <div class="sn-slot"><p class="sn-wait">Loading the form…</p></div>
    <p class="sn-fallback">Form not loading? <a href="${SN_FORM}" target="_blank" rel="noopener">Open it in a new tab</a>, or message us on Instagram at <a href="https://instagram.com/chaarbhai" target="_blank" rel="noopener">@chaarbhai</a>.</p>
  </div>
</section>`;

/* ================= ENGINE ================= */
/* Header and footer keep the original studio mark. */
const LOGO='img/logo.png';
const isLight=()=>document.documentElement.dataset.theme==='light';
function paintLogos(){document.querySelectorAll('img[data-logo]').forEach(el=>{
  if(el.getAttribute('src')!==LOGO)el.setAttribute('src',LOGO);});}
paintLogos();
/* the switch: flips the theme, remembers it, and says what it will do next */
/* Paper theme only: each nav link carries its own text so CSS can reserve the italic width (no shift on hover) */
if(document.documentElement.dataset.theme==='paper')document.querySelectorAll('nav.links a').forEach(a=>{a.dataset.t=a.textContent.trim()});
const themeSw=document.getElementById('themesw');
const paperTogglePage=()=>document.documentElement.dataset.theme==='paper'&&
  (document.documentElement.classList.contains('on-work')||document.documentElement.classList.contains('on-about')||document.documentElement.classList.contains('on-services')||document.documentElement.classList.contains('on-reviews'));
function syncThemeUI(){
  const light=isLight(),dark=document.documentElement.classList.contains('paper-dark');
  themeSw.setAttribute('aria-label',paperTogglePage()?(dark?'Switch to light mode':'Switch to dark mode'):(light?'Switch to dark mode':'Switch to light mode'));
}
syncThemeUI();
themeSw.addEventListener('click',()=>{
  if(paperTogglePage()){
    const dark=!document.documentElement.classList.contains('paper-dark');
    document.documentElement.classList.toggle('paper-dark',dark);
    try{sessionStorage.setItem('cb-paper-dark',dark?'1':'0')}catch(e){}
    syncThemeUI();track('paper_theme_switch',{theme:dark?'dark':'light'});return;
  }
  const root=document.documentElement,light=!isLight();
  if(light)root.dataset.theme='light';else delete root.dataset.theme;
  try{sessionStorage.setItem('cb-theme',light?'light':'dark')}catch(e){}
  syncThemeUI();
  track('theme_switch',{theme:light?'light':'dark'});
});
/* clicks worth counting: review badges, the hiring email, social links */
document.addEventListener('click',e=>{
  const a=e.target.closest('a');if(!a)return;
  if(a.dataset.reviewSource||a.classList.contains('pb'))track('review_badge_click',{platform:a.dataset.reviewSource||(a.classList.contains('pb-g')?'google':'meta')});
  else if(a.href.startsWith('mailto:')&&a.closest('.hire'))track('hiring_email_click');
  else if(/instagram\.com|youtube\.com|tiktok\.com|linkedin\.com/.test(a.href))track('social_click',{network:(a.href.match(/(instagram|youtube|tiktok|linkedin)/)||[])[1]});
});
const main=document.getElementById('main');
let io;
/* analytics: a no-op unless the tag loaded (see <head>) */
const track=(name,params={})=>{if(window.CB_GA)gtag('event',name,params)};
const GA_PATH={'/':'/','/portfolio':'/work','/about':'/about','/services':'/prices','/testimonials':'/reviews','/contact':'/contact'};
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
/* resolves once the preloader has fully faded, so the hero reveal is seen */
let preGoneResolve; const preGone=new Promise(r=>preGoneResolve=r);

/* reveal an element, then mark it .done once its longest possible reveal
   (0.9s + 0.3s stagger) is over, which removes the reveal transition */
function reveal(el){
  if(el.classList.contains('show'))return;
  el.classList.add('show');
  setTimeout(()=>el.classList.add('done'),1300);
}
/* the hover fill carries an ink copy of each button's label */
function labelFills(){
  document.querySelectorAll('.btn,.book').forEach(b=>{
    const s=b.querySelector(':scope>span'),i=b.querySelector(':scope>i');
    if(s&&i){i.dataset.l=s.textContent;i.setAttribute('aria-hidden','true')}
  });
}
labelFills();

function observe(){
  if(io)io.disconnect();
  io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const t=e.target;io.unobserve(t);preGone.then(()=>reveal(t))}}),
    {threshold:.11,rootMargin:'0px 0px -5% 0px'});
  observeRv(document);
}
function observeRv(root){root.querySelectorAll('.rv,.rv-img,.rv-l,.hero-arch').forEach(el=>io.observe(el))}
/* Mouse drag for the photo strips (touch already scrolls natively).
   The strip follows the pointer 1:1. On release, velocity over the last 100ms
   is projected forward with Apple's normal scroll deceleration (0.998/ms),
   limited to two frames either way, and the strip glides to the nearest frame. */
function dragScroll(strips){
  const DECEL=0.998, project=v=>v*DECEL/(1-DECEL);
  strips.forEach(t=>{
    const frames=[...t.querySelectorAll('.frame')]; if(!frames.length)return;
    let down=false,sx=0,sl=0,samples=[],settle=null;
    const release=()=>{clearTimeout(settle);settle=null;t.classList.remove('drag')};
    t.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0)return;
      e.preventDefault();
      clearTimeout(settle);settle=null;          // grabbing mid-glide stops it where it is
      cbGlide.stop(t);
      down=true;sx=e.clientX;sl=t.scrollLeft;samples=[{x:e.clientX,t:e.timeStamp}];
      t.classList.add('drag');
      t.setPointerCapture(e.pointerId);
    });
    t.addEventListener('pointermove',e=>{
      if(!down)return;
      t.scrollLeft=sl-(e.clientX-sx);
      samples.push({x:e.clientX,t:e.timeStamp});
      while(samples.length>2&&e.timeStamp-samples[0].t>100)samples.shift();
    });
    const up=e=>{
      if(!down)return;
      down=false;
      if(Math.abs(e.clientX-sx)<6){                // a click, not a drag: open that photo larger
        release();cbGlide.stop(t);t.scrollLeft=sl;
        const f=document.elementFromPoint(e.clientX,e.clientY);
        if(e.type==='pointerup'&&f&&f.closest('.frame'))lightbox(f.closest('.frame'));
        return;
      }
      const a=samples[0],b=samples[samples.length-1],dt=b.t-a.t;
      const v=dt>0&&e.timeStamp-b.t<60?(b.x-a.x)/dt:0;   // px/ms; a pause before letting go means no fling
      const x0=frames[0].offsetLeft,pos=frames.map(f=>f.offsetLeft-x0);
      const max=t.scrollWidth-t.clientWidth,cur=t.scrollLeft;
      const nearest=x=>pos.reduce((bi,p,i)=>Math.abs(p-x)<Math.abs(pos[bi]-x)?i:bi,0);
      const from=nearest(cur);
      let i=nearest(cur-project(v));
      i=Math.max(0,Math.min(frames.length-1,Math.max(from-2,Math.min(from+2,i))));
      const left=Math.min(pos[i],max);
      if(Math.abs(left-cur)<1){release();return}
      cbGlide(t,'x',left,320,release);            // one interruptible settle; the callback ends the drag state, no timer
    };
    t.addEventListener('pointerup',up);
    t.addEventListener('pointercancel',up);
  });
}
/* Larger view. A click on a frame (Enter or Space from the keyboard) opens it
   full screen; the arrows, arrow keys or a swipe step through that strip.
   Mouse clicks come from dragScroll(), which owns the pointer on the strip. */
let LB=null;
function lightbox(frame){
  if(!LB){
    const el=document.createElement('div');
    el.id='lb';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Photo');
    el.innerHTML=`<button class="lb-x" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg></button>
      <button class="lb-prev" aria-label="Previous photo">${ARROW('l')}</button>
      <figure class="lb-fig"><img alt="" draggable="false" decoding="async"><figcaption><span class="lb-no"></span><span class="lb-cap"></span><span class="lb-t mono"></span></figcaption></figure>
      <button class="lb-next" aria-label="Next photo">${ARROW('r')}</button>`;
    document.body.appendChild(el);
    const img=el.querySelector('img'),q=c=>el.querySelector(c);
    LB={el,img,list:[],i:0,title:'',opener:null};
    LB.show=i=>{
      const L=LB.list; LB.i=i=Math.max(0,Math.min(L.length-1,i));
      const src=L[i].querySelector('.fr-img img');
      img.classList.add('swap');
      const ss=src.dataset.ss||src.srcset,su=src.dataset.u||src.src;   // Work frames keep the full set in data-*, see photoWindow
      const nxt=new Image();nxt.decoding="async"; nxt.sizes='94vw'; nxt.srcset=ss;
      const put=()=>{img.sizes='94vw';img.srcset=ss;img.src=su;img.alt=src.alt;img.classList.remove('swap')};
      nxt.onload=put; nxt.onerror=put; nxt.src=su;
      q('.lb-no').textContent=String(i+1).padStart(2,'0')+' / '+String(L.length).padStart(2,'0');
      q('.lb-cap').textContent=L[i].querySelector('.fr-cap span:last-child').textContent;
      q('.lb-t').textContent=LB.title;
      q('.lb-prev').disabled=i===0; q('.lb-next').disabled=i===L.length-1;
    };
    LB.close=()=>{
      el.classList.remove('on');document.documentElement.classList.remove('lb-open');
      setTimeout(()=>{if(!el.classList.contains('on'))el.hidden=true},reduceMotion()?0:280);
      const f=LB.list[LB.i];                      // leave the strip on the photo last viewed
      if(f)f.closest('.seq-strip').scrollTo({left:f.offsetLeft-f.parentNode.firstElementChild.offsetLeft,behavior:'auto'});
      if(LB.opener)LB.opener.focus({preventScroll:true});
    };
    q('.lb-x').addEventListener('click',LB.close);
    q('.lb-prev').addEventListener('click',()=>LB.show(LB.i-1));
    q('.lb-next').addEventListener('click',()=>LB.show(LB.i+1));
    el.addEventListener('click',e=>{if(e.target===el||e.target.classList.contains('lb-fig'))LB.close()});
    el.addEventListener('keydown',e=>{
      if(e.key==='Escape')LB.close();
      else if(e.key==='ArrowLeft')LB.show(LB.i-1);
      else if(e.key==='ArrowRight')LB.show(LB.i+1);
      else if(e.key==='Tab'){                     // keep focus inside the viewer
        const b=[...el.querySelectorAll('button:not(:disabled)')],k=b.indexOf(document.activeElement);
        e.preventDefault();b[(k+(e.shiftKey?-1:1)+b.length)%b.length].focus();
      }
    });
    let sx=null,sy=0;                             // swipe on touch screens
    q('.lb-fig').addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'){sx=e.clientX;sy=e.clientY}});
    q('.lb-fig').addEventListener('pointerup',e=>{
      if(sx===null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
      if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))LB.show(LB.i+(dx<0?1:-1));
    });
  }
  const seq=frame.closest('.seq');
  LB.list=[...seq.querySelectorAll('.frame')];
  LB.title=seq.dataset.label;
  LB.opener=frame.querySelector('.fr-img');
  LB.show(LB.list.indexOf(frame));
  LB.el.hidden=false;document.documentElement.classList.add('lb-open');
  requestAnimationFrame(()=>requestAnimationFrame(()=>LB.el.classList.add('on')));
  LB.el.querySelector('.lb-x').focus({preventScroll:true});
}
document.addEventListener('click',e=>{            // touch taps and keyboard; mouse goes through dragScroll()
  const f=e.target.closest&&e.target.closest('.frame .fr-img');
  if(f&&!(e.pointerType==='mouse'))lightbox(f.closest('.frame'));
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.frame .fr-img')){e.preventDefault();lightbox(e.target.closest('.frame'))}
});
/* No right-click "Save image" and no dragging photos out. Screenshots can't be stopped. */
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('img,#lb'))e.preventDefault()});
document.addEventListener('dragstart',e=>{if(e.target.tagName==='IMG')e.preventDefault()});
/* The strip counters only depend on the width. iPhone Safari fires resize every time its toolbars slide in or out
   (so on every change of scroll direction); re-measuring all ~130 strips then froze the page for a moment, right
   when the header should come back. Now: width changes only, once per frame, and only the live strips. */
let seqW=innerWidth,seqRaf=0;
addEventListener('resize',()=>{
  if(innerWidth===seqW)return;seqW=innerWidth;
  cancelAnimationFrame(seqRaf);seqRaf=requestAnimationFrame(()=>stripIO.forEach((io,strip)=>strip._upd&&strip._upd()));
},{passive:true});
function sequences(seqs){
  seqs.forEach(seq=>{
    const strip=seq.querySelector('.seq-strip'),cnt=seq.querySelector('.seq-count'),cap=seq.querySelector('.ps-cap-t'),
          bar=seq.querySelector('.seq-bar i'),prev=seq.querySelector('.sq-prev'),
          next=seq.querySelector('.sq-next'),frames=[...strip.querySelectorAll('.frame')],
          total=frames.length;
    if(!total)return;
    let shown=0,target=null,settleTimer=0;
    let pc=null;                                   // frame positions, rebuilt only when the strip's size changes
    const positions=()=>{
      const w=strip.clientWidth,sw=strip.scrollWidth;
      if(!pc||pc.w!==w||pc.sw!==sw){const first=frames[0].offsetLeft,max=Math.max(0,sw-w);pc={w,sw,p:frames.map(f=>Math.min(max,f.offsetLeft-first))};}
      return pc.p;
    };
    const current=()=>{const pos=positions();let best=0;pos.forEach((x,i)=>{if(Math.abs(x-strip.scrollLeft)<Math.abs(pos[best]-strip.scrollLeft)-.5)best=i;});return best;};
    const upd=()=>{
      if(!strip.isConnected||!strip.clientWidth)return;
      const max=strip.scrollWidth-strip.clientWidth,i=current()+1;
      if(i!==shown){
        cnt.textContent=i+' of '+total;
        if(cap)cap.textContent=frames[i-1].querySelector('.fr-cap span').textContent;
        shown=i;
      }
      bar.style.transform='scaleX('+(max>2?strip.scrollLeft/max:1)+')';
      prev.disabled=strip.scrollLeft<4;next.disabled=strip.scrollLeft>=max-4;
    };
    const move=delta=>{
      const pos=positions(),base=target===null?current():target;
      target=Math.max(0,Math.min(total-1,base+delta));
      if(cbDesk())cbGlide(strip,'x',pos[target],300,()=>{target=null});
      else strip.scrollTo({left:pos[target],behavior:reduceMotion()?'auto':'smooth'});
    };
    let updRaf=0;                                  // at most one update per frame while scrolling
    strip.addEventListener('scroll',()=>{
      if(!updRaf)updRaf=requestAnimationFrame(()=>{updRaf=0;upd()});
      clearTimeout(settleTimer);settleTimer=setTimeout(()=>target=null,180);
    },{passive:true});
    strip.addEventListener('scrollend',()=>{target=null;upd();});
    /* Desktop wheel and trackpad stay native (no CSS snapping there). 140ms after the last horizontal wheel event, glide to the
       nearest frame in the direction of travel, 320ms. */
    let wTimer=0,wDir=0,wFrom=null;
    strip.addEventListener('wheel',e=>{
      target=null;cbGlide.stop(strip);           // input interrupts an arrow glide; resume from where the strip is
      if(!cbDesk()||Math.abs(e.deltaX)<=Math.abs(e.deltaY)||e.ctrlKey)return;
      if(wFrom===null)wFrom=strip.scrollLeft;
      wDir=e.deltaX>0?1:-1;clearTimeout(wTimer);
      wTimer=setTimeout(()=>{
        const pos=positions(),x=strip.scrollLeft,from=wFrom;wFrom=null;
        const near=v=>pos.reduce((bi,p,k)=>Math.abs(p-v)<Math.abs(pos[bi]-v)?k:bi,0);
        let i=near(x);
        if(i===near(from)&&Math.abs(x-from)>=12)i=Math.max(0,Math.min(pos.length-1,i+wDir));   // a real push always moves one frame
        cbGlide(strip,'x',pos[i],320);
      },140);
    },{passive:true});
    /* Left and Right on a focused strip jump one frame at once: keys never animate. */
    strip.addEventListener('keydown',e=>{
      if((e.key!=='ArrowLeft'&&e.key!=='ArrowRight')||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||!cbDesk())return;
      e.preventDefault();cbGlide.stop(strip);
      const pos=positions(),i=Math.max(0,Math.min(total-1,current()+(e.key==='ArrowRight'?1:-1)));
      strip.scrollLeft=pos[i];target=null;
    });
    strip.addEventListener('pointerdown',()=>target=null,{passive:true});
    strip.addEventListener('touchstart',()=>target=null,{passive:true});
    prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
    strip._upd=upd;                                // run when the slide goes live (warmRow), not now
  });
}
/* The Work page holds ~1,000 photos in ~100 sideways strips. iPhone Safari gives every scrollable strip its own
   native scroll layer and kills the tab when a page holds too much ("A problem repeatedly occurred"). So only the
   active slide and its two neighbours are live (photo-stage.js): a live strip scrolls and shows its pictures, and only the frames
   within a strip-width of what's showing in it have a picture at all. Every other strip is overflow:hidden
   (no scroll layer) and all its frames hold the 1px placeholder. Coming back is quick: the browser keeps the files.
   Phones (any orientation) use the 640px copy; bigger screens pick from the full set. The lightbox reads data-*. */
const stripIO=new Map(),parkTimers=new WeakMap(),pendingParks=[];
/* background work waits while the page is moving, so a scroll (and the header) never queue behind it */
let lastScroll=0;addEventListener('scroll',()=>{lastScroll=performance.now()},{passive:true});
const scrolling=()=>performance.now()-lastScroll<250;
const smallScreen=()=>matchMedia('(max-width:700px)').matches||
  (matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<=500);
function hydrate(im){
  if(smallScreen()){im.removeAttribute('srcset');im.removeAttribute('sizes')}
  else{im.sizes=im.dataset.sz;im.srcset=im.dataset.ss}
  im.src=im.dataset.u;im.dataset.on='1';
}
function park(im){im.removeAttribute('srcset');im.src=TINY;im.dataset.on='0'}
function warmRow(seq){
  const strip=seq.querySelector('.seq-strip');if(!strip||stripIO.has(strip))return;
  strip.classList.remove('cold');
  if(strip._upd){const u=strip._upd,run=()=>scrolling()?setTimeout(run,150):u();setTimeout(run,0)}   // reads layout: not mid-scroll
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    const im=e.target,on=im.dataset.on==='1',pending=parkTimers.get(im);
    if(e.isIntersecting){
      if(pending){clearTimeout(pending);parkTimers.delete(im);const i=pendingParks.findIndex(p=>p.im===im);if(i>=0)pendingParks.splice(i,1)}
      if(!on)hydrate(im);
    }
    else if(on&&!pending){
      // Reversing a trackpad glide often re-enters the prior frame immediately.
      // Keep at most four recently seen images decoded briefly; coolRow drops them immediately.
      if(pendingParks.length>=4){
        const oldest=pendingParks.shift();clearTimeout(oldest.timer);parkTimers.delete(oldest.im);if(oldest.im.dataset.on==='1')park(oldest.im);
      }
      const item={im,strip,timer:0};
      item.timer=setTimeout(()=>{
        const i=pendingParks.indexOf(item);if(i>=0)pendingParks.splice(i,1);
        parkTimers.delete(im);if(stripIO.get(strip)===io&&im.dataset.on==='1')park(im);
      },800);
      parkTimers.set(im,item.timer);pendingParks.push(item);
    }
  }),{root:strip,rootMargin:'0px 100%'});
  strip.querySelectorAll('.fr-img img').forEach(im=>io.observe(im));
  stripIO.set(strip,io);
}
function coolRow(seq){
  const strip=seq.querySelector('.seq-strip');if(!strip)return;
  const io=stripIO.get(strip);if(io){io.disconnect();stripIO.delete(strip)}
  for(let i=pendingParks.length-1;i>=0;i--)if(pendingParks[i].strip===strip){const p=pendingParks.splice(i,1)[0];clearTimeout(p.timer);parkTimers.delete(p.im)}
  strip.querySelectorAll('.fr-img img').forEach(im=>{const timer=parkTimers.get(im);if(timer)clearTimeout(timer);parkTimers.delete(im);if(im.dataset.on==='1')park(im)});
  strip.classList.add('cold');
}
function photoWindow(){
  stripIO.forEach(io=>io.disconnect());stripIO.clear();
}
/* Prices page: package filter, location switch and the build-your-own
   estimate. Ported from Packages Page v2; runs each time the page renders. */
function pricing(){
    var root = main.querySelector('.pr'); if (!root) { return; }
    // Outside Canada the prices are the same numbers in US dollars (no
    // conversion): only the symbol changes, $3,300 becomes US$3,300.
    var cadFmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
    var usdFmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    var PACKAGES = {};
    PR.forEach(function (p) { PACKAGES[p.id] = p; });
    var PACKAGE_ORDER = PR.map(function (p) { return p.id; });

    var state = { filter: 'both', currency: 'CAD' };

    function money(cad) {
      if (state.currency === 'USD') {
        return usdFmt.format(cad);
      }
      return cadFmt.format(cad);
    }

    function basePrice(pkg) {
      if (state.filter === 'photo') { return pkg.pricePhoto; }
      if (state.filter === 'video') { return pkg.priceVideo; }
      return pkg.priceBoth;
    }

    function coverageWord() {
      if (state.filter === 'photo') { return 'photo'; }
      if (state.filter === 'video') { return 'video'; }
      return 'photo and video';
    }

    var packageRadios = Array.prototype.slice.call(root.querySelectorAll('input[name="package"]'));
    var addonRows = Array.prototype.slice.call(root.querySelectorAll('.addon-row[data-row]'));
    var filterButtons = Array.prototype.slice.call(root.querySelectorAll('[data-filter-btn]'));
    var currencyButtons = Array.prototype.slice.call(root.querySelectorAll('[data-currency-btn]'));
    var hourQtyEl = root.querySelector('#hour-qty');
    var hourIncrement = root.querySelector('#hour-increment');
    var hourDecrement = root.querySelector('#hour-decrement');
    var summaryLines = root.querySelector('#summary-lines');
    var summaryTotalValue = root.querySelector('#summary-total-value');
    var resetBtn = root.querySelector('#reset-btn');
    var builderHeading = root.querySelector('#builder-heading');
    var keepsakeHint = root.querySelector('#keepsake-hint');
    var submitCta = root.querySelector('#submit-cta');
    var heroLede = root.querySelector('#hero-lede');
    var priceBarNote = root.querySelector('#price-bar-note');
    var droneLine = root.querySelector('#drone-status-line');
        var STORAGE_KEY = 'chaarbhaiRequest';

    var HOUR_MAX = 6;
    var hourQty = 0;
    var currentEstimate = { pkg: 'first-light', packageLabel: 'First Light', filter: 'both', currency: 'CAD', hours: 0, lines: [], totalCad: 0 };

    var userChecked = {};
    addonRows.forEach(function (row) {
      var input = row.querySelector('input[type="checkbox"]');
      if (input) { userChecked[input.id] = false; }
    });

    function currentPackage() {
      var checked = packageRadios.filter(function (r) { return r.checked; })[0];
      return checked ? checked.value : packageRadios[0].value;
    }

    function photographerCount(pkg) {
      var count = pkg.photographers;
      var input = root.querySelector('#addon-second-photographer');
      if (input) {
        var includes = (input.dataset.includes || '').split(',').filter(Boolean);
        var included = includes.indexOf(pkg.id) !== -1;
        if (!included && input.checked) { count += 1; }
      }
      return count;
    }

    function videographerCount(pkg) {
      var count = pkg.videographers;
      var input = root.querySelector('#addon-second-videographer');
      if (input) {
        var includes = (input.dataset.includes || '').split(',').filter(Boolean);
        var included = includes.indexOf(pkg.id) !== -1;
        if (!included && input.checked) { count += 1; }
      }
      return count;
    }

    function totalShooters(pkg) {
      var p = photographerCount(pkg);
      var v = videographerCount(pkg);
      if (state.filter === 'photo') { return p; }
      if (state.filter === 'video') { return v; }
      // "Both" prices off the size of a single role's team, not the combined
      // headcount — a solo photographer plus a solo videographer is still a
      // single-shooter-per-role crew, so the bottom two packages price at
      // the single-shooter rate even though two people are on site.
      return Math.max(p, v);
    }

    function crewDescription(pkg) {
      var p = photographerCount(pkg);
      var v = videographerCount(pkg);
      var parts = [];
      if (state.filter !== 'video') { parts.push(p + ' photographer' + (p === 1 ? '' : 's')); }
      if (state.filter !== 'photo') { parts.push(v + ' videographer' + (v === 1 ? '' : 's')); }
      return parts.join(' · ');
    }

    // Base team size for a package, ignoring any builder add-ons — used on
    // the one-by-one package cards, which describe what each package comes
    // with by default, not the currently-configured builder state.
    function baseCrewDescription(pkg) {
      var parts = [];
      if (state.filter !== 'video') { parts.push(pkg.photographers + ' photographer' + (pkg.photographers === 1 ? '' : 's')); }
      if (state.filter !== 'photo') { parts.push(pkg.videographers + ' videographer' + (pkg.videographers === 1 ? '' : 's')); }
      return parts.join(' · ');
    }

    // Set by package, not by crew size: the two shorter packages bill extra
    // hours at $550, the two longer ones at $750.
    var HOUR_RATE = { 'first-light': 550, 'golden-hour': 550, 'till-dusk': 750, 'till-sunrise': 750 };
    function extraHourRate(pkg) {
      return HOUR_RATE[pkg.id];
    }

    function applyServiceVisibility() {
      Array.prototype.slice.call(root.querySelectorAll('[data-service]')).forEach(function (el) {
        var svc = el.getAttribute('data-service');
        var visible = state.filter === 'both' || state.filter === svc;
        el.classList.toggle('is-hidden', !visible);
      });
    }

    function syncToggleButtons() {
      filterButtons.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-filter-value') === state.filter);
      });
      currencyButtons.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-currency-value') === state.currency);
      });
    }

    function renderStatic() {
      if (heroLede) {
        if (state.filter === 'photo') {
          heroLede.textContent = 'Four packages built around how long your wedding day actually runs. Every one includes a photographer, professional retouching, and a private online gallery.';
        } else if (state.filter === 'video') {
          heroLede.textContent = 'Four packages built around how long your wedding day actually runs. Every one includes a videographer, standard audio and interview setup, and your film delivered through a private download link.';
        } else {
          heroLede.textContent = 'Four packages built around how long your wedding day actually runs. Every one includes a photographer and a videographer, professional retouching, and a private online gallery.';
        }
      }

      if (priceBarNote) {
        priceBarNote.textContent = state.currency === 'USD' ? 'Prices shown in USD for weddings outside Canada' : 'All prices in CAD';
      }

      var internationalNote = root.querySelector('#international-note');
      if (internationalNote) {
        internationalNote.classList.toggle('is-hidden', state.currency !== 'USD');
      }

      PACKAGE_ORDER.forEach(function (id) {
        var pkg = PACKAGES[id];
        var priceValueEl = root.querySelector('#section-' + id + ' .pkg-price .price-value');
        var supEl = root.querySelector('#section-' + id + ' .pkg-price sup');
        if (priceValueEl) { priceValueEl.textContent = money(basePrice(pkg)); }
        if (supEl) { supEl.textContent = state.currency; }

        var coverageLine = root.querySelector('#section-' + id + ' .coverage-line');
        if (coverageLine) { coverageLine.textContent = pkg.hours + ' hours of ' + coverageWord() + ' coverage'; }


        var colPrice = root.querySelector('.compare-grid .col-head[data-pkg="' + id + '"] .col-price');
        if (colPrice) { colPrice.textContent = money(basePrice(pkg)); }
      });

      applyServiceVisibility();
    }

    // Single pass: sets checked/disabled/price-label state on every row,
    // using userChecked as the source of truth, then renders the summary
    // from that same state so the two never disagree.
    function sync() {
      var pkgId = currentPackage();
      var pkg = PACKAGES[pkgId];
      var freeQuota = pkg.freeKeepsakes;
      var freeUsed = 0;

      PACKAGE_ORDER.forEach(function (id) {
        var pillPrice = root.querySelector('.pill[data-pkg="' + id + '"] .pill-price');
        if (pillPrice) { pillPrice.textContent = money(basePrice(PACKAGES[id])); }
      });

      // First pass: correct every row's checked/disabled/included state for
      // the package now selected. totalShooters()/extraHourRate() below read
      // input.checked on the second-photographer/second-videographer rows,
      // so that state has to be settled before we compute the hourly rate —
      // otherwise it reads whatever state the PREVIOUS package left behind.
      addonRows.forEach(function (row) {
        var input = row.querySelector('input[type="checkbox"]');
        var priceEl = row.querySelector('.addon-price');
        if (!input) { return; }

        if (row.dataset.pool === 'keepsake') {
          if (input.id === 'addon-parent-album') {
            var hasBaseAlbum = !!(userChecked['addon-album-standard'] || userChecked['addon-album-premium']);
            if (!hasBaseAlbum) {
              input.disabled = true;
              input.checked = false;
              userChecked[input.id] = false;
              row.classList.remove('is-included');
              priceEl.textContent = 'Pick an album first';
              priceEl.classList.remove('is-included-badge');
              return;
            }
          }
          input.disabled = false;
          input.checked = userChecked[input.id];
          row.classList.remove('is-included');
          if (input.checked) {
            freeUsed += 1;
            if (freeUsed <= freeQuota) {
              row.classList.add('is-included');
              priceEl.textContent = 'Free pick';
              priceEl.classList.add('is-included-badge');
            } else {
              priceEl.textContent = money(Number(input.dataset.price));
              priceEl.classList.remove('is-included-badge');
            }
          } else {
            priceEl.textContent = money(Number(input.dataset.price));
            priceEl.classList.remove('is-included-badge');
          }
          return;
        }

        var includes = (input.dataset.includes || '').split(',').filter(Boolean);
        var isIncluded = includes.indexOf(pkgId) !== -1;

        if (isIncluded) {
          row.classList.add('is-included');
          input.disabled = true;
          input.checked = true;
          priceEl.textContent = 'Included';
          priceEl.classList.add('is-included-badge');
        } else {
          row.classList.remove('is-included');
          input.disabled = false;
          input.checked = userChecked[input.id];
          priceEl.classList.remove('is-included-badge');
          if (input.dataset.rate) {
            priceEl.textContent = money(Number(input.dataset.rate) * (pkg.hours + hourQty));
          } else {
            priceEl.textContent = money(Number(input.dataset.price));
          }
        }
      });

      if (freeQuota === 0) {
        keepsakeHint.textContent = 'No complimentary picks on this package, each album option here is a paid add-on.';
      } else {
        keepsakeHint.textContent = Math.min(freeUsed, freeQuota) + ' of ' + freeQuota + ' complimentary pick' + (freeQuota > 1 ? 's' : '') + ' used.';
      }

      // Second pass: checked/disabled state is now correct for this package,
      // so the shooter count (and the hourly rate it drives) is safe to read.
      var rate = extraHourRate(pkg);
      var hourSub = root.querySelector('#hour-rate-sub');
      if (hourSub) {
        hourSub.textContent = money(rate) + ' per hour on ' + pkg.name;
      }

      if (droneLine) {
        if (videographerCount(pkg) >= 2) {
          droneLine.innerHTML = '<strong>Drone coverage.</strong> Included, since you\'ve added a second videographer.';
        } else {
          droneLine.innerHTML = '<strong>Drone coverage.</strong> Not possible with a single videographer, since they can\'t fly and shoot at the same time. Add a second videographer above and drone coverage comes with it.';
        }
      }

      renderSummary(pkg, rate);
    }

    var prevLabels = null;   // labels shown last time, so only new lines animate
    function renderSummary(pkg, rate) {
      var total = basePrice(pkg);
      var lines = [];

      lines.push({ label: pkg.name + ' package (' + coverageWord() + ')', price: basePrice(pkg), base: true });

      if (hourQty > 0) {
        var hoursCost = hourQty * rate;
        total += hoursCost;
        lines.push({ label: 'Extra hours × ' + hourQty + ' (' + money(rate) + '/hr)', price: hoursCost });
      }

      addonRows.forEach(function (row) {
        var input = row.querySelector('input[type="checkbox"]');
        var nameEl = row.querySelector('.addon-name');
        if (!input || !input.checked) { return; }
        if (row.classList.contains('is-hidden')) { return; }

        if (row.dataset.pool === 'keepsake') {
          var isFree = row.classList.contains('is-included');
          var price = isFree ? 0 : Number(input.dataset.price);
          total += price;
          lines.push({ label: nameEl.textContent + (isFree ? ' (free pick)' : ''), price: price });
          return;
        }

        var includes = (input.dataset.includes || '').split(',').filter(Boolean);
        var isIncluded = includes.indexOf(pkg.id) !== -1;
        if (!isIncluded) {
          var addonPrice = input.dataset.rate ? Number(input.dataset.rate) * (pkg.hours + hourQty) : Number(input.dataset.price);
          total += addonPrice;
          lines.push({ label: nameEl.textContent, price: addonPrice });
        }
      });

      summaryLines.innerHTML = '';
      var seen = prevLabels;
      prevLabels = lines.map(function (line) { return line.label; });
      lines.forEach(function (line) {
        var li = document.createElement('li');
        li.className = 'summary-line' + (line.base ? ' summary-line--base' : '') + (seen && seen.indexOf(line.label) === -1 ? ' new' : '');
        var a = document.createElement('span');
        a.textContent = line.label;
        var b = document.createElement('span');
        b.textContent = money(line.price);
        li.appendChild(a);
        li.appendChild(b);
        summaryLines.appendChild(li);
      });

      summaryTotalValue.textContent = money(total);

      currentEstimate = {
        pkg: pkg.id,
        packageLabel: pkg.name,
        filter: state.filter,
        currency: state.currency,
        hours: hourQty,
        lines: lines.slice(),
        totalCad: total
      };

      persistSelection();
      updateSubmitLink();
    }

    function persistSelection() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEstimate));
      } catch (e) {
        // Private browsing or storage disabled — the link's query string
        // below still carries the selection through to the contact page.
      }
    }

    // The estimate travels to the contact letter as a sentence, and to Netlify
    // as a hidden "estimate" field, when the visitor follows the button.
    function updateSubmitLink() {
      // "Printed album, standard (free pick)" reads as "printed album (standard, free pick)"
      // so the list of add-ons doesn't dissolve into commas inside the letter.
      var addonLabels = currentEstimate.lines
        .filter(function (line) { return !line.base; })
        .map(function (line) {
          if (/^Extra hours/.test(line.label)) {
            return currentEstimate.hours + ' extra hour' + (currentEstimate.hours === 1 ? '' : 's');
          }
          var label = line.label.replace(/, ([^()]+?)( \(|$)/, ' ($1)$2').replace(') (', ', ');
          return label.charAt(0).toLowerCase() + label.slice(1);
        });
      var text = currentEstimate.packageLabel + ' (' + coverageWord() + ')';
      if (addonLabels.length === 1) { text += ' plus ' + addonLabels[0]; }
      if (addonLabels.length > 1) { text += ' plus ' + addonLabels.slice(0, -1).join(', ') + ' and ' + addonLabels[addonLabels.length - 1]; }
      text += ', about ' + money(currentEstimate.totalCad) + ' ' + currentEstimate.currency;
      submitCta.dataset.est = text;
    }

    function onFilterOrCurrencyChange() {
      syncToggleButtons();
      applyServiceVisibility();
      addonRows.forEach(function (row) {
        if (row.hasAttribute('data-service')) {
          var svc = row.getAttribute('data-service');
          var visible = state.filter === 'both' || state.filter === svc;
          if (!visible) {
            var input = row.querySelector('input[type="checkbox"]');
            if (input) { userChecked[input.id] = false; }
          }
        }
      });
      renderStatic();
      sync();
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.filter = btn.getAttribute('data-filter-value');
        onFilterOrCurrencyChange();
      });
    });

    currencyButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var was = state.currency;
        state.currency = btn.getAttribute('data-currency-value');
        onFilterOrCurrencyChange();
        if (was !== state.currency) {
          root.querySelectorAll('.pkg-price, .compare-grid .col-price, #summary-total-value').forEach(function (el) {
            el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
          });
        }
      });
    });

    packageRadios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        sync();
        track('select_package',{package:radio.value});
      });
    });

    addonRows.forEach(function (row) {
      var input = row.querySelector('input[type="checkbox"]');
      if (!input) { return; }
      input.addEventListener('change', function () {
        if (!input.disabled) {
          userChecked[input.id] = input.checked;
          sync();
        }
      });
    });

    hourIncrement.addEventListener('click', function () {
      if (hourQty < HOUR_MAX) { hourQty += 1; hourQtyEl.textContent = hourQty; sync(); }
    });
    hourDecrement.addEventListener('click', function () {
      if (hourQty > 0) { hourQty -= 1; hourQtyEl.textContent = hourQty; sync(); }
    });

    resetBtn.addEventListener('click', function () {
      packageRadios[0].checked = true;
      addonRows.forEach(function (row) {
        var input = row.querySelector('input[type="checkbox"]');
        if (input) { input.checked = false; userChecked[input.id] = false; }
      });
      hourQty = 0;
      hourQtyEl.textContent = hourQty;
      state.filter = 'both';
      state.currency = 'CAD';
      syncToggleButtons();
      applyServiceVisibility();
      renderStatic();
      sync();
    });

    Array.prototype.slice.call(root.querySelectorAll('[data-goto-pkg]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pkg = btn.getAttribute('data-goto-pkg');
        var radio = root.querySelector('#pkg-' + pkg);
        if (radio) {
          radio.checked = true;
          sync();
        }
        builderHeading.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
      });
    });

    submitCta.addEventListener('click', function () {
      EST = submitCta.dataset.est;
      track('send_estimate',{package:currentEstimate.pkg,service:currentEstimate.filter,value:currentEstimate.totalCad,currency:'CAD'});
    });

    syncToggleButtons();
    renderStatic();
    sync();
}
/* auto sizing inline letter fields */
/* Home intro: penRelease() lets the site (header, hero copy, labels) fade in around the drawing, penUnlock() ends the intro. */
function penRelease(){document.documentElement.classList.remove('cb-pen-hold')}   // the site starts coming up, piece by piece (CSS delays)
function penUnlock(){                                                             // the drawing is done: scrolling and the normal header behaviour are back
  const h=document.documentElement;penRelease();document.body.classList.remove('locked');
  setTimeout(()=>{h.classList.add('cb-pen-exit');h.classList.remove('cb-pen-boot');setTimeout(()=>h.classList.remove('cb-pen-exit'),700)},1500);   // cb-pen-exit: the background fades back to the theme colour
}
/* The pen describes the wait; the completed mark then becomes the header logo. */
let heroPen=null,heroSizing=null,heroLogo=null,heroVisited=false;
function firstHeroVisit(){
  let seen=heroVisited;
  try{seen=seen||sessionStorage.getItem('cb-hero-seen')==='1';sessionStorage.setItem('cb-hero-seen','1')}catch(e){}
  heroVisited=true;
  return !seen||document.documentElement.classList.contains('cb-pen-boot');   // a fresh load of Home always draws the pen
}
/* Paper only: the pen logo is a full-screen loading screen, drawn by the real buffer progress of the hero film (see theme-paper.css).
   It releases when the film can play (never before 1.2s, never after 10s), then fades and the site comes up piece by piece. */
function paperLoader(placeholder,video,reveal){
  const reduce=reduceMotion(),MIN=1200,MAX=10000;
  const MSGS=['Welcome to Chaar Bhai','We are getting ready for you','Almost there','Get ready'];
  const box=document.createElement('div');box.className='paper-loader';box.setAttribute('role','status');box.setAttribute('aria-busy','true');
  box.innerHTML='<div class="pl-art"></div><div class="pl-meta"><span class="pl-num" aria-hidden="true">0<small>%</small></span><span class="pl-rule" aria-hidden="true"><i></i></span><p class="pl-msg"></p></div>';
  document.body.appendChild(box);placeholder.remove();
  const art=box.querySelector('.pl-art'),num=box.querySelector('.pl-num'),bar=box.querySelector('.pl-rule i'),msg=box.querySelector('.pl-msg');
  let pen=null,frame=0,disposed=false,ready=false,released=false,forced=false,shown=0,msgI=0,msgT=0,leaveT=0;
  const t0=performance.now();let last=t0;
  const setMsg=t=>{msg.textContent=t};
  setMsg(MSGS[0]);
  if(reduce)art.innerHTML='<img src="img/pen-loader-1.png" alt="">';
  else{pen=CBPenLoader.mount(art,{manual:true,label:'Chaar Bhai. Film loading.'});heroPen=pen;pen.seek(0);}
  if(!reduce){
    msgT=setInterval(()=>{
      if(msgI>=MSGS.length-1){clearInterval(msgT);return}
      msgI++;msg.classList.add('out');setTimeout(()=>{if(disposed)return;setMsg(MSGS[msgI]);msg.classList.remove('out')},300);
    },2300);
  }
  const bufEnd=()=>{try{const b=video.buffered;return b.length?b.end(b.length-1):0}catch(e){return 0}};
  const realTarget=()=>{
    if(ready||forced)return 1;
    const d=video.duration,need=isFinite(d)&&d>0?Math.min(d,3):3;
    return Math.min(.96,bufEnd()/need);
  };
  const paint=()=>{
    const pct=Math.round(shown*100);
    num.firstChild.nodeValue=String(pct);bar.style.transform=`scaleX(${shown})`;
    if(pen)pen.seek(shown*pen.drawEnd);
  };
  const leave=()=>{
    if(released||disposed)return;released=true;
    box.setAttribute('aria-busy','false');
    box.classList.add('is-leaving');                       // the loader fades (0.7s)
    leaveT=setTimeout(()=>{if(disposed)return;penRelease();penUnlock();reveal();},reduce?0:450);   // the frame, bar and cue come up and the film starts
    setTimeout(()=>{box.remove();if(pen){pen.destroy();if(heroPen===pen)heroPen=null;pen=null}},reduce?50:900);
  };
  const tick=now=>{
    if(disposed||released)return;
    const dt=now-last;last=now;const el=now-t0;
    if(el>=MAX&&!ready)forced=true;                         // never stuck: reveal anyway, the poster shows
    const tg=realTarget();
    if(tg>shown)shown=Math.min(tg,shown+(tg-shown)*(1-Math.pow(.93,dt/16.7))+(tg===1?.004:0));
    if(tg===1&&shown>.995)shown=1;
    paint();
    if(shown>=1&&el>=MIN){leave();return}
    frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return {
    holdsReveal:true,
    playing(){ready=true;if(released)reveal()},
    dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);clearInterval(msgT);clearTimeout(leaveT);
      if(!released){penRelease();penUnlock()}
      if(pen){pen.destroy();if(heroPen===pen)heroPen=null;pen=null}
      box.remove();
    }
  };
}
function homeLogo(placeholder,firstVisit,reveal){
  const hero=placeholder.closest('.vhero'),copy=hero.querySelector('.vhero-in');
  const header=document.getElementById('hdr'),small=header.querySelector('.brand img');
  let disposed=false,played=false,settling=false,frame=0,flight=null,morph=null,pen=null;
  let started=0,progress=0,skipOff=null;
  const SITE_AT=500;     // the site starts coming up this long after the pen starts drawing
  const DRAW=3200;       // the full drawing always plays, whatever is cached or already playing
  const size=()=>hero.style.setProperty('--cb-hero-copy',copy.offsetHeight+'px');
  size();const sizing=new ResizeObserver(size);heroSizing=sizing;
  // Measured once behind the ready gate; the observer only runs once the intro is over, so the pen never moves while it draws.
  const unlock=()=>{penUnlock();if(!disposed&&placeholder.isConnected)sizing.observe(copy)};
  small.classList.add('cb-brand-in-flight');   // one logo at a time: the header mark waits until the big one lands
  if(firstVisit&&!reduceMotion())placeholder.querySelector(':scope>img').hidden=true;   // no flash of the finished logo before the pen starts
  const finishFlight=()=>{
    if(flight)flight.remove();flight=null;
    small.classList.remove('cb-brand-in-flight');header.classList.remove('cb-logo-landing');
  };
  const dispose=()=>{
    disposed=true;if(skipOff)skipOff();cancelAnimationFrame(frame);sizing.disconnect();
    if(morph)morph.cancel();finishFlight();
    if(pen){pen.destroy();if(heroPen===pen)heroPen=null;pen=null;}
  };
  const fly=()=>{
    if(disposed||!placeholder.isConnected)return;
    sizing.disconnect();
    const art=placeholder.querySelector('.cb-art')||placeholder.querySelector(':scope>img');
    const from=art.getBoundingClientRect();
    header.classList.add('cb-logo-landing');
    const to=small.getBoundingClientRect();
    if(reduceMotion()||!Element.prototype.animate||from.width<1||from.height<1){reveal();placeholder.remove();dispose();return;}
    flight=document.createElement('div');flight.setAttribute('aria-hidden','true');flight.className='cb-logo-flight';
    flight.innerHTML=`<img src="img/pen-loader-1.png" alt="">`;
    Object.assign(flight.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
    document.body.appendChild(flight);
    // One visible mark: the large drawing becomes the small header mark at landing.
    small.classList.add('cb-brand-in-flight');placeholder.remove();
    reveal();   // the mark is on its way to the header: now the video comes in
    if(pen){pen.destroy();if(heroPen===pen)heroPen=null;pen=null;}
    morph=flight.animate([
      {transform:'translate(0,0) scale(1,1)'},
      {transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width},${to.height/from.height})`}
    ],{duration:700,easing:getComputedStyle(document.documentElement).getPropertyValue('--ease-io').trim(),fill:'forwards'});
    if(flight.querySelector('.pf-ink')){   // Paper: the beige mark turns into the dark logo on its way to the cream bar
      const [pale,ink]=flight.querySelectorAll('img');
      ink.animate([{opacity:0},{opacity:1}],{duration:700,easing:'ease-in-out',fill:'forwards'});
      pale.animate([{opacity:1},{opacity:0}],{duration:700,easing:'ease-in-out',fill:'forwards'});
    }
    morph.finished.then(()=>{if(!disposed){finishFlight();disposed=true;}},()=>{});
  };
  // before the flight the pulse is faded back to full opacity (200ms), so the mark is steady when its position is measured
  const calm=()=>new Promise(r=>{
    const art=placeholder.querySelector('.cb-art')||placeholder.querySelector(':scope>img');
    if(!art||!placeholder.classList.contains('cb-pulse')){placeholder.classList.remove('cb-pulse');r();return}
    const o=getComputedStyle(art).opacity;
    placeholder.classList.remove('cb-pulse');art.style.opacity=o;art.offsetWidth;
    art.style.transition='opacity .2s ease';art.style.opacity='1';
    setTimeout(()=>{art.style.transition='';art.style.opacity='';r()},220);
  });
  const settle=()=>{
    if(disposed||settling||!placeholder.isConnected)return;
    settling=true;if(skipOff)skipOff();   // with the pen the video is revealed by fly(), once the mark is moving
    cancelAnimationFrame(frame);
    if(!firstVisit){            // coming from another page: the waiting mark settles, then travels to the header like the first time
      calm().then(fly);
      return;
    }
    if(!pen){fly();return;}
    // Complete the remaining strokes on readiness, then preserve the mark while it travels.
    if(progress>=1){pen.finish();fly();return;}   // already fully drawn: no extra completion pass before the flight
    const from=progress,t0=performance.now();
    const complete=now=>{
      if(disposed)return;
      const p=Math.min(1,(now-t0)/240);
      progress=from+(1-from)*p;pen.seek(progress*pen.drawEnd);
      if(p<1)frame=requestAnimationFrame(complete);else{pen.finish();fly();}
    };
    frame=requestAnimationFrame(complete);
  };
  const ready=preGone.then(async()=>{
    if(disposed||!placeholder.isConnected)return;
    if(!firstVisit||reduceMotion()){unlock();if(played)settle();else{if(!reduceMotion())placeholder.classList.add('cb-pulse');/* Ready event ends the pulse; no timer uncovers an unready film. */}return;}   // from another page: the mark pulses softly until the video plays
    // One ready gate: fonts and pen images together (1.5s at most), then measure the headline once and start.
    const imgs=['img/pen-loader-1.png','img/pen-loader-3.png','img/pen-loader-4.png'].map(u=>new Promise(r=>{const i=new Image();i.onload=i.onerror=r;i.src=u}));
    await Promise.race([Promise.all([window.CB_FONTS||0,document.fonts&&document.fonts.ready,...imgs]),new Promise(r=>setTimeout(r,1500))]);
    if(disposed||!placeholder.isConnected)return;
    size();
    // Mount paused: no fixed-speed autoplay and no fully written fallback under the pen.
    pen=CBPenLoader.mount(placeholder,{manual:true,label:'Chaar Bhai. Film loading.'});heroPen=pen;
    placeholder.querySelector(':scope>img').hidden=true;
    await pen.ready;
    if(disposed)return;
    started=performance.now();
    // A tap, scroll attempt or key press skips to the end: the site arrives at once and the mark goes to the header.
    const skip=()=>{
      stopSkip();
      document.documentElement.classList.add('cb-pen-skip');
      unlock();
      if(!disposed&&played)settle();else placeholder.classList.add('cb-pulse');
    };
    const SKIP_EVENTS=['pointerdown','wheel','touchmove','keydown'];
    const stopSkip=()=>SKIP_EVENTS.forEach(ev=>removeEventListener(ev,skip));
    SKIP_EVENTS.forEach(ev=>addEventListener(ev,skip,{passive:true}));
    skipOff=stopSkip;
    // The mark never moves while it draws. After the full drawing it waits where it is (gently pulsing) until the video plays,
    // the complete native file must be ready before the mark lands.
    const draw=now=>{
      if(disposed||settling)return;
      const t=now-started;
      if(t>=SITE_AT)penRelease();
      const p=Math.min(1,t/DRAW),e=1-Math.pow(1-p,3);   // ease out: the strokes start quickly and settle
      progress=e;pen.seek(progress*pen.drawEnd);
      if(p<1){frame=requestAnimationFrame(draw);return}
      unlock();
      if(played){calm().then(settle);return}   // no animation frames from here: calm() then settle()
      placeholder.classList.add('cb-pulse');
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
  });
  return {
    dispose,
    holdsReveal:firstVisit&&!reduceMotion(),   // the mark itself decides when the video is revealed
    playing(){
      if(disposed||played)return;
      played=true;
      if(!(firstVisit&&!reduceMotion()))ready.then(()=>{if(!disposed)settle()});   // with the pen drawing, its own loop lands it once the hold is over
    }
  };
}
function reel(){
  if(heroController){heroController.dispose();heroController=null;}
  if(heroLogo){heroLogo.dispose();heroLogo=null;}
  const el=document.getElementById('reel');if(!el)return;
  const hero=el.closest('.vhero'),placeholder=hero.querySelector('.cb-hero-placeholder');
  const sound=hero.querySelector('.hero-sound'),playButton=hero.querySelector('.hero-play');
  const video=heroVideo;video.pause();video.muted=true;video.defaultMuted=true;
  el.replaceWith(video);
  preloadHero();
  let disposed=false,ready=false,landed=false,started=false,manualPlayback=false,manualStarting=false,userPaused=false,promptTimer=0,promptShown=false;
  const prompt=hero.querySelector('.hero-unmute-prompt');
  const listeners=[];
  const listen=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
  const updateSound=()=>{sound.innerHTML=HERO_SOUND_ICON(video.muted);sound.setAttribute('aria-pressed',String(!video.muted));sound.setAttribute('aria-label',video.muted?'Unmute background music':'Mute background music');};
  const mute=()=>{video.muted=true;updateSound();};
  const updatePlayback=()=>{playButton.innerHTML=HERO_PLAY_ICON(video.paused);playButton.setAttribute('aria-label',video.error?'Retry film':video.paused?'Play film':'Pause film');playButton.hidden=!manualPlayback;};
  const visible=()=>{const r=(PAPER?hero.querySelector('.vhero-media')||hero:hero).getBoundingClientRect();return document.visibilityState==='visible'&&r.bottom>0&&r.top<innerHeight;};
  const reveal=()=>{
    if(!started){started=true;hero.classList.add('is-reel-ready');hero.querySelector('.cb-video-cover')?.remove();sound.hidden=false;}
    if(!promptShown&&!video.paused&&video.muted){promptShown=true;prompt.hidden=false;promptTimer=setTimeout(()=>prompt.hidden=true,4500);}
  };
  const play=async()=>{
    if(disposed||!landed||!visible())return;
    try{await video.play();if(disposed||!visible()){video.pause();mute();return;}reveal();updatePlayback();}
    catch(e){if(!disposed){manualPlayback=true;reveal();updatePlayback();}}
  };
  const pause=()=>{video.pause();mute();};
  const sync=()=>{if(!visible())pause();else if(landed&&video.paused&&!userPaused){mute();if(!reduceMotion())play();}};
  // Safari may stop fetching a paused video before two seconds have buffered.
  // HAVE_FUTURE_DATA is its native signal that playback can begin progressively.
  const first=firstHeroVisit(),revealFilm=()=>{
    if(disposed||!ready)return;landed=true;mute();
    if(!video.paused){reveal();updatePlayback();}
    else if(reduceMotion()){manualPlayback=true;reveal();updatePlayback();}else play();
  };
  const logo=heroLogo=PAPER&&first&&document.documentElement.classList.contains('cb-pen-boot')?paperLoader(placeholder,video,revealFilm):homeLogo(placeholder,first,revealFilm);
  const prepare=()=>{
    if(disposed||ready||manualStarting||video.readyState<(reduceMotion()?1:3))return;
    ready=true;video.pause();video.currentTime=0;logo.playing();
  };
  listen(video,'loadedmetadata',prepare);listen(video,'canplay',prepare);listen(video,'progress',prepare);listen(video,'canplaythrough',prepare);listen(video,'loadeddata',prepare);
  listen(sound,'click',()=>{
    if(!landed||!visible())return;
    video.muted=!video.muted;
    if(!video.muted){prompt.hidden=true;clearTimeout(promptTimer);}
    updateSound();
    play();
  });
  listen(playButton,'click',()=>{
    if(!ready){
      if(manualStarting)return;
      manualPlayback=true;manualStarting=true;mute();
      // Preserve this user-initiated playback through the logo handoff. Pausing
      // and asking for autoplay again can lose the gesture grant in Low Power Mode.
      video.play().then(()=>{
        if(disposed)return;
        manualStarting=false;ready=true;logo.playing();
        if(!visible())pause();
      }).catch(()=>{
        if(disposed)return;
        manualStarting=false;ready=true;logo.playing();
      });
      return;
    }
    if(!video.paused&&!video.error){userPaused=true;pause();return;}
    userPaused=false;mute();
    if(video.error){heroDownload=null;preloadHero().then(play);}else play();
  });
  listen(video,'play',updatePlayback);listen(video,'pause',updatePlayback);
  listen(video,'playing',()=>{if(landed&&visible())reveal();});
  listen(window,'scroll',sync);listen(window,'resize',sync);
  listen(window,'hashchange',()=>{pause();});
  listen(document,'visibilitychange',sync);listen(window,'pagehide',pause);listen(window,'pageshow',sync);
  listen(video,'error',()=>{manualPlayback=true;ready=true;landed=true;logo.playing();reveal();pause();updatePlayback();});
  // Keep the film covered until a playable opening is buffered; the native player downloads ahead.
  const loadingHelp=setTimeout(()=>{if(!disposed&&!ready){manualPlayback=true;updatePlayback();}},10000);
  const poll=setInterval(prepare,200);prepare();
  heroController={dispose(){disposed=true;clearInterval(poll);clearTimeout(loadingHelp);clearTimeout(promptTimer);listeners.forEach(fn=>fn());pause();video.remove();}};
}

/* Studio Ninja's form, loaded once per visit. snLoad() runs as soon as the
   site has settled (or straight away when the visit starts on Contact), so
   by the time someone opens Contact it's usually already there. */
const page=document.getElementById('page'),snHost=document.getElementById('snhost');
let snFrame=null,snH=1363;
function snLoad(){
  if(snFrame)return;
  snFrame=document.createElement('iframe');
  snFrame.id='sn-form-kvczy';snFrame.title='Enquiry form';snFrame.src=SN_FORM;snFrame.allowFullscreen=true;
  snHost.appendChild(snFrame);
  const ready=()=>{snHost.classList.add('ready');document.body.classList.add('sn-ready')};
  setTimeout(ready,10000);                      // never leave it invisible if the resizer can't report
  const s=document.createElement('script');s.src=SN_RESIZER;s.async=true;
  // minHeight: its first report comes before the form has drawn, and says 0.
  // A frame that small gets frozen by the browser and never draws the form.
  s.onload=()=>{if(window.iFrameResize)iFrameResize({log:false,minHeight:320,onResized:e=>{
    const h=+e.height,prev=snH,parked=snHost.classList.contains('parked'),wasReady=snHost.classList.contains('ready');
    if(parked&&h<400)return;                    // hidden, it measures as empty: keep the last real height
    snH=h;
    if(h>400)ready();                           // the form has drawn, not just its empty page
    snPlace();
    // the thank-you is much shorter than the form: bring it into view
    if(wasReady&&!parked&&prev-h>300){          // not the form's first draw (it starts from a guessed height)
      const w=document.querySelector('.sn-wrap');if(w)w.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'});
    }
  }},snFrame)};
  document.head.appendChild(s);
}
/* lay the holder over the Contact page's slot, or park it out of sight */
function snPlace(){
  const slot=page.querySelector('.sn-slot');
  if(!slot){
    snHost.classList.add('parked');snHost.setAttribute('aria-hidden','true');snHost.inert=true;
    snHost.style.top=snHost.style.left=snHost.style.width='';return}
  slot.style.height=snH+'px';
  const m=main.getBoundingClientRect(),r=slot.getBoundingClientRect();
  snHost.style.top=(r.top-m.top)+'px';snHost.style.left=(r.left-m.left)+'px';snHost.style.width=r.width+'px';
  if(snHost.classList.contains('parked')&&snFrame){
    // hidden, the resizer shrank it to nothing: restore the last real height
    // at once, then have it measure again
    snFrame.style.height=snH+'px';
    if(snFrame.iFrameResizer)snFrame.iFrameResizer.resize();
  }
  snHost.classList.remove('parked');snHost.removeAttribute('aria-hidden');snHost.inert=false;
}
new ResizeObserver(()=>snPlace()).observe(page);
{
  // Phones skip the head start: the hidden form is a whole second web page, and on an iPhone it runs on the same
  // thread as the site, so while it loads, scrolling (and the header coming back) stalls for a third of a second at a
  // time. On a phone it loads when Contact is opened instead (letterForm).
  const start=()=>{if(smallScreen())return;
    preGone.then(()=>window.requestIdleCallback?requestIdleCallback(snLoad,{timeout:2000}):setTimeout(snLoad,500))};
  if(document.readyState==='complete')start();else addEventListener('load',start);
}
function letterForm(){
  if(page.querySelector('.sn-slot'))snLoad();
  snPlace();
  const cp=document.getElementById('sn-copy');
  if(cp)cp.addEventListener('click',async()=>{
    const t=`We’ve been looking at ${EST}.`;
    try{await navigator.clipboard.writeText(t);cp.textContent='Copied. Paste it into your message'}
    catch(e){const r=document.createRange();r.selectNodeContents(document.getElementById('sn-est-text'));
      const sel=getSelection();sel.removeAllRanges();sel.addRange(r);cp.textContent='Selected. Copy and paste it'}
    track('copy_estimate');
  });
}

const TITLES={'/':'Chaar Bhai · Wedding Photography and Film','/portfolio':'Work · Chaar Bhai',
  '/about':'About · Chaar Bhai','/services':'Prices · Chaar Bhai','/testimonials':'Reviews · Chaar Bhai','/contact':'Contact · Chaar Bhai'};
/* a chapter picked on Home: Work opens scrolled to it (set by data-then) */
let jumpAfter=null;
function render(path){
  clearTimeout(navIdle);
  if(window.cbLog)cbLog('render '+path);
  if(PAPER)setMenu(false); // Release menu isolation before moving the header or replacing the page.
  VF.close();
  PS.unmount(); // Restore the Photos-owned header before replacing its DOM.
  if(PAPER)document.body.insertBefore(document.getElementById('hdr'),main);   // Paper: the bar goes back to the top before the page is swapped
  page.innerHTML=(P[path]||P['/'])();
  if(PAPER&&path==='/'){const m=document.querySelector('.vhero-media');if(m)m.after(document.getElementById('hdr'));paperRails();paperWritePaint()}   // Paper Home: the bar sits right under the film and sticks (CSS)
  document.querySelectorAll('nav.links a[data-nav]').forEach(a=>{
    const cur=a.getAttribute('href')==='#'+path;
    a.classList.toggle('on',cur&&!a.classList.contains('book'));
    if(cur)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  document.title=TITLES[path]||TITLES['/'];
  const gp=GA_PATH[path]||'/';
  track('page_view',{page_title:document.title,page_location:location.origin+gp,page_path:gp});
  scrollTo({top:0,behavior:'instant'});
  const sub=document.getElementById('hdrsub');
  document.documentElement.classList.toggle('on-work',path==='/portfolio');
  document.documentElement.classList.toggle('on-contact',path==='/contact');
  document.documentElement.classList.toggle('on-home',path==='/');
  document.documentElement.classList.toggle('on-about',path==='/about');
  document.documentElement.classList.toggle('on-services',path==='/services');
  document.documentElement.classList.toggle('on-reviews',path==='/testimonials');
  document.documentElement.classList.toggle('paper-light-nav',path==='/about'||path==='/testimonials');
  document.documentElement.classList.toggle('paper-dark',document.documentElement.dataset.theme==='paper'&&sessionStorage.getItem('cb-paper-dark')==='1'&&path!=='/'&&path!=='/contact');
  syncThemeUI();
  if(path==='/portfolio'){sub.innerHTML=VF.toggleHTML('photos');sub.hidden=false}else{sub.hidden=true;sub.textContent=''}
  document.getElementById('hdr').classList.remove('hide');heroNav();
  observe();photoWindow();
  if(path==='/portfolio'){PS.mount(photoChapter()||(jumpAfter&&jumpAfter.replace(/^ch-/,'')));VF.syncUL()}else PS.unmount();
  jumpAfter=null;
  letterForm();pricing();reel();homeScenes();tallyQueue();
  paintLogos();labelFills();
  if(path==='/portfolio')workSync();
  preGone.then(()=>requestAnimationFrame(()=>document.querySelectorAll('.hero .rv,.hero .rv-l,.hero .rv-img,.hero-arch,section:first-of-type .rv,section:first-of-type .rv-l')
    .forEach(reveal)));
}

/* Directional page transition. ORDER is the nav bar's left-to-right order.
   The old page just fades out; the new one slides in from the right when the
   destination sits further right in the nav, and from the left otherwise, so
   the motion always agrees with where the page lives.
   afterTransition resolves once #main's opacity transition genuinely finishes
   (falling back to a timeout only if transitionend never fires, e.g. a
   backgrounded tab) instead of a guessed setTimeout. */
/* Work's own loading screen: the same logo build as the first visit, with a line of copy under it that changes
   while the first screen of photos comes in. Shown each time Work is opened from another page (not on the very first
   visit, which already has the preloader). It stays only until the chapter covers and the photos in the first rows
   have loaded (never more than 6s), so with the files cached it is barely seen. A new line every 1.8s while it waits. */
/* Contact gets the same screen when its enquiry form isn't ready yet (on a phone the form only starts loading when
   Contact opens). It stays until the form has drawn, never more than 8s. */
const CT_LINES=['Getting the form ready for you.','Have your date and venue handy.','Almost there. Tell us about your wedding in a second.'];
const WK_LINES=['Nearly a thousand photos in here. Give us a second.','These are full quality files, not thumbnails.',
  'Pulling up every couple, from the first portrait to the goodbye.','Almost there. Worth the wait, promise.'];
let preDone=false;preGone.then(()=>{preDone=true});
const wkLoader=(()=>{
  let el=null,fill,track,msg,rot=0,job=0;
  const make=()=>{
    el=document.createElement('div');el.id='wkpre';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML=`<div class="wrap"><div class="logo-build"><img class="ghost" src="${LOGO}" alt=""><img class="fill" src="${LOGO}" alt=""></div>
      <div class="track"><i></i></div><p class="wk-msg"></p></div>`;
    document.body.appendChild(el);
    fill=el.querySelector('.fill');track=el.querySelector('.track i');msg=el.querySelector('.wk-msg');
  };
  const paint=p=>{fill.style.clipPath=`inset(${(1-p)*100}% 0 0 0)`;track.style.transform=`scaleX(${p})`};
  let lines=WK_LINES;
  const say=i=>{msg.classList.add('out');setTimeout(()=>{msg.textContent=lines[i%lines.length];msg.classList.remove('out')},reduceMotion()?0:250)};
  return {
    start(set=WK_LINES){
      if(!preDone)return false;
      if(!el)make();
      lines=set;const my=++job;clearInterval(rot);paint(0);msg.textContent=lines[0];msg.classList.remove('out');
      el.classList.add('on');
      let i=0;rot=setInterval(()=>{if(my===job)say(++i)},1800);
      return true;
    },
    stop(){if(el&&el.classList.contains('on')){job++;clearInterval(rot);el.classList.remove('on')}},
    /* Contact: no real progress to show, so the bar eases toward 90% until the form reports it has drawn */
    waitForm(){
      if(!el||!el.classList.contains('on'))return;
      const my=job,t0=performance.now();
      const tick=()=>{
        if(my!==job)return;
        if(document.body.classList.contains('sn-ready')||performance.now()-t0>8000){
          job++;clearInterval(rot);paint(1);setTimeout(()=>el.classList.remove('on'),120);return}
        paint(.9*(1-Math.exp(-(performance.now()-t0)/1500)));requestAnimationFrame(tick);
      };
      tick();
    },
    /* call after Work has rendered: waits two frames so the first rows have been handed their photos */
    wait(){
      if(!el||!el.classList.contains('on'))return;
      const my=job;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(my!==job)return;
        const ims=[...document.querySelectorAll('.irow .thumb img, #wk-photos .fr-img img[data-on="1"], .vf-slide.is-active .vf-thumb[src]')];
        let done=0;const total=Math.max(1,ims.length);
        const finish=()=>{if(my!==job)return;job++;
          clearInterval(rot);paint(1);setTimeout(()=>el.classList.remove('on'),120)};
        const one=()=>{done++;paint(Math.min(1,done/total));if(done>=total)finish()};
        if(!ims.length){finish();return}
        ims.forEach(im=>{if(im.complete&&im.naturalWidth>1)one();else{im.addEventListener('load',one,{once:true});im.addEventListener('error',one,{once:true})}});
        setTimeout(()=>{if(my===job)finish()},6000);
      }));
    }
  };
})();
const ORDER=['/','/portfolio','/about','/services','/testimonials','/contact'];
let routing=false,pendingPath=null,currentPath=null,hidden=false,wake=null;
function afterTransition(el,fallbackMs){
  return new Promise(resolve=>{
    let done=false;
    const finish=()=>{if(done)return;done=true;el.removeEventListener('transitionend',onEnd);resolve()};
    const onEnd=e=>{if(e.target===el&&e.propertyName==='opacity')finish()};
    el.addEventListener('transitionend',onEnd);
    setTimeout(finish,fallbackMs);
  });
}
/* A click during a page's enter cuts it short (the leave transition picks up
   from wherever opacity is), and a click during a leave skips rendering the
   page that was abandoned: #main just stays hidden and moves on. */
async function go(){
  pendingPath=routeOf(location.hash);
  if(routing){if(wake)wake();return}
  routing=true;
  while(pendingPath!==currentPath){
    const target=pendingPath;
    const goingRight=ORDER.indexOf(target)>=ORDER.indexOf(currentPath);
    if(target==='/portfolio'&&currentPath!==null)wkLoader.start();
    else if(target==='/contact'&&!document.body.classList.contains('sn-ready'))wkLoader.start(CT_LINES);
    else wkLoader.stop();
    if(currentPath!==null&&!hidden){
      main.classList.add(goingRight?'leave-l':'leave-r');
      await afterTransition(main,300);
      hidden=true;
    }
    if(pendingPath!==target)continue;
    main.classList.remove('leave-l','leave-r');
    hidden=false;
    const navigated=currentPath!==null;
    render(target);
    currentPath=target;
    if(target==='/portfolio')wkLoader.wait();else if(target==='/contact')wkLoader.waitForm();
    if(navigated){                              // after an in-site link, put focus on the new page's heading
      const h=main.querySelector('h1'); if(h){h.tabIndex=-1;h.focus({preventScroll:true})}
    }
    // Work on a phone just fades in: sliding it would make Safari paint the whole 70,000px page as one moving layer
    main.classList.add(target==='/portfolio'&&smallScreen()?'enter-f':goingRight?'enter-r':'enter-l');
    main.offsetHeight;                          // forces style, so the off-screen start is committed before it's removed
    main.classList.remove('enter-l','enter-r','enter-f');
    await Promise.race([afterTransition(main,500),new Promise(r=>wake=r)]);
    wake=null;
  }
  if(hidden){                                   // navigated back to the page that was leaving
    main.classList.remove('leave-l','leave-r');
    hidden=false;
  }
  routing=false;
}
/* Work has two views on one page: #/portfolio (Photos) and #/portfolio/films[/ID] (Films).
   Old #/portfolio/videos links still work: they are rewritten to films.
   routeOf gives the page a hash belongs to, so switching view doesn't redraw or animate the page. */
function routeOf(h){const p=(h||'#/').slice(1);return p==='/portfolio'||p.indexOf('/portfolio/')===0?'/portfolio':p}
function photoChapter(){
  const m=/^#\/portfolio\/photos\/([\w-]+)\/?$/.exec(location.hash);
  return m&&CHAPTERS.some(c=>c.id===m[1])?m[1]:null;
}
function workSync(){
  const m=/^\/portfolio\/(?:films|videos)(?:\/([\w-]+))?\/?$/.exec(location.hash.slice(1));
  if(!m){VF.close({focus:true});const chapter=photoChapter();if(chapter)PS.go(chapter,true);else PS.restore();return}
  PS.suspend(); // Release Photos before the asynchronous Films handoff.
  preGone.then(()=>{                              // not behind the loading screen
    const m2=/^\/portfolio\/(?:films|videos)(?:\/([\w-]+))?\/?$/.exec(location.hash.slice(1));
    if(m2)VF.open(m2[1]);
  });
}
/* a link like ?view=films&v=ID (or the older ?view=videos) opens the same place */
(function(){
  const q=new URLSearchParams(location.search);
  if(!/^(films|videos)$/.test(q.get('view')||'')||routeOf(location.hash)==='/portfolio')return;
  const v=q.get('v');q.delete('view');q.delete('v');const rest=q.toString();
  try{history.replaceState(null,'',location.pathname+(rest?'?'+rest:'')+'#/portfolio/films'+(v&&/^[\w-]{6,20}$/.test(v)?'/'+v:''))}catch(e){}
})();
addEventListener('hashchange',go);
addEventListener('hashchange',()=>{
  if(routeOf(location.hash)!=='/portfolio')VF.pauseAll();          // leaving Work: silence it now, the page swap follows
  else if(currentPath==='/portfolio')workSync();
});
document.addEventListener('click',e=>{
  const nt=e.target.closest('[data-nav-to]');
  if(nt){jumpAfter=nt.dataset.then||null;location.hash=nt.dataset.navTo;return}
  if(!e.target.closest('a[data-nav]'))return;
  setMenu(false);
});

const burger=document.getElementById('burger'),navlinks=document.getElementById('navlinks');
/* Paper Home nests the header in main. Isolate sibling branches, never an
   ancestor of the menu; retain existing inert state when the overlay closes. */
let paperMenuInert=[];
function paperMenuIsolation(open){
  paperMenuInert.forEach(([el,inert])=>{el.inert=inert});paperMenuInert=[];
  if(!open)return;
  let branch=document.getElementById('hdr');
  while(branch&&branch!==document.body){
    [...branch.parentElement.children].forEach(el=>{
      if(el!==branch&&!/^(SCRIPT|STYLE|LINK)$/.test(el.tagName)){
        paperMenuInert.push([el,el.inert]);el.inert=true;
      }
    });
    branch=branch.parentElement;
  }
}
const setMenu=o=>{navlinks.classList.toggle('open',o);burger.classList.toggle('x',o);
  burger.setAttribute('aria-expanded',o);document.body.classList.toggle('locked',o);
  if(document.documentElement.dataset.theme==='paper'){   // Paper: the overlay is a modal, the page behind is inert
    paperMenuIsolation(o);
    if(o){const f=navlinks.querySelector('a:not(.book)');if(f)f.focus({preventScroll:true})}
  }};
burger.addEventListener('click',()=>setMenu(!navlinks.classList.contains('open')));
addEventListener('keydown',e=>{if(e.key==='Escape'&&navlinks.classList.contains('open')){setMenu(false);burger.focus()}});
if(document.documentElement.dataset.theme==='paper'){
  burger.setAttribute('aria-label','Navigation');navlinks.setAttribute('role','dialog');navlinks.setAttribute('aria-modal','true');navlinks.setAttribute('aria-label','Navigation');
  /* focus stays inside the overlay: the links, then the Close control */
  addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!navlinks.classList.contains('open'))return;
    const visibleLinks=[...navlinks.querySelectorAll('a:not(.book)')];
    if(document.documentElement.classList.contains('on-work'))visibleLinks.push(navlinks.querySelector('a.book'));
    const f=[...visibleLinks.filter(Boolean),burger],i=f.indexOf(document.activeElement);
    e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();
  });
  /* one photo per link, cross-faded when a link is hovered or focused (desktop) */
  const NP={'#/':'home','#/portfolio':'work','#/about':'about','#/services':'services','#/testimonials':'reviews'};
  const ph=document.createElement('div');ph.className='nav-ph';ph.setAttribute('aria-hidden','true');
  const links=[...navlinks.querySelectorAll('a:not(.book)')];
  ph.innerHTML=links.map((a,i)=>{const k=NP[a.getAttribute('href')],f=(PICKS.nav||{})[k];return f?`<span class="${i?'':'on'}">${pic(f,'40vw')}</span>`:'<span></span>'}).join('');
  navlinks.prepend(ph);
  const show=a=>{const i=links.indexOf(a);ph.querySelectorAll('span').forEach((sp,j)=>sp.classList.toggle('on',j===i))};
  links.forEach(a=>{a.addEventListener('mouseenter',()=>show(a));a.addEventListener('focus',()=>show(a))});
}
document.getElementById('skip').addEventListener('click',()=>{
  const h=main.querySelector('h1'); if(h){h.tabIndex=-1;h.focus()}});

/* Home, light mode: the bar stays clear over the hero (like dark mode) and turns navy only once the hero is scrolled past */
/* Home tally mosaic: n different frames dealt round-robin across the couples so no two neighbours come from the same wedding,
   none repeating a photo Home already shows. The middle tile is PICKS.tally: it opens as a complete photograph fitted to the screen. */
function mosaicTiles(n){
  const mid={...PICKS.tally};
  const used=new Set([PICKS.hero,PICKS.stay,PICKS.back,mid,...Object.values(PICKS.covers),...(PAPER?[...Object.values(PICKS.paperCovers),...Object.values(PICKS.nav),...PICKS.stayOut]:[])].map(f=>f.src));
  const byCouple=new Map();
  Object.keys(PORTFOLIO).forEach(id=>(PORTFOLIO[id]||[]).forEach(ev=>ev.frames.forEach(f=>{
    if(used.has(f.src))return;
    if(!byCouple.has(ev.couple))byCouple.set(ev.couple,[]);
    byCouple.get(ev.couple).push(f);
  })));
  const queues=[...byCouple.values()].map(fr=>{
    const step=Math.max(1,Math.floor(fr.length/Math.ceil(n/byCouple.size)));
    return fr.filter((_,i)=>i%step===0);
  });
  const picks=[];
  for(;picks.length<n-1&&queues.some(q=>q.length);)
    queues.forEach(q=>{if(picks.length<n-1&&q.length)picks.push(q.shift())});
  picks.splice(Math.floor(n/2),0,mid);
  return picks;
}
/* The mosaic starts scaled so the complete centre photograph fits the screen, scrubs out to the whole wall, then dims under the caption.
   The section is tall and its content sticks (CSS); scroll position drives it directly, no library, no number counts up. */
let tallyRaf=0;
function tallyScene(){
  tallyRaf=0;
  const sec=document.querySelector('.tally-live');if(!sec)return;
  const mosaic=sec.querySelector('.mosaic'),cap=sec.querySelector('.tally-cap');if(!mosaic)return;
  const expected=innerWidth<=900?35:45;
  if(mosaic.children.length!==expected){
    const tiles=mosaicTiles(expected),centre=Math.floor(tiles.length/2);
    mosaic.innerHTML=tiles.map((f,i)=>`<div class="mo-t${i===centre?' mo-mid':''}">${pic(f,i===centre?'100vw':'12vw',{alt:i===centre?f.alt:'',eager:i===centre})}</div>`).join('');
    delete sec.dataset.warm;
  }
  const mid=mosaic.querySelector('.mo-mid');if(!mid)return;
  const vh=sec.querySelector('.tally-pin').clientHeight,r=sec.getBoundingClientRect();
  if(r.top<vh*3&&!sec.dataset.warm){sec.dataset.warm=1;mosaic.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager')}   // the wall is clipped out of view until the zoom-out, so fetch it early
  if(r.bottom<-vh||r.top>vh*2)return;                       // far away: nothing to move
  const count=mosaic.children.length,desk=count===45,cols=desk?9:5,rows=desk?5:7;
  const idx=[...mosaic.children].indexOf(mid),col=idx%cols,row=Math.floor(idx/cols);
  // Fit the complete central photograph inside the opening on every screen.
  // Its tile and the viewport have different aspect ratios; cover/scale-by-columns crops faces.
  const image=mid.querySelector('img'),ar=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:Number(image.getAttribute('width'))/Number(image.getAttribute('height'));
  const photoW=Math.min(mid.clientWidth,mid.clientHeight*ar),photoH=photoW/ar;
  const pin=sec.querySelector('.tally-pin');
  const from=PAPER?Math.max(1,pin.clientWidth/mid.clientWidth,vh/mid.clientHeight):Math.max(1,Math.min(pin.clientWidth*.92/photoW,vh*.86/photoH));   // Paper: the centre tile is an ordinary tile, scaled until it covers the screen
  const p=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-vh)));
  const seg=(a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a)));
  const e=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;               // power2.inOut
  const z=e(seg(0,.62)),s=Math.exp(Math.log(from)*(1-z));
  mosaic.style.transformOrigin=`${(col+.5)/cols*100}% ${(row+.5)/rows*100}%`;
  // Paper: lower the zoomed photo so the couple's heads stay in frame (the middle of a tall tile would crop them)
  const lower=PAPER?Math.max(0,mid.clientHeight*from-vh)*.3*(1-z):0;
  mosaic.style.transform=`translateY(${lower.toFixed(1)}px) scale(${s.toFixed(4)})`;
  // Keep the central photograph fitted throughout; changing its crop during zoom caused a visible lurch.

  mosaic.style.setProperty('--mo-photo-scale','1');
  const dim=seg(.66,.96);
  mosaic.style.setProperty('--mo-dim',(1-.8*dim).toFixed(3));
  mosaic.style.setProperty('--mo-neighbours',(Math.min(1,z*4)*(1-.8*dim)).toFixed(3));
  mosaic.style.setProperty('--mo-mid',(1-.65*dim).toFixed(3));
  const c=seg(.7,1);cap.style.opacity=c.toFixed(3);sec.style.setProperty('--cap-o',c.toFixed(3));cap.style.transform=`translateY(${(40*(1-c)).toFixed(1)}px)`;
}
const tallyQueue=()=>{if(!tallyRaf)tallyRaf=requestAnimationFrame(tallyScene)};
addEventListener('scroll',tallyQueue,{passive:true});addEventListener('resize',tallyQueue,{passive:true});

/* Paper, desktop: keep page wheel easing, with one interruptible destination per Home chapter.
   Touch, keyboard and reduced motion keep the browser's own scrolling. */
function paperSmooth(){
  const R=document.documentElement;
  const capability=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  /* One place to tune Paper's scroll feel (see design/home-scroll-plan.md). */
  const CFG={wheel:1,glide:100,notch:40,cardMs:360,gesture:220,trackpadHold:250};
  let target=scrollY,cur=scrollY,raf=0,last=0,expected=null,cardMove=null,vel=0,padUntil=0;
  const max=()=>Math.max(0,R.scrollHeight-innerHeight);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const own=el=>{for(;el&&el!==document.body&&el!==R;el=el.parentElement){const o=getComputedStyle(el).overflowY;if((o==='auto'||o==='scroll')&&el.scrollHeight>el.clientHeight+1)return true;if(el.tagName==='IFRAME'||el.tagName==='TEXTAREA')return true}return false};
  const off=()=>document.body.classList.contains('locked')||R.classList.contains('ps-viewing')||R.classList.contains('lb-open')||document.body.classList.contains('vf-in')||document.body.classList.contains('vf-full')||document.getElementById('navlinks').classList.contains('open');
  const step=now=>{
    raf=0;const dt=Math.min(64,now-last||16);last=now;
    if(off()){target=cur=scrollY;cardMove=null;vel=0;expected=null;return}
    if(expected!==null&&Math.abs(scrollY-expected)>3){target=cur=scrollY;cardMove=null;vel=0;expected=null;return}
    if(cardMove){
      /* Critically damped spring: no bounce, and a new target keeps the current
         position and velocity instead of restarting. Settles in about cardMs. */
      const w=6.6/(CFG.cardMs/1000),h=dt/1000,x=cur-cardMove.to;
      const a=-w*w*x-2*w*vel;vel+=a*h;cur+=vel*h;
      const done=Math.abs(cur-cardMove.to)<.5&&Math.abs(vel)<8;
      if(done)cur=cardMove.to;
      scrollTo(0,cur);expected=scrollY;
      if(done){target=cardMove.to;cardMove=null;vel=0;expected=null}
    }else{
      cur+=(target-cur)*(1-Math.exp(-dt/CFG.glide));if(Math.abs(target-cur)<.4)cur=target;
      scrollTo(0,cur);expected=scrollY;if(cur===target)expected=null;
    }
    if(cardMove||cur!==target)raf=requestAnimationFrame(step);
  };
  const go=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(step)}};
  let wheelBurst={direction:0,peak:0,last:0,lastAt:0,decayed:false},wheelAt=0;
  const freshBurst=(direction,magnitude,time)=>{
    const begin=()=>{wheelBurst={direction,peak:magnitude,last:magnitude,lastAt:time,decayed:false};return true};
    const gap=time-wheelBurst.lastAt;
    /* A long trackpad tail can span more than one frame on a large viewport.
       Keep it in the same gesture window so one physical swipe cannot skip
       several chapters; a clear pause still starts a fresh gesture. */
    if(direction!==wheelBurst.direction||gap>CFG.gesture&&magnitude>=wheelBurst.peak*.42)return begin();
    if(magnitude<wheelBurst.peak*.42)wheelBurst.decayed=true;
    const renewed=wheelBurst.decayed&&magnitude>=Math.max(wheelBurst.last*1.4,wheelBurst.peak*.35);
    wheelBurst.peak=Math.max(wheelBurst.peak,magnitude);wheelBurst.last=magnitude;wheelBurst.lastAt=time;
    return renewed?begin():false;
  };
  const moveCard=(pc,fromIndex,toIndex,direction)=>{
    const top=pc.getBoundingClientRect().top+scrollY,to=clamp(top+toIndex*innerHeight,0,max());
    if(!cardMove){cur=scrollY;vel=0}
    cardMove={to,fromIndex,toIndex,direction};target=to;
    go();
  };
  addEventListener('wheel',e=>{
    if(!capability.matches){if(raf){cancelAnimationFrame(raf);raf=0;cardMove=null;vel=0;expected=null;cur=target=scrollY}return}
    if(e.ctrlKey||e.defaultPrevented||off()||Math.abs(e.deltaX)>Math.abs(e.deltaY)||own(e.target))return;
    const raw=e.deltaMode===1?e.deltaY*16:e.deltaMode===2?e.deltaY*innerHeight:e.deltaY;
    /* Wheel event cadence varies with display refresh rate. Normalize small,
       high-cadence ticks toward a 60Hz-equivalent impulse, with a cap so a
       240Hz panel cannot make a gesture unexpectedly explosive. */
    const stamp=e.timeStamp||performance.now(),gap=wheelAt?stamp-wheelAt:16.7;wheelAt=stamp;
    const cadence=clamp(16.7/Math.max(4,gap),.75,2.5),d=raw*cadence;
    const dir=Math.sign(d),magnitude=Math.abs(d);if(!dir)return;
    /* Trackpads and Magic Mice send a stream of small deltas: that is the
       device's own momentum, so outside the chapter cards it stays native. */
    const notch=e.deltaMode!==0||Math.abs(raw)>=CFG.notch&&stamp>padUntil;
    if(!notch)padUntil=stamp+CFG.trackpadHold;
    const pc=document.querySelector('.pcards');
    if(pc){
      const n=pc.querySelectorAll('.pcard').length,top=pc.getBoundingClientRect().top+scrollY,y=(scrollY-top)/innerHeight;
      if(y>=-.02&&y<=n-1+.02){
        if(!freshBurst(dir,magnitude,stamp)){e.preventDefault();return}
        const current=clamp(Math.round(y),0,n-1),source=cardMove?cardMove.toIndex:current;
        const destination=cardMove&&dir!==cardMove.direction?cardMove.fromIndex:source+dir;
        if(destination>=0&&destination<n){e.preventDefault();moveCard(pc,source,destination,dir);return}
      }
    }
    wheelBurst.direction=0;
    if(!notch){if(raf){cancelAnimationFrame(raf);raf=0;cardMove=null;vel=0;expected=null}target=cur=scrollY;return}
    e.preventDefault();
    cardMove=null;vel=0;if(!raf)target=cur=scrollY;
    target=clamp(target+raw*CFG.wheel,0,max());go();
  },{passive:false});
  addEventListener('click',e=>{
    const link=e.target.closest?.('[data-paper-chapter]');if(!link)return;
    const pc=link.closest('.pcards');if(!pc)return;
    e.preventDefault();const i=Number(link.dataset.paperChapter),cards=[...pc.querySelectorAll('.pcard')],card=cards[i];if(!card)return;
    wheelBurst.direction=0;
    if(capability.matches){const y=(scrollY-(pc.getBoundingClientRect().top+scrollY))/innerHeight,from=cardMove?cardMove.toIndex:clamp(Math.round(y),0,cards.length-1);moveCard(pc,from,i,Math.sign(i-from)||1)}
    else {card.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'});homeSceneQueue()}
  });
  addEventListener('scroll',()=>{if(!raf&&expected===null){target=cur=scrollY}},{passive:true});
  document.addEventListener('scroll',e=>{if(e.target?.closest?.('.pcards-track'))homeSceneQueue()},true);
  const mediaChanged=()=>{if(!capability.matches){if(raf)cancelAnimationFrame(raf);raf=0;cardMove=null;vel=0;expected=null;cur=target=scrollY;document.querySelector('.pcards-track')?.style.removeProperty('transform')}homeSceneQueue()};
  if(capability.addEventListener)capability.addEventListener('change',mediaChanged);else capability.addListener(mediaChanged);
}
if(PAPER)paperSmooth();

function heroNav(){
  const h=document.getElementById('hdr'),hero=document.querySelector('.vhero');
  h.classList.toggle('over-hero',!!hero&&hero.getBoundingClientRect().bottom>h.offsetHeight);
}
addEventListener('resize',heroNav,{passive:true});
let ly=0,navIdle=0;
addEventListener('scroll',()=>{const y=scrollY,h=document.getElementById('hdr');
  h.classList.toggle('solid',y>36);heroNav();
  document.documentElement.classList.toggle('paper-scrolled',y>8);
  clearTimeout(navIdle);
  const canHide=()=>scrollY>8&&!(document.documentElement.dataset.theme==='paper'&&document.documentElement.classList.contains('on-home')&&scrollY<innerHeight)&&!navlinks.classList.contains('open')&&!document.body.classList.contains('vf-in')&&!document.documentElement.classList.contains('cb-pen-hold');
  if(Math.abs(y-ly)>=8){
    h.classList.toggle('hide',y>ly&&canHide());ly=y;
  }
  if(y<=8)h.classList.remove('hide');
  else navIdle=setTimeout(()=>{if(canHide())h.classList.add('hide')},1200);
},{passive:true});

/* ================= PRELOADER =================
   Waits for the logo and fonts.
   The logo draws in proportion to real progress. Never hangs:
   errors count as done and a hard timeout releases the page.       */
(function(){
  const pre=document.getElementById('pre'),
        track=document.getElementById('ptrack'),
        fill=document.getElementById('lfill');
  fill.src=LOGO;

  if(document.documentElement.classList.contains('cb-pen-boot')){   // experiment: first visit on Home, no loading screen
    try{sessionStorage.setItem('cb-loaded','1')}catch(e){}
    pre.setAttribute('aria-busy','false');pre.classList.add('gone');
    go();                                      // the page is built behind the pen, invisible until penRelease()
    preGoneResolve();                          // the pen starts drawing at once, alone on the dark screen
    setTimeout(penUnlock,12000);               // fallback if the pen never starts
    return;
  }

  if(document.documentElement.classList.contains('seen')){   // already played in this tab
    document.body.classList.remove('locked');
    go();
    preGoneResolve();
    return;
  }

  const TOTAL=2;                     // the logo, plus the webfonts; the rest load as they come into view
  let done=0, real=0, shown=0, finished=false;
  const t0=performance.now();
  let last=t0;
  const MIN_MS=600, MAX_MS=12000;    // let the mark draw, but never trap anyone

  const tick=()=>{ done++; real=Math.min(done/TOTAL,1); };

  {
    const im=new Image();
    im.onload=tick;im.onerror=tick;im.src=LOGO;
  }

  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(tick,tick);

  function paint(p){
    // the logo fills in from the bottom as the site loads
    fill.style.clipPath=`inset(${(1-p)*100}% 0 0 0)`;
    track.style.transform=`scaleX(${p})`;
  }

  (function frame(){
    const now=performance.now(), elapsed=now-t0, dt=now-last; last=now;
    if(elapsed>MAX_MS) real=1;                 // safety release
    shown+=(real-shown)*(1-Math.pow(.91,dt/16.7)); // ease toward the true figure, same speed at any refresh rate
    if(real>=1&&shown>0.995) shown=1;
    paint(shown);
    if(!finished&&shown>=1&&elapsed>MIN_MS){
      finished=true;
      try{sessionStorage.setItem('cb-loaded','1')}catch(e){}
      pre.setAttribute('aria-busy','false');
      pre.classList.add('gone');
      document.body.classList.remove('locked');
      go();
      afterTransition(pre,600).then(preGoneResolve);
      return;
    }
    requestAnimationFrame(frame);
  })();
})();

/* Experimental Home chapters and reading highlight, using native sticky scroll. */

function homeScenes(){
  const plan=document.querySelector('.plan');
  if(plan&&!plan.dataset.words){
    plan.dataset.words='1';
    plan.querySelectorAll('p.lead').forEach(p=>{
      p.classList.remove('rv');p.innerHTML=p.textContent.split(/(\s+)/).map(w=>/^\s+$/.test(w)?w:`<span class="plan-word">${esc(w)}</span>`).join('');
    });
  }
  const day=document.querySelector('.day');
  if(day&&!day.dataset.links){
    day.dataset.links='1';
    day.querySelectorAll('[data-day-link]').forEach(link=>link.addEventListener('click',e=>{
      e.preventDefault();
      const panel=document.getElementById('recent-'+link.dataset.dayLink);if(!panel)return;
      const desktop=innerWidth>900&&!reduceMotion(),track=day.querySelector('.day-track');
      const top=desktop
        ?scrollY+day.getBoundingClientRect().top+(panel.offsetLeft-track.offsetLeft)
        :scrollY+panel.getBoundingClientRect().top-document.getElementById('hdr').offsetHeight-day.querySelector('.day-sky').offsetHeight-16;
      scrollTo({top,behavior:reduceMotion()?'instant':'smooth'});
    }));
  }
  if(day&&!day.dataset.focus){day.dataset.focus='1';day.querySelectorAll('.day-panel').forEach(panel=>panel.addEventListener('focusin',()=>{
    if(innerWidth<=900||reduceMotion())return;
    const track=day.querySelector('.day-track');
    scrollTo({top:scrollY+day.getBoundingClientRect().top+(panel.offsetLeft-track.offsetLeft),behavior:'instant'});
  }));}
  homeSceneQueue();
}
/* Guided stops: invisible snap markers inside a pinned section (offsets in px from its top), and html.snap-g (mandatory y snapping)
   switched on only while that section's stage fills the screen (scroll within [from,to] px of its top). One flick = one stop. */
const GUIDE={};
function guidedStops(el,key,offsets,from,to){
  let m=[...el.querySelectorAll(':scope>.gs-stop')];
  if(m.length!==offsets.length){m.forEach(n=>n.remove());m=offsets.map(()=>{const n=document.createElement('i');n.className='gs-stop';n.setAttribute('aria-hidden','true');el.appendChild(n);return n;});}
  m.forEach((n,i)=>n.style.top=`${Math.round(offsets[i])}px`);
  const y=-el.getBoundingClientRect().top;GUIDE[key]=y>=from-2&&y<=to+2;guideApply();
}
function guideOff(key){if(GUIDE[key]){GUIDE[key]=false;guideApply();}}
function guideApply(){document.documentElement.classList.toggle('snap-g',Object.values(GUIDE).some(Boolean));}
function homeSceneQueue(){if(!homeSceneFrame)homeSceneFrame=requestAnimationFrame(paintHomeScenes);}
function paintHomeScenes(){
  homeSceneFrame=0;
  if(PAPER)paperWritePaint();
  const clamp=v=>Math.max(0,Math.min(1,v)),reduce=reduceMotion();
  const plan=document.querySelector('.plan');
  if(plan){const r=plan.getBoundingClientRect(),words=[...plan.querySelectorAll('.plan-word')],p=reduce?1:clamp((innerHeight*.8-r.top)/Math.max(1,r.height+innerHeight*.2));words.forEach((w,i)=>w.classList.toggle('read',p*words.length>=i+1));}
  const ab=document.querySelector('.ab-story');
  if(ab){
    const ps=[...ab.querySelectorAll('.ab-paras p')],ls=[...ab.querySelectorAll('.ab-l')];
    if(innerWidth>900&&!reduce){
      const u=ab.offsetHeight/3,progress=Math.max(0,Math.min(2,-ab.getBoundingClientRect().top/Math.max(1,u)));
      if(PAPER){
        ps.forEach((q,i)=>{
          const distance=Math.abs(progress-i);
          const weight=clamp((.48-distance)/.18),fade=weight*weight*(3-2*weight);
          q.style.opacity=String(fade);
          q.style.transform=`translateY(${Math.max(-6,Math.min(6,(i-progress)*6))}px)`;
        });
        ls.forEach((l,i)=>{l.style.opacity=String(.42+.58*clamp(progress-i+1));});
        guideOff('about');
      }else{
        const step=Math.max(0,Math.min(2,Math.round(progress)));
        ps.forEach((q,i)=>q.classList.toggle('on',i===step));ls.forEach((l,i)=>l.classList.toggle('lit',i<=step));
        guidedStops(ab,'about',[0,u,2*u,2.5*u],0,2*u);
      }
    }else{
      guideOff('about');ps.forEach(q=>{q.classList.remove('on');q.style.removeProperty('opacity');q.style.removeProperty('transform');});
      ls.forEach(l=>l.style.removeProperty('opacity'));
      ps.forEach((q,i)=>ls[i]&&ls[i].classList.toggle('lit',reduce||q.getBoundingClientRect().top<=innerHeight*.55));
    }
  }else guideOff('about');
  const pcs=document.querySelector('.pcards');if(pcs){guideOff('home');paperCardsPaint(pcs);return;}
  const day=document.querySelector('.day');if(!day){guideOff('home');return;}
  const track=day.querySelector('.day-track'),pin=day.querySelector('.day-pin'),panels=[...day.querySelectorAll('.day-panel')];
  const desktop=innerWidth>900&&!reduce,step=panels.length>1?panels[1].offsetLeft-panels[0].offsetLeft:0,max=step*(panels.length-1);
  day.style.height=desktop?`${pin.offsetHeight+max}px`:'';
  if(desktop)guidedStops(day,'home',[...panels.map((_,i)=>i*step),max+pin.offsetHeight*.6],0,max);
  else if(!reduce){
    /* phones: panels stack, each is its own stop under the sticky strip; the button row after the last is the exit stop */
    const off=document.getElementById('hdr').offsetHeight+day.querySelector('.day-sky').offsetHeight;
    day.style.setProperty('--gs-top',`${off}px`);
    day.querySelectorAll(':scope>.gs-stop').forEach(n=>n.remove());
    const end=day.querySelector('.day-end').getBoundingClientRect().top;
    GUIDE.home=panels[0].getBoundingClientRect().top<innerHeight*.6&&end>off+4;guideApply();
  }else guideOff('home');
  const r=day.getBoundingClientRect();let p=0;
  if(desktop){p=clamp(-r.top/Math.max(1,max));track.style.transform=`translateX(${-max*p}px)`;}
  else{track.style.transform='';const first=panels[0].getBoundingClientRect().top,last=panels[panels.length-1].getBoundingClientRect().top;p=clamp((innerHeight*.4-first)/Math.max(1,last-first));}
  const active=desktop?Math.round(p*(panels.length-1)):Math.max(0,panels.reduce((best,panel,i)=>panel.getBoundingClientRect().top<=innerHeight*.4?i:best,0));day.querySelectorAll('.day-hours li').forEach((el,i)=>{el.classList.toggle('on',i===active);const link=el.querySelector('a');if(i===active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
  day.querySelector('.day-sun').style.left=`${p*100}%`;
  const stops=document.documentElement.dataset.theme==='paper'?['#F2EBDE','#F2EBDE','#F2EBDE','#F2EBDE']:isLight()?['#F6EFE0','#ECE6D9','#DCD3C2','#C9C0AE']:['#1E1A15','#191C26','#141522','#0B0C12'];
  const segment=p*3,i=Math.min(2,Math.floor(segment)),t=segment-i;
  const rgb=h=>[1,3,5].map(n=>parseInt(h.slice(n,n+2),16)),a=rgb(stops[i]),b=rgb(stops[i+1]);
  const ground=`rgb(${a.map((v,n)=>Math.round(v+(b[n]-v)*t)).join(',')})`;day.style.backgroundColor=ground;day.style.setProperty('--day-ground',ground);
}
addEventListener('scroll',homeSceneQueue,{passive:true});addEventListener('resize',homeSceneQueue,{passive:true});
themeSw.addEventListener('click',homeSceneQueue);
