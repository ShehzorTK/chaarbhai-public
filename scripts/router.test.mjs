import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function browser(address) {
  let current = new URL(address);
  const listeners = {}, events = [], history = [];
  const location = new Proxy({}, {get:(_,key)=>key==='href'?current.href:current[key]});
  const context = {URL, Set, Event, location, window:{},
    history:Object.fromEntries(['pushState','replaceState'].map(method=>[method,(_,__,target)=>{
      current = new URL(target,current);history.push({method,url:current.href});
    }])),
    addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn),
    dispatchEvent:event=>{events.push(event.type);for(const fn of listeners[event.type]||[])fn(event);}
  };
  vm.runInNewContext(readFileSync('router.js','utf8'),context);
  return {router:context.window.CB_ROUTER, location, events, history, context};
}

test('direct pages stay clean and select the correct private app view',()=>{
  for(const [path,view] of [['/','/'],['/prices','/services'],['/work','/portfolio'],['/about','/about'],['/reviews','/testimonials'],['/contact','/contact'],['/privacy','/privacy']]){
    const b=browser('https://www.chaarbhai.com'+path);
    assert.equal(b.location.pathname,path);assert.equal(b.location.hash,'');
    assert.equal(b.router.internalPath(),view);
  }
});
test('old hash routes, duplicate hashes, aliases and HTML URLs become real paths',()=>{
  for(const [path,want] of [['/#/services','/prices'],['/about#/about','/about'],['/#/#/portfolio','/work'],['/prices#/testimonials','/reviews'],['/#/work','/work'],['/contact.html','/contact'],['/services/','/prices']]){
    const b=browser('https://www.chaarbhai.com'+path);
    assert.equal(b.location.pathname,want);assert.equal(b.location.hash,'');
  }
});
test('old film links retain the selected film and attribution without fragments',()=>{
  const b=browser('https://www.chaarbhai.com/?utm_source=instagram#/portfolio/videos/abc123');
  assert.equal(b.location.pathname,'/work');assert.equal(b.location.search,'?utm_source=instagram&view=films&v=abc123');
  assert.equal(b.router.internalPath(),'/portfolio/films/abc123');
  const photos=browser('https://www.chaarbhai.com/#/portfolio/photos/portraits');
  assert.equal(photos.location.search,'?chapter=portraits');
  assert.equal(photos.router.internalPath(),'/portfolio/photos/portraits');
});
test('navigation and Back/Forward notify the app; silent film updates do not',()=>{
  const b=browser('https://www.chaarbhai.com/about');
  assert.equal(b.router.navigate('/prices'),true);
  assert.equal(b.history.at(-1).method,'pushState');
  assert.equal(b.events.at(-1),'cb-route-change');
  const count=b.events.length;
  b.router.navigate('/work?view=films&v=abc123',true,false);
  assert.equal(b.history.at(-1).method,'replaceState');assert.equal(b.events.length,count);
  b.context.dispatchEvent(new Event('popstate'));
  assert.equal(b.events.at(-1),'cb-route-change');
  assert.equal(b.router.navigate('https://example.com/contact'),false);
  assert.equal(b.router.navigate('/missing'),false);
});
test('all primary pages expose crawlable navigation and matching metadata',()=>{
  for(const [file,path] of [['index','/'],['prices','/prices'],['work','/work'],['about','/about'],['reviews','/reviews'],['contact','/contact'],['privacy','/privacy'],['terms','/terms'],['refunds','/refunds']]){
    const html=readFileSync(file+'.html','utf8');
    assert.ok(html.includes(`rel="canonical" href="https://www.chaarbhai.com${path}"`));
    assert.ok(!/href="#\//.test(html));
    assert.ok(html.includes('src="router.js?'));
    for(const nav of ['/work','/about','/prices','/reviews','/contact']) assert.ok(html.includes(`href="${nav}"`));
  }
});
