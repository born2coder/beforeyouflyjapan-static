import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import test from 'node:test';
const {JSDOM}=createRequire(path.resolve(process.env.BYF_TEST_DEPS,'package.json'))('jsdom');
const root=path.resolve(import.meta.dirname,'..'),origin='https://beforeyouflyjapan.com';
const pages=fs.globSync('**/index.html',{cwd:root}).sort();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const docs=new Map(pages.map(p=>[p,new JSDOM(read(p)).window.document]));
const pageURL=p=>p==='index.html'?'/':'/'+p.replace(/index\.html$/,'');
const sitemap=read('sitemap.xml'),targets=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const local=p=>p==='/'?'index.html':path.extname(p)?p.slice(1):p.slice(1)+'index.html';
const editorial={...JSON.parse(read('content/editorial-tokyo.json')),...JSON.parse(read('content/editorial-regions.json'))};
const guides=JSON.parse(read('audit/guide-usefulness-evidence.json')).pages;

test('117 pages keep distinct search articles and noindex plan examples',()=>{
 assert.equal(pages.length,117);assert.equal(pages.filter(p=>p.startsWith('places/')).length,40);assert.equal(pages.filter(p=>p.startsWith('plans/')).length,56);assert.equal(targets.length,58);
 for(const [p,d] of docs){const robots=d.querySelector('meta[name=robots]')?.content||'';
  if(p.startsWith('plans/')){assert.ok(robots.includes('noindex,follow'),p);assert.ok(!targets.includes(pageURL(p)),p);assert.ok(d.querySelector('#your-timeline'),p);}
  if(p.startsWith('places/')){assert.ok(robots.startsWith('index,follow'),p);assert.ok(targets.includes(pageURL(p)),p);}
 }
});
test('metadata, one H1 and self canonicals identify every page uniquely',()=>{
 const titles=new Set(),descs=new Set();for(const [p,d] of docs){const title=d.title,desc=d.querySelector('meta[name=description]')?.content||'';
  assert.ok(title.length>=10,p+' title');assert.ok(desc.length>=50,p+' description');assert.ok(!titles.has(title),p+' duplicate title');assert.ok(!descs.has(desc),p+' duplicate description');titles.add(title);descs.add(desc);
  assert.equal(d.querySelectorAll('h1').length,1,p);assert.equal(d.querySelector('link[rel=canonical]')?.href,origin+pageURL(p),p);
 }
});
test('internal article, asset and section links resolve to a real destination',()=>{
 for(const [p,d] of docs){for(const el of d.querySelectorAll('a[href],script[src],link[rel=stylesheet],img[src]')){
  const href=el.getAttribute('href')||el.getAttribute('src');if(!href||/^(data:|mailto:|tel:)/.test(href))continue;
  const url=new URL(href,origin+pageURL(p));if(url.origin!==origin||url.pathname.startsWith('/api/'))continue;
  const file=local(decodeURIComponent(url.pathname));assert.ok(fs.existsSync(path.join(root,file)),p+' -> '+url.pathname);
  if(url.hash&&file.endsWith('index.html'))assert.ok(docs.get(file)?.getElementById(decodeURIComponent(url.hash.slice(1))),p+' missing '+url.pathname+url.hash);
 }}
});
test('old URL redirects have existing final targets and no chains',()=>{
 const rows=read('_redirects').trim().split('\n').filter(x=>x&&!x.startsWith('#')).map(x=>x.split(/\s+/));
 const sources=new Set(rows.map(x=>x[0]));for(const [src,dest] of rows){if(dest.startsWith('https:')||dest.startsWith('/api/'))continue;assert.ok(!sources.has(dest),src+' chain');assert.ok(fs.existsSync(path.join(root,local(new URL(dest,origin).pathname))),src+' target');}
});
test('all 40 destinations contain one integrated local visit and one credited real photograph',()=>{
 for(const [slug,row] of Object.entries(editorial)){const d=docs.get('places/'+slug+'/index.html');assert.ok(d.querySelector('.byf-editorial-hero').textContent.includes(row.opening),slug);
  assert.equal(d.querySelectorAll('.byf-editorial-section').length,row.sections.length,slug);assert.equal(d.querySelectorAll('.byf-place-photo').length,1,slug);assert.equal(d.querySelectorAll('.byf-practical').length,1,slug);
  const photo=d.querySelector('.byf-place-photo');assert.ok(photo.querySelector('a[href*="commons.wikimedia.org"]'),slug);assert.ok(photo.querySelector('a[href*="creativecommons.org"]'),slug);
  assert.ok(d.querySelector('#flight-fit').textContent.includes(row.visitMinutes.match(/^[0-9–]+/)[0]),slug);assert.equal(d.querySelectorAll('.byf-query-content').length,0,slug+' old article stacked');
 }
});
test('complete route models disclose actual stages and preserve the arithmetic',()=>{
 const c={window:{}};vm.createContext(c);for(const f of ['planner-data','planner-core'])vm.runInContext(read('assets/'+f+'.js'),c);
 const core=c.window.BYFPlannerCore,data=core.enhanceData(c.window.BYF_STATIC_DATA);
 for(const p of pages.filter(p=>p.startsWith('places/'))){const d=docs.get(p);assert.ok(d.querySelector('#plan-from-here').textContent.includes('not minimum time before takeoff'),p);
  for(const card of d.querySelectorAll('.byf-route-model')){const link=card.querySelector('a[href*="plan_id="]'),id=Number(new URL(link.href,origin).searchParams.get('plan_id')),plan=data.plans.find(x=>x.id===id);assert.ok(plan,p);
   const sum=[...card.querySelectorAll('.byf-model-stages b')].reduce((n,e)=>n+parseInt(e.textContent),0);assert.equal(sum,core.totalMinutes(core.withLuggageStep(plan,'none','',plan.area).steps),p+' sum');
  }
 }
});
test('all13 departure guides answer with sourced decisions and a valid airport CTA',()=>{
 assert.equal(guides.length,13);for(const row of guides){const d=docs.get(local(row.path));assert.ok(d.querySelector('.byf-query-content'),row.path);assert.ok(d.querySelectorAll('.byf-query-content section').length>=3,row.path);assert.ok(d.querySelector('.byf-query-content').textContent.includes('2026-11-17')||d.querySelector('.byf-query-content').textContent.includes('17 November 2026'),row.path);
  const a=d.querySelector('.byf-guide-cta a');assert.ok(a,row.path);assert.ok(['HND','NRT','KIX'].includes(new URL(a.getAttribute('href'),origin).searchParams.get('airport')),row.path);
 }
});
test('article schemas match visible titles and section identifiers are unique',()=>{
 for(const [p,d] of docs){const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);assert.equal(ids.length,new Set(ids).size,p+' duplicate id');
  const schema=[...d.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent));
  if(p.startsWith('places/')||guides.some(g=>local(g.path)===p)){const a=schema.filter(x=>x['@type']==='Article');assert.equal(a.length,1,p);assert.equal(a[0].headline,d.querySelector('h1').textContent,p);assert.equal(a[0].dateModified,'2026-11-17',p);}
  assert.ok(d.querySelector('meta[name=viewport]')?.content.includes('width=device-width'),p);
 }
});
test('the homepage explains actual departure choices and every search page is reachable',()=>{
 const d=docs.get('index.html');assert.equal(d.querySelectorAll('.byf-home-choice').length,3);const seen=new Set(['/']),queue=['/'];while(queue.length){const u=queue.shift(),doc=docs.get(local(u));if(!doc)continue;for(const a of doc.querySelectorAll('a[href]')){const x=new URL(a.getAttribute('href'),origin+u);if(x.origin===origin&&docs.has(local(x.pathname))&&!seen.has(x.pathname)){seen.add(x.pathname);queue.push(x.pathname);}}}for(const url of targets)assert.ok(seen.has(url),'Unreachable '+url);
});
test('planner and ownership scripts remain present without duplicating the search token',()=>{
 const home=docs.get('index.html');for(const f of ['planner-core','planner-data','planner'])assert.equal(home.querySelectorAll(`script[src^="/assets/${f}.js"]`).length,1,f);
 for(const p of pages.filter(p=>p.startsWith('plans/')))assert.equal(docs.get(p).querySelectorAll('script[src^="/assets/plan-context.js"]').length,1,p);
 assert.equal(home.querySelectorAll('meta[name=google-site-verification]').length,1);
});
