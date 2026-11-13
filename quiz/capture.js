/* Native inquiry capture. Only opaque receipts cross first-party subdomains; no customer details in cookies or analytics. */
(function(w){
  'use strict';
  var root='https://admin.chaarbhai.com/api/intake/',live=/(^|\.)chaarbhai\.com$/.test(w.location.hostname);
  function cookie(name){var m=w.document.cookie.match(new RegExp('(?:^|; )'+name+'=([^;]*)'));try{return m?decodeURIComponent(m[1]):''}catch(e){return''}}
  function write(name,value,age){w.document.cookie=name+'='+encodeURIComponent(value)+'; Path=/; Max-Age='+age+'; SameSite=Lax'+(live?'; Domain=.chaarbhai.com; Secure':'')}
  function uuid(){return w.crypto.randomUUID?w.crypto.randomUUID(): '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,function(c){return(c^w.crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)})}
  function remember(r){if(r&&r.receipt&&r.inquiry_id)write('cb_lead_receipt',r.receipt,604800)}
  async function post(path,payload){
    var controller=new w.AbortController(),timeout=w.setTimeout(function(){controller.abort()},20000);
    try{
      var r=await w.fetch(root+path,{method:'POST',credentials:'omit',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      var j=await r.json();
      if(!r.ok||!j.inquiry_id||!j.receipt)throw new Error('Your inquiry could not be saved. Please try again or email info@chaarbhai.com.');
      remember(j);return j;
    }finally{w.clearTimeout(timeout)}
  }
  function recordLead(r){
    if(!live||!r||!r.new_lead)return;
    var key='cb-counted-'+r.inquiry_id;
    try{if(w.sessionStorage.getItem(key))return;w.sessionStorage.setItem(key,'1')}catch(e){}
    var id='lead-'+r.inquiry_id;
    try{if(w.fbq)w.fbq('track','Lead',{content_name:'Wedding inquiry'},{eventID:id})}catch(e){}
    try{if(w.gtag)w.gtag('event','generate_lead',{method:'native_form',event_id:id});else(w.dataLayer=w.dataLayer||[]).push({event:'generate_lead',method:'native_form',event_id:id})}catch(e){}
    try{w.fetch('https://capi.chaarbhai.com/lead',{method:'POST',keepalive:true,headers:{'content-type':'application/json'},body:JSON.stringify({event_id:id,fbp:cookie('_fbp'),fbc:cookie('_fbc'),url:w.location.origin+w.location.pathname})}).catch(function(){})}catch(e){}
  }
  w.CBLeadCapture={uuid:uuid,receipt:function(){return cookie('cb_lead_receipt')},remember:remember,cookie:cookie,writeCookie:write,
    shortForm:function(payload){var p=Object.assign({},payload);if(!p.receipt)p.receipt=cookie('cb_lead_receipt');return post('short-form',p)},
    quiz:function(payload){var p=Object.assign({},payload);if(!p.receipt)p.receipt=cookie('cb_lead_receipt');return post('quiz',p)},recordLead:recordLead};
})(window);
