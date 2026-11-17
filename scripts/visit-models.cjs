// Export the actual planner routes for editorial pages. No new timing constants.
const fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.createContext(context);
for(const file of ['planner-data','planner-core','visit-context'])vm.runInContext(fs.readFileSync(`assets/${file}.js`,'utf8'),context);
const {BYFPlannerCore:core,BYF_STATIC_DATA:source,BYF_VISITS:visits}=context.window,data=core.enhanceData(source),out={};
for(const [slug,visit] of Object.entries(visits)){
 const byAirport={};for(const id of visit.ids){const plan=data.plans.find(p=>p.id===id);if(!plan)throw Error('Missing route '+id);
 const fit=core.withLuggageStep(plan,'none','',plan.area),steps=fit.steps;
 const row={id:plan.id,name:plan.name,airport:plan.airport,area:plan.area,starts:plan.starts,minutes:core.totalMinutes(steps),steps:steps.filter(s=>s.minutes>0).map(s=>({label:s.label,minutes:s.minutes})),url:new URL(plan.url).pathname,checked:plan.checked,strict:!!plan.strictStarts,interests:plan.interest};
 if(!byAirport[plan.airport]||row.minutes<byAirport[plan.airport].minutes)byAirport[plan.airport]=row;}
 out[slug]={name:visit.name,ids:visit.ids,routes:Object.values(byAirport)};
}
process.stdout.write(JSON.stringify(out));
