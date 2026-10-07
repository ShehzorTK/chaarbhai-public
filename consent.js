/* Paper only (loaded by index.html in the Paper production bundle).
   First-visit notice for Google Analytics. Analytics stays unloaded until Accept; Decline is the same size.
   The choice is kept in localStorage ('cb-consent': granted | denied). A browser sending Global Privacy Control
   or Do Not Track counts as Decline until the visitor chooses otherwise. "Cookie settings" in the footer reopens the notice. */
(function(){
  var KEY='cb-consent',box=null,opener=null;
  var get=function(){try{return localStorage.getItem(KEY)}catch(e){return null}};
  var set=function(v){try{localStorage.setItem(KEY,v)}catch(e){}};
  var signal=function(){return navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1'};
  var state=function(){var s=get();return s||(signal()?'denied':null)};

  function apply(v){
    if(v==='granted'){if(window.CB_GA_LOAD)window.CB_GA_LOAD()}
    else if(window.CB_GA_OFF)window.CB_GA_OFF();
  }
  function close(){
    if(!box)return;
    box.classList.remove('on');
    var b=box;box=null;
    setTimeout(function(){b.remove()},220);
    if(opener&&opener.isConnected)opener.focus();
    opener=null;
  }
  function choose(v){set(v);apply(v);close()}
  function open(fromUser){
    if(box)return;
    opener=fromUser?document.activeElement:null;
    var cur=state();
    box=document.createElement('div');
    box.className='consent';box.setAttribute('role','dialog');box.setAttribute('aria-label','Analytics choice');
    box.innerHTML='<p>May we use Google Analytics to count visits and see which pages people read? It stays off unless you accept. <a href="#/privacy" data-nav>Privacy Policy</a></p>'
      +'<div class="consent-btns"><button type="button" data-c="denied">Decline</button><button type="button" data-c="granted">Accept</button></div>';
    box.addEventListener('click',function(e){var b=e.target.closest('button[data-c]');if(b)choose(b.dataset.c);else if(e.target.closest('a'))close()});
    box.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
    document.body.appendChild(box);
    void box.offsetHeight;
    box.classList.add('on');
    if(fromUser){var first=box.querySelector('button');if(first)first.focus()}
    if(cur){var cb=box.querySelector('[data-c="'+cur+'"]');if(cb)cb.setAttribute('aria-current','true')}
  }
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-consent-open]')){e.preventDefault();open(true)}
  });

  function init(){
    var s=state();
    if(s)apply(s);
    if(!get()&&!signal())setTimeout(function(){open(false)},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
