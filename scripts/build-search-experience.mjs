import fs from 'node:fs';
import vm from 'node:vm';

const domain='https://beforeyouflyjapan.com';
const version='20261027-2';
const practical=JSON.parse(fs.readFileSync('content/place-practical.json','utf8'));
const sources=Object.fromEntries(JSON.parse(fs.readFileSync('audit/practical-source-review.json','utf8')).map(row=>[row.slug,row]));
const ctx={window:{}}; vm.createContext(ctx);
for(const file of ['planner-data','planner-core'])vm.runInContext(fs.readFileSync(`assets/${file}.js`,'utf8'),ctx);
const core=ctx.window.BYFPlannerCore, data=core.enhanceData(ctx.window.BYF_STATIC_DATA);
const oldBuild=fs.readFileSync('scripts/build-sitewide-content.mjs','utf8');
const old=vm.runInNewContext('('+oldBuild.match(/const content=([\s\S]+?);\nconst hubPaths/)[1]+')');
const extra={'ueno-toshogu':4001,'hanazono-shrine':4002,'animate-shinjuku':4003,'nakano-broadway':4004,'tokyo-character-street':4005,'tokyo-station-gallery':4006,'fukagawa-edo-museum':4007,'hozenji':4008,'namba-yasaka-shrine':4009,'kamigata-ukiyoe-museum':4010};
const airports={HND:'Haneda',NRT:'Narita',KIX:'Kansai'};
const hubs={HND:'/guides/haneda-departure-day/',NRT:'/guides/narita-departure-day/',KIX:'/guides/kansai-departure-day/'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const read=p=>fs.readFileSync(p,'utf8');
const allPages=fs.globSync('**/index.html');
const clean=(html,key)=>html.replace(new RegExp(`<!-- BYF:${key} -->[\\s\\S]*?<!-- /BYF:${key} -->`,'g'),'');
const block=(key,html)=>`<!-- BYF:${key} -->${html}<!-- /BYF:${key} -->`;
const visits={};
function metadata(html,title,description){
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(title)}</title>`);
 for(const [key,value] of [['name="description"',description],['property="og:title"',title],['property="og:description"',description]])html=html.replace(new RegExp(`(<meta ${key} content=")[^"]*(")`),`$1${esc(value)}$2`);
 return html;
}
function storage(slug,area){
 if(slug==='haneda-airport')return `<p>Use a locker in your own Haneda terminal. The airport lists sizes at ¥400, ¥500, ¥600, ¥1,000 and ¥1,500 per day; available sizes and locations differ by terminal. Collect the bag before entering security.</p><a href="https://tokyo-haneda.com/en/service/facilities/coin_locker.html" target="_blank" rel="noopener">Haneda locker locations, size limits and current fees ↗</a>`;
 if(area==='Tokyo Station')return `<p>Tokyo Station has a GRANSTA cloakroom on B1 inside the JR gates and a visitor service counter on 1F outside the gates. The published S/M/L fees are ¥500/¥1,000/¥2,000 per item. The B1 counter lists 08:30–21:00 and the outside-gate counter 08:30–20:00. Choose the side you can access and collect before closing; the operator's page is dated 23 May 2025.</p><a href="https://www.gransta.jp/news/info/cloakservice/" target="_blank" rel="noopener">Tokyo Station storage map, sizes and collection conditions ↗</a>`;
 if(['namba','dotonbori','hozenji','namba-yasaka-shrine','kamigata-ukiyoe-museum'].includes(slug))return `<p>For a Nankai airport return, compare lockers and staffed storage around Nankai Namba. Osaka's tourism-board map lists n・e・s・t on 2F at ¥800 per item per day, 09:00–21:00, within its size and weight limits. That listing is dated 1 October 2025; confirm the counter and current terms before relying on it.</p><a href="https://osaka-info.jp/en/handsfreetravel-osaka/sightseeing-from-namba-station/" target="_blank" rel="noopener">Nankai Namba storage floors, locker map and listed fees ↗</a>`;
 if(slug==='ueno-ameyoko')return `<p>If your airport route uses the Skyliner, the Keisei-Ueno baggage counter avoids a return to JR Ueno. Keisei Travel lists ¥600/¥1,000/¥1,500 for S/M/L and ¥2,000 for oversized items. These are height-based categories; confirm counter hours and collect before your train.</p><a href="https://keiseitravel.co.jp/en/f/other-service/" target="_blank" rel="noopener">Keisei-Ueno storage conditions and size categories ↗</a>`;
 if(slug==='shinagawa')return `<p>One documented option is the Multi ecube locker bank inside the JR gates, on ecute Shinagawa's south passage near the stairs to platforms 7 and 8. Its S/M/L/LW usage charges are ¥500/¥700/¥900/¥1,400; online reservation adds ¥500, making the displayed reservation totals ¥1,000/¥1,200/¥1,400/¥1,900. This is not an outside-gate Keikyu locker. Confirm access and availability before storing.</p><a href="https://multiecube.com/location/1043/" target="_blank" rel="noopener">Exact Shinagawa locker map, photos, prices and availability ↗</a>`;
 if(slug==='umeda')return `<p>Osaka's tourism-board map lists Crosta Osaka at JR Osaka Station, 09:00–20:00, at ¥1,000 per item for temporary storage. The listing is dated 1 October 2025; check the operator's current conditions and keep collection before closing. Choose the counter closest to your actual airport train or bus departure.</p><a href="https://osaka-info.jp/en/handsfreetravel-osaka/sightseeing-from-osaka-station/" target="_blank" rel="noopener">Osaka/Umeda storage counters and locker map ↗</a>`;
 if(['narita-omotesando','naritasan-shinshoji'].includes(slug))return `<p>Narita's tourism association identifies lockers in the JR Narita station passage, by JR Narita's Central/Omotesando exit and by Keisei Narita's Central/Omotesando exit. Choose the operator used by your airport train. Local fees have not been verified; for oversized bags, confirm a suitable locker before walking downhill or keep the bag at your hotel or airport instead.</p><a href="https://www.nrtk.jp/plan/questions/10.html" target="_blank" rel="noopener">Narita tourism association: locker locations and large-bag advice ↗</a>`;
 if(slug==='narita-airport')return `<p>Narita's official directory lists JAL ABC and other staffed counters by terminal and floor. Charges differ by provider and size; no single airport-wide storage price applies. Use a counter in your departure terminal and collect the bag before security.</p><a href="https://www.narita-airport.jp/en/service/delivery/storage/" target="_blank" rel="noopener">Narita storage operators, terminal floors and counter maps ↗</a>`;
 const locker=practical[slug].locker;
 if(locker)return `<p>If your route uses Tokyo Metro ${esc(locker.station)}, the operator's October 2026 listing has lockers priced ${locker.fees.map(f=>'¥'+f.toLocaleString('en-US')).join(' / ')} depending on the compartment. These are Metro lockers, not a price promise for JR or another operator. Keep collection on your chosen route and check the posted charging period and gate side.</p><p><a href="${esc(locker.map)}" target="_blank" rel="noopener">${esc(locker.station)} station map ↗</a> · <a href="${esc(locker.source)}" target="_blank" rel="noopener">Operator's local prices and locker listing ↗</a></p>`;
 return `<p>Keep collection on the ${esc(area)} return route. Before walking to ${esc(practical[slug].anchor)}, confirm a locker or staffed counter, its closing time and the exact gate side. Local storage prices have not been verified for this stop; use the posted rate rather than assuming the same price as another station. If no suitable space is available, keep the bag and choose a station meal or the airport instead.</p>`;
}

for(const [slug,row] of Object.entries(practical)){
 const file=`places/${slug}/index.html`;let html=read(file);
 for(const key of ['practical','photo','visit-nav','place-links','place-schema'])html=clean(html,key);
 const ids=old[slug]?.[0]||[extra[slug]];
 const plans=ids.map(id=>data.plans.find(p=>p.id===id));
 if(plans.some(p=>!p))throw Error('Unmapped place '+slug);
 const byAirport={};for(const p of plans){const minutes=core.totalMinutes(core.withLuggageStep(p,'none','',p.area).steps);if(!byAirport[p.airport]||minutes<byAirport[p.airport].minutes)byAirport[p.airport]={p,minutes};}
 visits[slug]={name:row.name,ids,airports:Object.keys(byAirport)};
 const offeredInterests=['Food','Culture','Shopping','Relax','Anime / Pop Culture','Waterfront'];
 const linkFor=({p},label)=>{const params=new URLSearchParams({airport:p.airport,start:p.area,interest:p.interest.find(i=>offeredInterests.includes(i))||'',place:slug});return `<a class="byf-submit" data-byf-event="place_planner_click" data-place="${slug}" href="/?${esc(params.toString())}#planner">${esc(label)} →</a>`;};
 const primary=Object.values(byAirport)[0];
 if(old[slug]){
  // Replace the old generic visit advice instead of stacking the same decision twice.
  html=html.replace(/<section class="byf-departure-(?:guide|check)"[\s\S]*?<\/section>/g,'');
  html=html.replace(/<p class="byf-verdict-lead"[\s\S]*?<\/p>/,`<p class="byf-verdict-lead"><b>Quick answer:</b> ${esc(row.visit.split('. ')[0]+'.')} The shortest complete model is ${Object.entries(byAirport).map(([code,x])=>`${x.minutes} minutes for ${code}`).join('; ')} before airport-ready time, including transport. Add luggage collection and any rest allowance.</p>`);
  const alternative=old[slug][3];
  html=html.replace(/<section class="byf-route-support"[\s\S]*?<\/section>/,`<section class="byf-route-support"><h2>Your airport return</h2><p>${esc(old[slug][2])}</p><h3>If this stop no longer fits</h3><p><a href="/places/${alternative}/">Compare ${esc(practical[alternative].name)}</a>. Recalculate from your actual location before moving.</p></section>`);
 }
 html=metadata(html,row.name,`${row.name}. See a compact visit, station access and luggage options, then check your flight time.`);
 html=html.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/,`<h1$1>${esc(row.name)}</h1>`);
 // All 40 pages use the same anchored navigation without making timing claims from word counts.
 html=html.replace(/(<section class="byf-verdict"[^>]*)(>)/,(_,attributes,end)=>attributes.replace(/ id="flight-fit"/g,'')+' id="flight-fit"'+end);
 const nav=block('visit-nav','<nav class="byf-visit-nav" aria-label="On this page"><a href="#flight-fit">Does it fit?</a><a href="#one-stop">One compact visit</a><a href="#access-bags">Access &amp; bags</a><a href="#plan-from-here">Use my flight time</a></nav>');
 html=html.replace('<section class="byf-verdict"',nav+'<section class="byf-verdict"');
 // Replace generic planner links, including the 10 newer guide templates.
 html=html.replace(/<a([^>]*?)href="\/#planner"([^>]*?)>(Check this place against my flight|Calculate with your flight and bags)[\s\S]*?<\/a>/g,linkFor(primary,'Plan from '+primary.p.area+' for '+airports[primary.p.airport]));
 const photo=sources[slug]?.photo;
 html=html.replace(/<meta property="og:image" content="[^"]*">/g,'');
 if(photo)html=html.replace('</head>',`<meta property="og:image" content="${domain}${photo.path}"></head>`).replace('<meta name="twitter:card" content="summary">','<meta name="twitter:card" content="summary_large_image">');
 const figure=photo?block('photo',`<figure class="byf-place-photo"><img src="${photo.path}" width="${photo.width}" height="${photo.height}" alt="${esc(photo.alt)}" loading="lazy" decoding="async"><figcaption>${esc(photo.alt)}. Photo: ${esc(photo.author)} · <a href="${esc(photo.source)}" target="_blank" rel="noopener">Wikimedia Commons</a> · <a href="${esc(photo.licenseUrl)}" target="_blank" rel="noopener">${esc(photo.license)}</a>. Resized and cropped for display; the photo is not a live view.</figcaption></figure>`):'';
 const map=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.anchor+', Japan')}`;
 const practicalBlock=block('practical',`${figure}<section class="byf-practical"><p class="byf-kicker">YOUR LAST STOP, IN PRACTICE</p><h2 id="one-stop">One visit worth making</h2><p>${esc(row.visit)}</p><h3>What to budget</h3><p>${esc(row.cost)}</p><h2 id="access-bags">Find the entrance and keep bags on the return route</h2><p><b>Route anchor:</b> ${esc(row.anchor)}.</p><p>${esc(row.access)}</p><p><a class="byf-map-link" data-byf-event="place_map_click" data-place="${slug}" href="${esc(map)}" target="_blank" rel="noopener">Open ${esc(row.anchor)} on the map ↗</a></p>${storage(slug,primary.p.area)}<p class="byf-source-note"><a href="${esc(row.source)}" target="_blank" rel="noopener">Official place information and photos ↗</a>${sources[slug]?.fetched?' · Access and visit source reviewed 27 October 2026.':' · Recheck current operating notices before departure.'} Suggestions above describe a compact visit, not a booking or a live train timetable.</p></section>`);
 html=html.replace(/(<section class="byf-verdict"[\s\S]*?<\/section>)/,'$1'+practicalBlock);
 const links=block('place-links',`<section class="byf-place-links"><h2 id="plan-from-here">Check this visit against your flight</h2><p>The links below set the starting area and airport. Enter your own flight, free time and luggage; change the starting area if you are elsewhere. An unavailable visit is replaced by other options, with an explanation.</p><div class="byf-actions">${Object.entries(byAirport).map(([code,x])=>linkFor(x,`Start in ${x.p.area} · ${airports[code]}`)).join('')}</div><h3>Compare the rest of the day</h3><ul>${Object.keys(byAirport).map(code=>`<li><a href="${hubs[code]}">${airports[code]} departure-day routes and alternatives</a></li>`).join('')}<li><a href="/guides/luggage-before-flight-japan/">Choose luggage storage before choosing a stop</a></li><li><a href="/guides/#places">Compare all 40 destination guides</a></li></ul></section>`);
 html=html.replace('</main>',links+'</main>');
 const schema={'@context':'https://schema.org','@type':'Article',headline:row.name,description:row.visit,mainEntityOfPage:domain+`/places/${slug}/`,publisher:{'@type':'Organization',name:'Before You Fly Japan',url:domain},...(photo?{image:domain+photo.path}:{})};
 html=html.replace('</head>',block('place-schema',`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`)+'</head>');
 fs.writeFileSync(file,html);
}

const situationLinks=[
 ['/guides/haneda-departure-day/','Haneda: compare complete Tokyo routes'],
 ['/guides/narita-departure-day/','Narita: Tokyo, Narita town or the airport?'],
 ['/guides/kansai-departure-day/','KIX: choose Namba, Umeda, Rinku or the airport'],
 ['/guides/how-early-arrive-narita-airport/','Set the Narita arrival target before sightseeing'],
 ['/guides/how-early-arrive-kansai-airport/','Set the KIX arrival target and confirm Terminal 1 or 2'],
 ['/guides/after-hotel-checkout-osaka/','After Osaka checkout: keep bags near the airport return'],
 ['/guides/before-late-flight-osaka/','Before a late Osaka flight: one stop with a firm finish'],
 ['/guides/luggage-before-flight-japan/','Luggage storage: compare collection routes and deadlines']
];
const primaryFiles=['after-hotel-checkout-tokyo/index.html','before-late-flight-tokyo/index.html','how-early-arrive-haneda-airport/index.html'];
for(const file of primaryFiles){
 let html=clean(read(file),'next-decisions');
 const isHaneda=file.startsWith('how-early');
 const selected=isHaneda?situationLinks.filter(([url])=>/haneda-departure|luggage/.test(url)):situationLinks;
 const section=block('next-decisions',`<section class="byf-next-decisions"><h2>Keep the next decision on your route</h2><p>${isHaneda?'Once your airport-ready target is set, compare a complete Haneda route and its luggage return.':'Choose your airport guide before choosing another district. If your next stop is Osaka, use the Osaka checkout and late-flight guides instead.'}</p><ul>${selected.map(([url,label])=>`<li><a href="${url}">${label}</a></li>`).join('')}<li><a href="/guides/#places">Compare all 40 places by departure airport</a></li></ul></section>`);
 html=html.replace('</main>',section+'</main>');
 if(isHaneda)html=metadata(html,'How Early to Arrive at Haneda? International Flight & Terminal Guide','Plan to be ready at Haneda 3 hours before an international flight, then check your airline, Terminal 2 or 3, luggage pickup and Tokyo leave-by time.');
 fs.writeFileSync(file,html);
}

let guideIndex=clean(read('guides/index.html'),'place-directory');
const directory=block('place-directory',`<section class="byf-place-directory" id="places"><p class="byf-kicker">40 DESTINATIONS, THREE AIRPORTS</p><h2>Find one last stop on your airport route</h2><p>Choose a place near your starting area, then use your flight and luggage to check the whole journey. These guides are alternatives; several stops in a row may not fit.</p>${Object.entries(airports).map(([code,name])=>`<h3>${name} departure options</h3><ul class="byf-destination-list">${Object.entries(visits).filter(([,v])=>v.airports.includes(code)).map(([slug,v])=>`<li><a href="/places/${slug}/">${esc(v.name)}</a></li>`).join('')}</ul>`).join('')}</section>`);
fs.writeFileSync('guides/index.html',guideIndex.replace('</main>',directory+'</main>'));

let home=clean(read('index.html'),'search-entry');
home=metadata(home,'What to Do Before Your Flight in Japan | Haneda, Narita & KIX','Use your flight time, luggage and starting area to find a last Tokyo or Osaka stop. Compare Haneda, Narita and KIX routes with a clear airport leave-by time.');
home=home.replace('</main>',block('search-entry',`<section class="byf-section"><h2>Start with the question on your mind</h2><div class="byf-guide-grid"><a href="/after-hotel-checkout-tokyo/"><h3>Checked out in Tokyo?</h3><p>Choose where to keep bags and what fits before Haneda or Narita.</p></a><a href="/guides/after-hotel-checkout-osaka/"><h3>Checked out in Osaka?</h3><p>Compare Namba, Umeda and the route to KIX.</p></a><a href="/guides/luggage-before-flight-japan/"><h3>Still carrying suitcases?</h3><p>Compare storage locations and collection deadlines before another stop.</p></a></div><p><a href="/guides/#places">Explore all 40 destination guides by airport →</a></p></section>`)+'</main>');
if(!home.includes('/assets/visit-context.js'))home=home.replace(/<script defer src="\/assets\/planner\.js/,`<script defer src="/assets/visit-context.js?v=${version}"></script><script defer src="/assets/planner.js`);
fs.writeFileSync('index.html',home);
fs.writeFileSync('assets/visit-context.js','window.BYF_VISITS='+JSON.stringify(visits)+';\n');

