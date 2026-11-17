/* Build all no-parameter plan pages from the same presentation and timing
 * functions used by personalization. No credentials or network calls. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const deps=process.env.BYF_TEST_DEPS;
if(!deps)throw new Error('Set BYF_TEST_DEPS to a directory containing jsdom.');
const {JSDOM}=createRequire(path.resolve(deps,'package.json'))('jsdom');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},URL,URLSearchParams,Intl,Date};vm.createContext(ctx);
for(const name of ['planner-data','planner-core','plan-context'])vm.runInContext(read('assets/'+name+'.js'),ctx);
const core=ctx.window.BYFPlannerCore,data=core.enhanceData(ctx.window.BYF_STATIC_DATA),presents=ctx.window.BYFPlanPresentation;
const canonical=new Map();for(const plan of data.plans){const relative=new URL(plan.url).pathname.slice(1)+'index.html';if(!canonical.has(relative))canonical.set(relative,plan);}
let rebuilt=0;
for(const [relative,plan] of canonical){
 const {window:w}=new JSDOM(read(relative)),d=w.document;
 const model=presents.example(core,plan,data),{flight,target,start,steps}=model,total=core.totalMinutes(steps),timing=core.timingFacts(steps,start,plan.airportPlan);
 const set=(selector,value)=>{const el=d.querySelector(selector);if(el)el.textContent=value;};
 set('.byf-plan-hero h1',plan.name);
 set('.byf-plan-hero > .byf-kicker','WORKED ROUTE EXAMPLE · '+plan.airport);
 set('.byf-plan-hero > p:not(.byf-kicker)',plan.hook.replace(/^./,c=>c.toUpperCase()).replace(/[.]+$/,'')+'.');
 const fact=d.querySelectorAll('.byf-facts > span')[1];if(fact)fact.innerHTML='<b>'+total+' min</b> complete model';
 d.querySelector('.byf-key-times').innerHTML=presents.keyTimes(core,plan,steps,start,flight,target);
 const cta=d.querySelector('.byf-plan-hero .byf-submit');
 if(cta)cta.setAttribute('href','/?'+new URLSearchParams({airport:plan.airport,start:plan.area})+'#planner');
 set('.byf-experience h2','What this route gives you');
 set('.byf-experience-lead',presents.intention[plan.area]||plan.hook);
 d.querySelector('.byf-memory')?.remove();
 const fit=d.querySelector('.byf-plan-fit'),definitions=fit.querySelectorAll('dd');
 definitions[0].textContent=plan.starts.join(', ');
 definitions[1].textContent=`${total} min complete model from ${plan.area}, before airport-ready time; luggage and a different supported start can add time`;
 definitions[2].textContent=plan.strictStarts?'The entered date is checked against the authored opening and admission limits.':`${plan.startMin}–${plan.startMax} JST · ${plan.days}. These are model start limits, not a promise every shop is open.`;
 definitions[3].textContent='This worked example has no luggage detour. Enter storage near the stop or a return elsewhere to include its collection allowance.';
 const lists=fit.querySelectorAll('ul');
 if(lists[0])lists[0].innerHTML=`<li>You can begin in ${presents.escape(plan.area)}${Object.keys(plan.startConnectors||{}).length?' or use one of the explicitly supported connections listed above':''}.</li><li>You want the named route and can finish every stage before the displayed airport-ready target.</li><li>You are willing to shorten or skip the local visit when a queue or transport change uses the spare time.</li>`;
 if(lists[1])lists[1].innerHTML='<li>Your starting area or hotel collection route is not supported by the calculation.</li><li>Your airline requires an earlier arrival, or the live journey is longer than the allowance.</li><li>A specific ticket, accessible entrance or opening date you need has not been confirmed.</li>';
 const el=d.querySelector('.byf-model');el.dataset.exampleDate='2026-10-10';el.dataset.planId=plan.id;el.dataset.startArea=plan.area;el.dataset.luggageMode='none';el.dataset.startAt=start.toISOString();el.dataset.targetAt=target.toISOString();el.dataset.flightAt=flight.toISOString();
 set('.byf-model > .byf-kicker','DATED WORKED EXAMPLE · ALL TIMES JST');
 set('.byf-model > h2',`Example timeline · ${presents.stamp(flight)} ${plan.airport} flight`);
 set('.byf-model > h2 + p',`Worked example for 10 October 2026, beginning in ${plan.area} with no luggage detour. It illustrates the checked model and is not a current opening-hours or train-service promise. Enter your actual travel date to check availability.`);
 if(plan.id===4006){
  const notice=d.createElement('p');notice.className='byf-example-availability';notice.textContent='This gallery example uses the exhibition calendar verified for 19 September–8 November 2026. The planner will not offer this visit outside that window until the calendar is reviewed. The station exterior remains a separate alternative.';
  el.querySelector('.byf-example-availability')?.remove();el.querySelector('.byf-rich-timeline').before(notice);
 }
 d.querySelector('.byf-rich-timeline').innerHTML=presents.timeline(core,plan,steps,start);
 const alert=d.querySelector('.byf-plan-body > .byf-alert');
 if(alert)alert.innerHTML='<b>How to read the allowances</b><p>The stage minutes include the walking, waiting, visit and connection budget assigned by this model. They are not a live timetable or a promise of a seat, locker or ticket. The route ends before a separate 180-minute international-flight planning target; follow any earlier airline instruction.</p>';
 const source=d.querySelector('.byf-source small');if(source)source.textContent=`Route-source review recorded: ${plan.checked}. Example arithmetic and page consistency rebuilt: 17 November 2026. The arithmetic rebuild is not a new on-site verification.`;
 const met=d.querySelector('meta[name="description"]');if(met)met.content=`${plan.name}: a dated local-stop example with the complete journey, luggage conditions and an airport-ready target.`;
 const og=d.querySelector('meta[property="og:description"]');if(og&&met)og.content=met.content;
 for(const script of d.querySelectorAll('script[src*="plan-context.js"],script[src*="planner-core.js"]'))script.src=script.getAttribute('src').replace(/\?v=.*/,'?v=20261117-1');
 fs.writeFileSync(path.join(root,relative),'<!doctype html>\n'+d.documentElement.outerHTML+'\n');
 w.close();rebuilt++;
}
console.log(`Rebuilt ${rebuilt} dated plan examples from enhanced engine steps and shared presentation functions.`);
module.exports={canonical};
