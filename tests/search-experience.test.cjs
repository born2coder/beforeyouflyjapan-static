const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const deps = process.env.BYF_TEST_DEPS;
if (!deps) throw new Error('Set BYF_TEST_DEPS to a directory with jsdom installed.');
const { JSDOM } = createRequire(path.resolve(deps, 'package.json'))('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const origin = 'https://beforeyouflyjapan.com';
const places = JSON.parse(read('content/place-practical.json'));
const evidence = [];

function planner(url) {
 const dom = new JSDOM(read('index.html'), { url, runScripts: 'outside-only' });
 const w = dom.window, calls=[];
 w.HTMLElement.prototype.scrollIntoView = function () {};
 w.gtag = (...args) => calls.push(args);
 for(const file of ['analytics','planner-data','planner-core','visit-context','planner'])w.eval(read(`assets/${file}.js`));
 return { dom,w,calls,form:w.document.querySelector('form') };
}
function submit(env, date='2026-10-30', flight='23:00', free='08:00') {
 const { w,form }=env;
 form.elements.flight_at.value=`${date}T${flight}`;
 form.elements.free_at.value=`${date}T${free}`;
 form.querySelector('[name=luggage][value=none]').checked=true;
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
}

let routes=0;
for(const [slug,row] of Object.entries(places)){
 const page=new JSDOM(read(`places/${slug}/index.html`));
 const d=page.window.document;
 assert.equal(d.querySelectorAll('h1').length,1);
 assert.equal(d.querySelectorAll('#flight-fit').length,1,slug+' duplicate anchor');
 for(const id of ['one-stop','access-bags','plan-from-here'])assert.equal(d.querySelectorAll('#'+id).length,1,slug+' missing section '+id);
 assert.equal(d.querySelectorAll('.byf-practical').length,1);
 assert.equal(d.querySelectorAll('.byf-visit-nav').length,1);
 assert.ok(d.querySelector('.byf-map-link').href.startsWith('https://www.google.com/maps/search/?api=1&query='));
 assert.ok(d.querySelector('.byf-practical').textContent.includes(row.visit));
 for(const link of d.querySelectorAll('.byf-place-links a[data-byf-event=place_planner_click]')){
  const url=new URL(link.getAttribute('href'),origin),env=planner(url.href),{w,form,calls}=env;
  for(const key of ['airport','start','interest'])assert.equal(form.elements[key].value,url.searchParams.get(key),`${slug}: ${key} prefill`);
  assert.equal(form.elements.flight_at.value,'','No invented flight date');
  assert.equal(form.elements.free_at.value,'','No invented free time');
  assert.ok(w.document.querySelector('.byf-context-notice').textContent.includes(row.name));
  const flightTime=slug==='ginza-evening'?'23:30':'23:00';
  submit(env,'2026-10-30',flightTime);
  const output=w.document.querySelector('#byf-results'),ids=w.BYF_VISITS[slug].ids;
  const cards=[...output.querySelectorAll('[data-plan-id]')];
  assert.ok(cards.length,slug+' has no open-Friday options');
  assert.ok(ids.includes(Number(cards[0].dataset.planId)),slug+' requested visit should rank first when it fits');
  const params=new URL(cards[0].href).searchParams;
  assert.equal(params.get('flight_at'),'2026-10-30T'+flightTime);
  assert.equal(params.get('start'),form.elements.start.value);
  const core=w.BYFPlannerCore,source=core.enhanceData(w.BYF_STATIC_DATA),p=source.plans.find(p=>p.id===Number(cards[0].dataset.planId));
  const stages=core.withLuggageStep(p,'none','',form.elements.start.value).steps;
  const timing=core.timingFacts(stages,new Date(params.get('plan_start_at')),p.airportPlan);
  const airportTarget=new Date(new Date('2026-10-30T'+flightTime+':00+09:00').getTime()-180*60000);
  assert.ok(timing.readyAt<=airportTarget,slug+' airport-ready target');
  assert.equal(calls.filter(c=>c[0]==='event'&&c[1]==='planner_complete').length,1,'one GA event per successful calculation');
  assert.ok(!calls.some(c=>JSON.stringify(c).includes('2026-10-30')),'No flight/free timestamps in custom analytics events');
  evidence.push({slug,airport:form.elements.airport.value,start:form.elements.start.value,topPlan:p.id,targetProtected:true});
  routes++;w.close();
 }
 page.window.close();
}

for(const date of ['2026-10-19','2026-11-09']){
 const e=planner(origin+'/?airport=HND&start=Tokyo+Station&place=tokyo-station-gallery');submit(e,date);
 const output=e.w.document.querySelector('#byf-results');
 assert.ok(!output.querySelector('[data-plan-id="4006"]'),'Closed/unverified gallery date must not be suggested');
 assert.match(output.textContent,/does not fit these conditions/,'Explain replacement of requested visit');
 e.w.close();
}
const e=planner(origin+'/?airport=HND&start=Shinagawa&place=shinagawa');submit(e,'2026-10-30','15:00','14:00');
assert.match(e.w.document.querySelector('#byf-results').textContent,/Skip sightseeing/);
assert.equal(e.calls.filter(c=>c[1]==='no_plan_found').length,1);
e.w.close();

// Crawl only rendered static HTML links, without relying on sitemap discovery.
const urls=new Set(['/']);const queue=['/'];const graph={};
while(queue.length){
 const url=queue.shift(),file=url==='/'?'index.html':url.slice(1)+'index.html';
 if(!fs.existsSync(path.join(root,file)))continue;
 const d=new JSDOM(read(file)).window.document;graph[url]=[];
 for(const a of d.querySelectorAll('a[href]')){
  const next=new URL(a.getAttribute('href'),origin);
  if(next.origin!==origin||!next.pathname.endsWith('/')||next.pathname.startsWith('/api/'))continue;
  graph[url].push(next.pathname);
  if(!urls.has(next.pathname)){urls.add(next.pathname);queue.push(next.pathname);}
 }
}
const targets=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
for(const target of targets)assert.ok(urls.has(target),'Homepage cannot reach '+target);
const directory=new JSDOM(read('guides/index.html')).window.document;
assert.equal(new Set([...directory.querySelectorAll('#places a[href]')].map(a=>a.getAttribute('href'))).size,40);
const engine=planner(origin),core=engine.w.BYFPlannerCore,plans=core.enhanceData(engine.w.BYF_STATIC_DATA).plans;
let baseLabels=0,personalizedLabels=0;
const staticPaths=new Set();
for(const p of plans){
 const relative=new URL(p.url).pathname.slice(1)+'index.html';
 const base=core.totalMinutes(core.withLuggageStep(p,'none','',p.area).steps);
 if(!staticPaths.has(relative)){
  staticPaths.add(relative);
  const staticDoc=new JSDOM(read(relative)).window.document;
  const staticFact=staticDoc.querySelectorAll('.byf-facts > span')[1];
  if(staticFact)assert.match(staticFact.textContent,new RegExp('^'+base+' min'),p.name+' static hero');
  assert.match(staticDoc.querySelectorAll('.byf-plan-fit dd')[1].textContent,new RegExp('^'+base+' min'),p.name+' static details');
  baseLabels++;
 }
 for(const luggage of ['none','store_near_stop']){
  const fit=core.withLuggageStep(p,luggage,'',p.area);if(!fit.compatible)continue;
  const free=new Date('2026-10-30T08:00:00+09:00'),ready=new Date('2026-10-30T20:30:00+09:00');
  const window=core.scheduleWindow(free,ready,fit.steps,p);if(!window.valid)continue;
  const params=new URLSearchParams({byf_context:'1',plan_id:String(p.id),airport:p.airport,flight_at:'2026-10-30T23:30',free_at:'2026-10-30T08:00',start:p.area,luggage,needs:'standard',plan_start_at:window.latest.toISOString()});
  const dom=new JSDOM(read(relative),{url:p.url+'?'+params,runScripts:'outside-only'}),w=dom.window;
  for(const file of ['planner-data','planner-core','plan-context'])w.eval(read('assets/'+file+'.js'));
  const total=core.totalMinutes(fit.steps),fact=w.document.querySelectorAll('.byf-facts > span')[1];
  if(fact)assert.match(fact.textContent,new RegExp('^'+total+' min'),p.name+' hero duration');
  assert.match(w.document.querySelectorAll('.byf-plan-fit dd')[1].textContent,new RegExp('^'+total+' min'),p.name+' detail duration');
  assert.doesNotMatch(w.document.querySelector('.byf-plan-fit').textContent,/You have at least .*before your recommended airport arrival time\./);
  personalizedLabels++;w.close();
 }
}
assert.equal(baseLabels,56);assert.ok(personalizedLabels>=100);engine.w.close();
fs.writeFileSync(path.join(root,'audit/search-experience-tests.json'),JSON.stringify({date:'2026-10-30',placeGuides:40,contextualRoutes:routes,reachableSearchTargets:targets.length,closedGalleryDates:2,basePlanDurationLabels:baseLabels,personalizedDurationLabels:personalizedLabels,evidence},null,2)+'\n');
console.log(`Passed all 40 guides, ${routes} contextual planner routes, all ${targets.length} discoverable search targets, ${baseLabels} base / ${personalizedLabels} personalized duration labels, closed/unverified dates, airport-ready times and event dispatch.`);
