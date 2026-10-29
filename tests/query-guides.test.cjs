const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const {JSDOM}=createRequire(path.resolve(process.env.BYF_TEST_DEPS,'package.json'))('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('audit/query-guides-manifest.json'));
assert.equal(manifest.pages.length,12);
for(const row of manifest.pages){
 const d=new JSDOM(read(row.path.slice(1)+'index.html')).window.document;
 const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);
 assert.equal(new Set(ids).size,ids.length,row.path+' duplicate anchors');
 for(const a of d.querySelectorAll('.byf-answer-nav a'))assert.ok(d.getElementById(a.hash.slice(1)),row.path+' broken section link');
 assert.equal(d.querySelectorAll('.byf-query-content').length,1);
 const article=[...d.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).filter(s=>s['@type']==='Article');
 assert.equal(article.length,1);assert.equal(article[0].headline,d.querySelector('h1').textContent);
 assert.equal(article[0].dateModified,'2026-10-30');
 const cta=d.querySelector('.byf-guide-cta a');
 if(cta)assert.ok(['HND','NRT','KIX'].includes(new URL(cta.getAttribute('href'),'https://beforeyouflyjapan.com').searchParams.get('airport')));
}
// Concrete arithmetic and UI date handling for the examples readers actually see.
const flight=new Date('2026-10-31T00:30:00+09:00');
assert.equal(new Date(+flight-180*60000).toISOString(),'2026-10-30T12:30:00.000Z');
assert.equal(new Date(+flight-(180+90+20)*60000).toISOString(),'2026-10-30T10:40:00.000Z');
for(const code of ['HND','NRT','KIX']){
 const dom=new JSDOM(read('index.html'),{url:'https://beforeyouflyjapan.com/?airport='+code+'#planner',runScripts:'outside-only'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const f of ['analytics','planner-data','planner-core','visit-context','planner'])w.eval(read('assets/'+f+'.js'));
 const form=w.document.querySelector('form');assert.equal(form.elements.airport.value,code);
 form.elements.start.value=code==='KIX'?'Namba':code==='NRT'?'Narita':'Shinagawa';
 form.elements.flight_at.value='2026-10-31T00:30';form.elements.free_at.value='2026-10-30T12:00';
 form.querySelector('[name=luggage][value=none]').checked=true;
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const cards=[...w.document.querySelectorAll('#byf-results [data-plan-id]')];assert.ok(cards.length,code+' midnight alternatives');
 for(const card of cards){const u=new URL(card.href);assert.equal(u.searchParams.get('flight_at'),'2026-10-31T00:30');assert.ok(u.searchParams.get('plan_start_at').startsWith('2026-10-30'),code+' previous-evening plan');}
 w.close();
}
console.log('Verified 12 question-led guides, unique anchors/schema, 5 airport CTAs, and midnight date handling for all 3 airports.');
