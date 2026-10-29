import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const interaction = readFileSync('analytics-events.js','utf8');
const thanks = readFileSync('thanks.html','utf8').match(/\/\* Studio Ninja's successful-submit redirect[\s\S]*?<\/script>/)[0].replace(/<\/script>$/,'');
function setup(host='www.chaarbhai.com', consent=true) {
  const events=[],cookies=[],listeners={},frames=[],observations=[];
  let cookie='';
  const document={body:{},head:{appendChild(){}},createElement(){return{}},querySelectorAll(){return frames},addEventListener(n,f){listeners[n]=f}};
  Object.defineProperty(document,'cookie',{get:()=>cookie,set:v=>{cookies.push(v);cookie=v.includes('Max-Age=0')?'':v.split(';')[0]}});
  const window={CB_GA:consent?'G-Z463MFP164':null,gtag:(...args)=>events.push(args),addEventListener(n,f){listeners[n]=f}};
  const context={window,document,location:{hostname:host,origin:'https://'+host},IntersectionObserver:class{constructor(fn){observations.push(fn)}observe(){}unobserve(){}},MutationObserver:class{observe(){}},localStorage:{getItem:()=>consent?'granted':'denied'},dataLayer:[],Date,Math};
  context.gtag=(...args)=>window.gtag(...args);
  window.dataLayer=context.dataLayer;
  return {context,events,cookies,listeners,frames,observations,setCookie:v=>cookie=v};
}
test('preview hosts do not attach analytics or record events',()=>{
  for(const h of ['test.chaarbhai.com','localhost','preview.workers.dev']){
    const b=setup(h);vm.runInNewContext(interaction,b.context);assert.equal(b.observations.length,0);
  }
});
test('consent denied prevents form visibility and contact clicks from being recorded',()=>{
 const b=setup(undefined,false);vm.runInNewContext(interaction,b.context);
 b.observations[0]([{isIntersecting:true,target:{closest(){return null}}}]);
 b.listeners.click({target:{closest(){return {getAttribute:()=>'/contact'}}}});
 assert.equal(b.events.length,0);assert.equal(b.cookies.length,0);
});
test('parked preload is ignored; visible enquiry form counts only once',()=>{
 const b=setup();vm.runInNewContext(interaction,b.context);
 const frame={closest(){return this.parked?{}:null},parked:true};
 b.observations[0]([{isIntersecting:true,target:frame}]);assert.equal(b.events.length,0);
 frame.parked=false;
 b.observations[0]([{isIntersecting:true,target:frame}]);
 b.observations[0]([{isIntersecting:true,target:frame}]);
 assert.equal(b.events.length,1);assert.equal(b.events[0][1],'enquiry_form_view');assert.equal(b.events[0][2].enquiry_source,'main_site');
});
test('success redirect sends a source-labelled lead once; direct visits and denied main-site visits do not',()=>{
 for(const source of ['golden_hour','main_site']){
  const b=setup();b.setCookie('cb_ga_enquiry='+source);vm.runInNewContext(thanks,b.context);
  const lead=b.context.dataLayer.filter(x=>x[0]==='event'&&x[1]==='generate_lead');assert.equal(lead.length,1);assert.equal(lead[0][2].enquiry_source,source);
  vm.runInNewContext(thanks,b.context);assert.equal(b.context.dataLayer.filter(x=>x[1]==='generate_lead').length,1);
 }
 const direct=setup();vm.runInNewContext(thanks,direct.context);assert.equal(direct.context.dataLayer.length,0);
 const denied=setup(undefined,false);denied.setCookie('cb_ga_enquiry=main_site');vm.runInNewContext(thanks,denied.context);assert.equal(denied.context.dataLayer.length,0);
});
