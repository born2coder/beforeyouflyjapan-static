'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const pages = fs.globSync('**/index.html', {cwd:root}).filter(p => !/(?:^|\/)(?:node_modules|preview-dist|\.openai)(?:\/|$)/.test(p));
const publisher = 'ca-pub-6391747094534886';
const rootGuides = new Set(['after-hotel-checkout-tokyo/index.html','before-late-flight-tokyo/index.html','how-early-arrive-haneda-airport/index.html']);
const read = p => fs.readFileSync(path.join(root,p),'utf8');
function editorial(relative, text){
 return /<meta name="robots" content="index,follow/.test(text) && (relative.startsWith('places/') || (relative.startsWith('guides/') && relative !== 'guides/index.html') || rootGuides.has(relative));
}
function inlineAnalytics(html){
 const block=html.match(/<!-- BYF:privacy-analytics --><script>([\s\S]*?)<\/script><!-- \/BYF:privacy-analytics -->/);
 assert.ok(block, 'Google tag must use the reviewed query-free context');
 return block[1];
}

test('publisher ownership is retained while operational/support pages do not load ads',()=>{
 let yes=0,no=0;
 for(const p of pages){
  const html=read(p);
  assert.deepEqual([...html.matchAll(/<meta name="google-adsense-account" content="([^"]+)">/g)].map(m=>m[1]),[publisher],p);
  const loaders=[...html.matchAll(/<script\b[^>]*src="[^"]*adsbygoogle\.js[^>]*>/g)];
  const allowed=editorial(p,html);
  assert.equal(loaders.length,Number(allowed),p+': ad runtime must follow the page role');
  if(allowed)yes++;else{no++;assert.doesNotMatch(html,/<ins\b[^>]*class="[^"]*adsbygoogle/,p);}
 }
 assert.ok(yes>0 && no>0,'Both editorial and non-advertising roles must exist');
 assert.equal(read('ads.txt').trim(),'google.com, pub-6391747094534886, DIRECT, f08c47fec0942fa0');
});

test('normal GA page views exclude personalised URL and referrer conditions on every page',()=>{
 const personalised='https://beforeyouflyjapan.com/plans/shinagawa-short-stop-before-haneda/?byf_context=1&flight_at=2026-11-18T00%3A30&free_at=2026-11-17T12%3A00&luggage=return_elsewhere&luggage_area=Shinjuku#your-timeline';
 const ref='https://beforeyouflyjapan.com/?flight_at=2026-11-18T00%3A30&free_at=2026-11-17T12%3A00&luggage=return_elsewhere#planner';
 for(const p of pages){
  const html=read(p);
  if(!html.includes('googletagmanager.com/gtag/js'))continue;
  const ctx={URL,location:new URL(personalised),document:{referrer:ref}};ctx.window=ctx;
  vm.createContext(ctx);vm.runInContext(inlineAnalytics(html),ctx);
  const calls=ctx.dataLayer.map(args=>Array.from(args));
  const configs=calls.filter(c=>c[0]==='config');
  assert.equal(configs.length,1,p+': one config');
  assert.equal(configs[0][1],'GT-NGP9KVZR',p);
  assert.equal(configs[0][2].page_location,'https://beforeyouflyjapan.com/plans/shinagawa-short-stop-before-haneda/',p);
  assert.equal(configs[0][2].page_referrer,'https://beforeyouflyjapan.com/',p);
  assert.equal(calls.findIndex(c=>c[0]==='set')<calls.findIndex(c=>c[0]==='config'),true,p+': set context before config');
  const sent=JSON.stringify(calls.filter(c=>c[0]!=='js'));
  assert.doesNotMatch(sent,/flight_at|free_at|2026-11-18|luggage|Shinjuku|your-timeline/,p);
 }
 const html=read('index.html');
 for(const referrer of ['', 'javascript:alert(1)', 'https://example.com/article?q=private#detail']){
  const ctx={URL,location:new URL(personalised),document:{referrer}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(inlineAnalytics(html),ctx);
  const config=ctx.dataLayer.map(a=>Array.from(a)).find(c=>c[0]==='config');
  assert.equal(config[2].page_referrer,referrer.startsWith('https:')?'https://example.com/article':'');
 }
});

test('support pages describe desk research and practical limits without invented fieldwork or consent UI',()=>{
 const about=read('about/index.html'),method=read('how-we-check/index.html'),privacy=read('privacy-policy/index.html'),hotel=read('for-hotels/index.html');
 assert.match(about,/Before You Fly Japan is the publisher/);
 assert.match(about,/desk-researched guides/);
 assert.match(about,/href="\/contact\/"/);
 assert.match(method,/scenario checks are simulated/);
 assert.match(method,/three hours before an international departure/);
 assert.match(method,/not live train departures or measured queues/);
 assert.match(privacy,/without their query strings or fragments/);
 assert.match(privacy,/hosting provider receives the requested URL/);
 assert.match(privacy,/Resend/);
 assert.doesNotMatch(privacy,/we will ask for consent before/i);
 assert.equal((hotel.match(/<main\b/g)||[]).length,1,'one main landmark on the hotel support page');
 for(const p of ['about','how-we-check','privacy-policy','disclaimer']){
  const text=read(p+'/index.html');assert.equal((text.match(/<h1\b/g)||[]).length,1,p);assert.equal((text.match(/<main\b/g)||[]).length,1,p);
 }
});
