const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const {JSDOM}=createRequire(path.resolve(process.env.BYF_TEST_DEPS,'package.json'))('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},URL,URLSearchParams,Date,Intl};vm.createContext(ctx);for(const n of ['planner-data','planner-core','plan-context'])vm.runInContext(read('assets/'+n+'.js'),ctx);
const core=ctx.window.BYFPlannerCore,data=core.enhanceData(ctx.window.BYF_STATIC_DATA),present=ctx.window.BYFPlanPresentation;
const canonical=new Map();data.plans.forEach(p=>{const file=new URL(p.url).pathname.slice(1)+'index.html';if(!canonical.has(file))canonical.set(file,p)});
function compare(d,p,steps,start,target,label){
 const nodes=[...d.querySelectorAll('.byf-rich-step')];assert.equal(nodes.length,steps.length,label+' stage count');
 const total=core.totalMinutes(steps),fact=d.querySelectorAll('.byf-facts > span')[1];assert.match(fact.textContent,new RegExp('^'+total+' min'),label+' hero total');
 assert.match(d.querySelectorAll('.byf-plan-fit dd')[1].textContent,new RegExp('^'+total+' min'),label+' detail total');
 let cursor=+start,sum=0;
 nodes.forEach((n,i)=>{assert.equal(Number(n.dataset.minutes),steps[i].minutes,label+' minutes '+i);assert.equal(+new Date(n.dataset.startAt),cursor,label+' chronological start '+i);sum+=Number(n.dataset.minutes);cursor+=steps[i].minutes*60000;assert.equal(+new Date(n.dataset.endAt),cursor,label+' chronological end '+i);assert.equal(n.querySelector('h3').textContent,steps[i].label,label+' step label '+i);assert.equal(n.querySelectorAll('h4').length,0,'Repeated instruction headings removed');assert.ok(n.querySelector('p').textContent.length>80,label+' useful instruction');});
 assert.equal(sum,total);assert.equal(cursor,+start+total*60000);assert.ok(cursor<=+target,label+' protected target');
 assert.equal(+new Date(d.querySelector('[data-completed-at]').dataset.completedAt),cursor,label+' completion milestone');
}
let staticCount=0,personalCount=0,sourceStarts=0;
for(const [file,p]of canonical){
 const m=present.example(core,p,data),dom=new JSDOM(read(file)),d=dom.window.document;
 compare(d,p,m.steps,m.start,m.target,p.name+' static');
 assert.equal(d.querySelector('.byf-model').dataset.exampleDate,'2026-10-10');
 assert.ok(d.querySelector('.byf-model > h2+p').textContent.includes('10 October 2026'));
 assert.match(d.querySelector('meta[name=robots]').content,/noindex,follow/);
 const labelBefore=d.querySelector('.byf-rich-timeline').innerHTML;
 const live=new JSDOM(read(file),{url:p.url,runScripts:'outside-only'});
 for(const n of ['planner-data','planner-core','plan-context'])live.window.eval(read('assets/'+n+'.js'));
 compare(live.window.document,p,m.steps,m.start,m.target,p.name+' no-context runtime');
 assert.equal(live.window.document.querySelector('.byf-rich-timeline').innerHTML,labelBefore,p.name+' static/runtime equality');
 live.window.close();dom.window.close();staticCount++;
}
for(const p of data.plans){
 // Every accepted city start has its own modeled connector, or is the actual area.
 for(const startArea of Object.keys(data.areas))if(core.areaMatches(p,startArea)){
  if(!p.airportPlan)assert.ok(startArea===p.area||p.startConnectors?.[startArea],p.name+' unsupported free city connection');
  if(p.startConnectors?.[startArea])assert.equal(core.prepareSteps(p,startArea)[0].minutes,p.startConnectors[startArea].minutes);
  if(p.airportPlan&&startArea!==p.area){const travel=core.prepareSteps(p,startArea).find(core.isAirportTransferStep);assert.ok(travel&&travel.minutes>=core.airportTransferMinimum(p.airport,startArea),p.name+' start-to-airport allowance');}
  sourceStarts++;
 }
 for(const luggage of ['none','store_near_stop','return_elsewhere']){
  const fit=core.withLuggageStep(p,luggage,p.area,p.area);if(!fit.compatible)continue;
  const free=new Date('2026-10-10T08:00:00+09:00'),target=new Date('2026-10-10T20:30:00+09:00'),win=core.scheduleWindow(free,target,fit.steps,p);if(!win.valid)continue;
  const params=new URLSearchParams({byf_context:'1',plan_id:p.id,airport:p.airport,flight_at:'2026-10-10T23:30',free_at:'2026-10-10T08:00',start:p.area,luggage,luggage_area:p.area,needs:'standard',plan_start_at:win.latest.toISOString()});
  const file=new URL(p.url).pathname.slice(1)+'index.html',dom=new JSDOM(read(file),{url:p.url+'?'+params,runScripts:'outside-only'});
  for(const n of ['planner-data','planner-core','plan-context'])dom.window.eval(read('assets/'+n+'.js'));
  compare(dom.window.document,p,fit.steps,win.latest,target,p.name+' '+luggage);
  dom.window.close();personalCount++;
 }
}
const shin=data.plans.find(p=>p.id===27);assert.equal(core.areaMatches(shin,'Tokyo Station'),false);assert.equal(core.areaMatches(shin,'Ginza'),false);assert.equal(core.areaMatches(shin,'Shinagawa'),true);assert.equal(core.totalMinutes(core.withLuggageStep(shin,'none','','Shinagawa').steps),110);
for(const airportPlan of data.plans.filter(p=>p.airportPlan))for(const storage of Object.keys(data.areas)){
 const start=airportPlan.airport==='KIX'?'Namba':airportPlan.airport==='NRT'?'Tokyo Station':'Shinagawa';
 const f=core.withLuggageStep(airportPlan,'return_elsewhere',storage,start);if(!f.compatible)continue;
 const transfer=f.steps.find(core.isAirportTransferStep);if(transfer)assert.ok(transfer.minutes>=core.airportTransferMinimum(airportPlan.airport,storage),'Post-collection airport allowance '+storage);
}
const gallery=data.plans.find(p=>p.id===4006);assert.equal(core.scheduleWindow(new Date('2026-11-17T08:00:00+09:00'),new Date('2026-11-17T20:30:00+09:00'),gallery.steps,gallery).valid,false);
const invalidParams=new URLSearchParams({byf_context:'1',plan_id:'27',airport:'HND',flight_at:'2026-11-20T23:30',free_at:'2026-11-20T08:00',start:'Tokyo Station',luggage:'none',needs:'standard'});
const bad=new JSDOM(read('plans/shinagawa-short-stop-before-haneda/index.html'),{url:shin.url+'?'+invalidParams,runScripts:'outside-only'});for(const n of ['planner-data','planner-core','plan-context'])bad.window.eval(read('assets/'+n+'.js'));
assert.match(bad.window.document.querySelector('.byf-alert').textContent,/no longer fits/);assert.match(bad.window.document.querySelector('.byf-model').textContent,/10 October 2026/);bad.window.close();
console.log(`Verified ${staticCount} static and no-context runtime timelines, ${personalCount} personalized luggage variants, ${sourceStarts} supported starts, connector accounting, stale saved start rejection and gallery date closure.`);
