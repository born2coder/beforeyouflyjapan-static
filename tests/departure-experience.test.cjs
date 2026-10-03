const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={window:{}};vm.createContext(c);for(const file of ['planner-data','planner-core'])vm.runInContext(fs.readFileSync(`assets/${file}.js`,'utf8'),c);
const core=c.window.BYFPlannerCore,data=core.enhanceData(c.window.BYF_STATIC_DATA);
// The same twenty travel situations used in the original simulated UX audit.
const cases=[
['HND',23,11,'Shinjuku','return_elsewhere','Shinjuku','Culture'],
['HND',14,8,'Shinagawa','none','','Food'],
['HND',20,11,'Ginza','store_near_stop','','Food'],
['HND',21,12,'Shibuya','none','','Shopping'],
['HND',19,11,'Ueno','return_elsewhere','Shinjuku','Culture'],
['HND',18,11,'Tokyo Station','none','','Relax'],
['HND',22,12,'Shinjuku','none','','Anime / Pop Culture'],
['HND',20,11,'Odaiba','store_near_stop','','Waterfront'],
['NRT',20,11,'Ueno','return_elsewhere','Ueno','Culture'],
['NRT',18,11,'Shinjuku','none','','Food'],
['NRT',17,9,'Narita','store_near_stop','','Culture'],
['NRT',16,11,'Narita Airport','none','','Shopping'],
['KIX',20,11,'Namba','return_elsewhere','Namba','Food'],
['KIX',18,11,'Umeda','none','','Shopping'],
['KIX',16,10,'Rinku Town','store_near_stop','','Shopping'],
['HND',15,12,'Shinjuku','return_elsewhere','Shinjuku',''],
['HND',0.5,14,'Asakusa','none','','Culture','standard',true],
['HND',21,11,'Tokyo Station','store_near_stop','','Culture','stroller'],
['HND',18,11,'Shinagawa','none','','Relax','low_walk'],
['KIX',20,11,'Namba','store_near_stop','','Culture']];
const results=[];
for(const [i,values] of cases.entries()){
const [airport,hour,freeHour,start,luggage,luggageArea,interest,needs='standard',nextDay=false]=values;
const flight=new Date(`2026-10-${nextDay?'11':'10'}T${String(Math.floor(hour)).padStart(2,'0')}:${hour%1?'30':'00'}:00+09:00`),free=new Date(`2026-10-10T${String(freeHour).padStart(2,'0')}:00:00+09:00`),ready=new Date(+flight-data.airports[airport].buffer*60000),available=(ready-free)/60000;
const candidates=data.plans.flatMap(plan=>{
 if(plan.airport!==airport||!core.areaMatches(plan,start)||!core.supportsNeeds(plan,needs))return [];
 const fit=core.withLuggageStep(plan,luggage,luggageArea,start);if(!fit.compatible)return [];
 const steps=core.withTravelNeeds(fit.steps,needs),total=core.totalMinutes(steps),window=core.scheduleWindow(free,ready,steps,plan);
 const day=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Asia/Tokyo'}).format(free);
 if(!window.valid||total>available||(!/daily/i.test(plan.days)&&!plan.days.includes(day)))return [];
 return [{plan,steps,window,total,score:core.scorePlan(plan,{startArea:start,interest,luggageMode:fit.mode,luggageArea,total,available})}];
}).sort((a,b)=>b.score-a.score||Math.abs(available-a.total)-Math.abs(available-b.total));
for(const x of candidates.slice(0,3)){
 const timing=core.timingFacts(x.steps,x.window.latest,x.plan.airportPlan);assert.ok(timing.readyAt<=ready,`case ${i+1}: airport target`);
 let cursor=x.window.latest;
 for(const step of x.steps){const hours=core.stageHours(step,free),end=new Date(+cursor+step.minutes*60000);if(hours){assert.ok(cursor>=core.onJstDate(free,hours[0]));assert.ok(end<=core.onJstDate(free,hours[1]));}cursor=end;}
 if(needs!=='standard')assert.ok(x.steps.some(s=>s.isRest),'rest allowance missing');
}
results.push({persona:i+1,airport,start,needs,topPlan:candidates[0]?.plan.id||null,match:!!candidates[0]?.plan.interest.includes(interest),fallback:candidates.length===0});
if(i===15){assert.equal(candidates.length,0);assert.ok(core.fallbackTiming(airport,start,luggage,luggageArea,ready,free).urgent);}
}
const kappa=data.plans.find(x=>x.id===251),steps=core.withLuggageStep(kappa,'store_near_stop','','Asakusa').steps,free=new Date('2026-10-10T14:00:00+09:00'),ready=new Date('2026-10-10T21:30:00+09:00');
assert.equal(core.scheduleWindow(free,ready,steps,kappa).valid,false,'late retail visit with luggage must be rejected');
const meiji=data.plans.find(x=>x.id===96);
for(let month=1;month<=12;month++){
 const date=new Date(`2026-${String(month).padStart(2,'0')}-10T07:00:00+09:00`),target=new Date(+date+14*3600000),w=core.scheduleWindow(date,target,meiji.steps,meiji);
 assert.ok(w.valid);let cursor=w.latest;for(const s of meiji.steps){let end=new Date(+cursor+s.minutes*60000);if(/Visit Meiji/.test(s.label))assert.ok(end<=core.onJstDate(date,core.stageHours(s,date)[1]));cursor=end;}
}
assert.equal(core.fallbackTiming('HND','Namba','none','',ready,free).known,false);
console.log(JSON.stringify(results,null,2));console.log('Passed 20 UX personas, stage-hour constraints in all 12 months, rest and urgent fallback checks.');