// Crosslink the question guides to the relevant airport and its place directory.
for(const file of fs.globSync('guides/*/index.html')){
 let html=clean(read(file),'guide-next');
 const codes=/osaka|kansai/.test(file)?['KIX']:/narita/.test(file)?['NRT']:/haneda/.test(file)?['HND']:['HND','NRT','KIX'];
 const self='/'+file.replace(/index.html$/,'');
 html=html.replace('</main>',block('guide-next',`<section class="byf-next-decisions"><h2>Choose the next step on this route</h2><ul>${codes.filter(code=>hubs[code]!==self).map(code=>`<li><a href="${hubs[code]}">${airports[code]}: compare the full route and a last stop</a></li>`).join('')}${self.includes('luggage-before')?'':'<li><a href="/guides/luggage-before-flight-japan/">Choose where bags will wait and when to collect them</a></li>'}<li><a href="/guides/#places">See every destination guide by airport</a></li></ul></section>`)+'</main>');
 fs.writeFileSync(file,html);
}

for(const file of allPages){
 let html=read(file);
 if(file.startsWith('plans/')){
  const route=data.plans.find(p=>new URL(p.url).pathname==='/'+file.replace('index.html',''));
  if(!route)throw Error('Missing route '+file);
  const minutes=core.totalMinutes(core.withLuggageStep(route,'none','',route.area).steps);
  html=html.replace(/<div class="byf-facts">([\s\S]*?)<\/div>/,(_,inner)=>{
   let index=0;return '<div class="byf-facts">'+inner.replace(/<span>[\s\S]*?<\/span>/g,span=>index++===1?`<span><b>${minutes} min</b> complete model</span>`:span)+'</div>';
  });
  html=html.replace(/(<dt>Time needed<\/dt><dd>)[\s\S]*?(<\/dd>)/,`$1${minutes} min complete model from ${esc(route.area)}, before airport-ready time; luggage and a different start can add time$2`);
  html=html.replace(/You have at least [^<]*before your recommended airport arrival time\./g,'Your available time covers the complete route, including luggage and the airport journey, before your airport-ready target.');
 }
 if(!html.includes('/assets/analytics.js'))html=html.replace('</head>',`<script defer src="/assets/analytics.js?v=${version}"></script></head>`);
 html=html.replace(/(\/assets\/(?:seo\.css|planner\.js|plan-context\.js)\?v=)[^"&]+/g,`$1${version}`);
 fs.writeFileSync(file,html);
}
// Only URLs whose editorial content changes receive a new lastmod.
let sitemap=read('sitemap.xml');
const changed=new Set(['/', '/guides/',...primaryFiles.map(f=>'/'+f.replace('index.html','')),...Object.keys(practical).map(slug=>`/places/${slug}/`),...fs.globSync('guides/*/index.html').map(f=>'/'+f.replace('index.html',''))]);
sitemap=sitemap.replace(/<url>([\s\S]*?)<\/url>/g,(whole,inside)=>{const url=inside.match(/<loc>(.*?)<\/loc>/)?.[1];if(!url||!changed.has(new URL(url).pathname))return whole;return `<url>${inside.replace(/<lastmod>.*?<\/lastmod>/g,'')}<lastmod>2026-10-27</lastmod></url>`;});
fs.writeFileSync('sitemap.xml',sitemap);
console.log(`Built ${Object.keys(visits).length} practical guides, airport directory, contextual CTAs, analytics and ${changed.size} editorial URLs.`);
