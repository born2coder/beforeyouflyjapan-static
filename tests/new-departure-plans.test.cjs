const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let actualAssertions=0;for(const key of ['ok','equal']){const original=assert[key];assert[key]=(...args)=>{actualAssertions++;return original(...args);};}
const c={window:{}};vm.createContext(c);for(const f of ['planner-data','planner-core'])vm.runInContext(fs.readFileSync(`assets/${f}.js`,'utf8'),c);
const core=c.window.BYFPlannerCore,data=core.enhanceData(c.window.BYF_STATIC_DATA);
// Independent route budgets: approach + experience + return + airport journey + terminal/margin.
const expected=[210,190,210,275,210,240,335,205,225,250];
const stamp=(date,time)=>new Date(`${date}T${time}:00+09:00`);
const results=[];let checks=0;
for(let i=0;i<10;i++){
 const p=data.plans.find(p=>p.id===4001+i);assert.ok(p);assert.equal(core.totalMinutes(p.steps),expected[i]);checks++;
 assert.equal(core.areaMatches(p,p.starts[0]),true);assert.equal(core.areaMatches(p,'Nihonbashi'),false);checks+=2;
 for(const start of p.starts){
  const connector=p.startConnectors?.[start]?.minutes||0;
  for(const mode of ['none','store_near_stop','return_elsewhere']){
   const fit=core.withLuggageStep(p,mode,p.area,start),steps=fit.steps;
   assert.ok(fit.compatible);
   const extra=mode==='none'?0:mode==='store_near_stop'?(start===p.area?35:40):35;
   assert.equal(core.totalMinutes(steps),expected[i]+connector+extra,`route ${p.id} ${start} ${mode}: all travel + collection retained`);
   const free=stamp('2026-10-10','12:00'),target=new Date(+free+(expected[i]+connector+extra)*60000);
   let w=core.scheduleWindow(free,target,steps,p);assert.ok(w.valid,`route ${p.id}: exact available budget`);assert.equal(+w.latest,+free);
   const t=core.timingFacts(steps,w.latest,false);assert.equal(+t.readyAt,+target);assert.ok(t.airportArrivalAt<t.readyAt);
   assert.equal(core.scheduleWindow(free,new Date(+target-60000),steps,p).valid,false,'one minute too little must reject');
   let cursor=w.latest;for(const step of steps){const h=core.stageHours(step,free),end=new Date(+cursor+step.minutes*60000);if(h){assert.ok(cursor>=core.onJstDate(free,h[0]));assert.ok(end<=core.onJstDate(free,h[1]));}if(step.lastEntry)assert.ok(cursor<=core.onJstDate(free,step.lastEntry));cursor=end;}
   if(mode!=='none'){const pickup=steps.findIndex(s=>s.isPickup);assert.ok(pickup<steps.findIndex(core.isAirportTransferStep));if(mode==='store_near_stop')assert.ok(steps.findIndex(s=>s.isStorageDrop)<pickup);}
   assert.equal(core.withLuggageStep(p,'return_elsewhere',p.airport==='HND'?'Namba':'Shinjuku',start).compatible,false);
   checks+=10;
  }
 }
 const free=stamp('2026-10-10','19:00'),late=stamp('2026-10-11','00:30');assert.equal(core.scheduleWindow(free,late,p.steps,p).valid,false);checks++;
 // Visit completion must fit closing, independent of a later flight.
 const visit=p.steps.find(s=>s.hours),date=stamp('2026-10-10','08:00'),w=core.scheduleWindow(date,stamp('2026-10-10','23:00'),p.steps,p);
 assert.ok(w.valid);let cursor=w.latest;for(const s of p.steps){if(s===visit)assert.ok(+cursor+s.minutes*60000<=+core.onJstDate(date,core.stageHours(s,date)[1]));cursor=new Date(+cursor+s.minutes*60000);}checks++;
 results.push({id:p.id,name:p.name,baseMinutes:expected[i],sameAreaStorageMinutes:expected[i]+35,airportBufferMinutes:180});
}
const get=id=>data.plans.find(p=>p.id===id);const valid=(id,date)=>core.scheduleWindow(stamp(date,'10:00'),stamp(date,'22:00'),get(id).steps,get(id)).valid;
assert.equal(valid(4006,'2026-10-12'),true);assert.equal(valid(4006,'2026-10-13'),false);assert.equal(valid(4006,'2026-10-19'),false);assert.equal(valid(4006,'2026-11-09'),false);
assert.equal(valid(4007,'2026-10-12'),true);assert.equal(valid(4007,'2026-10-13'),true);assert.equal(valid(4007,'2026-10-26'),false);assert.equal(valid(4007,'2026-12-30'),false);assert.equal(valid(4007,'2027-01-02'),true);assert.equal(valid(4007,'2028-01-10'),false);
assert.equal(valid(4010,'2026-10-12'),true);assert.equal(valid(4010,'2026-10-13'),false);assert.equal(valid(4010,'2026-10-19'),false);
assert.equal(core.stageHours(get(4001).steps[1],stamp('2026-07-10','10:00'))[1],'17:00');assert.equal(core.stageHours(get(4001).steps[1],stamp('2026-12-10','10:00'))[1],'16:00');
for(const id of [4006,4007]){assert.ok(core.supportsNeeds(get(id),'stroller'));const steps=core.withTravelNeeds(get(id).steps,'stroller');assert.equal(core.totalMinutes(steps),expected[id-4001]+20);}
const f=core.withLuggageStep(get(4007),'store_near_stop','','Tokyo Station');assert.equal(f.steps[0].storageArea,'Tokyo Station');assert.ok(f.steps.find(s=>/Return to Tokyo Station/.test(s.label)));assert.equal(f.steps.find(s=>s.isPickup).storageArea,'Tokyo Station');
// JST dates must be used even when UTC is still the preceding day.
assert.equal(core.calendarAllows(get(4006).steps[1].calendar,new Date('2026-10-12T00:00:00+09:00')),true);assert.equal(core.calendarAllows(get(4006).steps[1].calendar,new Date('2026-10-13T00:00:00+09:00')),false);
checks=actualAssertions;fs.writeFileSync('audit/new-plan-timing-evidence.json',JSON.stringify({checks,results},null,2));console.log(`Passed ${checks} assertions across all 10 new plans, luggage/start variants, 1-minute boundaries, hours, holidays, family time and JST.`);
