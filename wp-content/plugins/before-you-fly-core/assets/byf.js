(function(){
  if(!window.BYF_DATA)return;
  const track=(event,data={})=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,...data});};
  if(BYF_DATA.isPlan)track('plan_viewed',{plan_id:BYF_DATA.planId});
  document.addEventListener('click',e=>{const target=e.target.closest('[data-event]');if(target)track(target.dataset.event,{link_url:target.href||''});});
  const form=document.getElementById('byf-form');if(!form)return;
  const out=document.getElementById('byf-results');
  const fmt=d=>new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Tokyo'}).format(d);
  const fmtDate=d=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Tokyo'}).format(d);
  const weekday=d=>new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Asia/Tokyo'}).format(d);
  const onFreeDate=(free,hhmm)=>{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tokyo'}).formatToParts(free).reduce((o,p)=>(o[p.type]=p.value,o),{});return new Date(parts.year+'-'+parts.month+'-'+parts.day+'T'+hhmm+':00+09:00');};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const areaMatch=(p,start)=>p.starts.includes(start)||(start==='Tokyo Station'&&p.starts.includes('Tokyo'))||(start==='Odaiba'&&/odaiba/i.test(p.name));
  const inferredArea=p=>Object.keys(BYF_DATA.areas||{}).find(a=>a!=='Tokyo'&&p.name.toLowerCase().includes(a.toLowerCase()))||'Tokyo';
  const proximity=(p,start)=>{const dest=inferredArea(p);if(dest===start)return 35;const a=BYF_DATA.areas[start],b=BYF_DATA.areas[dest];if(!a||!b)return 0;if(a.corridor===b.corridor)return 22;if(a.region===b.region)return 6;return -20;};
  const luggageLocation=form.querySelector('.byf-luggage-location'),luggageSelect=form.elements.luggage_area,luggageQuestion=form.querySelector('.byf-luggage-question');
  const updateLuggage=()=>{const chosen=form.querySelector('[name="luggage"]:checked')?.value||'';const stored=chosen==='stored_hotel'||chosen==='stored_locker';luggageLocation.hidden=!stored;luggageSelect.required=stored;if(!stored)luggageSelect.value='';luggageQuestion.textContent=chosen==='stored_hotel'?'Where is your hotel?':'Where will you pick up your luggage?';};
  form.querySelectorAll('[name="luggage"]').forEach(el=>el.addEventListener('change',updateLuggage));
  let started=false;form.addEventListener('change',()=>{if(!started){started=true;track('planner_start');}});
  form.addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(form),airport=f.get('airport'),a=BYF_DATA.airports[airport];
    if(!a){out.innerHTML='<section class="byf-no"><h2>Choose an available airport.</h2></section>';return;}
    const flight=new Date(f.get('flight_at')+':00+09:00'),free=new Date(f.get('free_at')+':00+09:00');
    if(!Number.isFinite(flight.getTime())||!Number.isFinite(free.getTime())||flight<=free){out.innerHTML='<section class="byf-no"><h2>Check your flight and free-time dates.</h2></section>';return;}
    const recommended=new Date(flight.getTime()-a.buffer*60000),available=Math.floor((recommended-free)/60000),start=f.get('start'),luggage=f.get('luggage'),luggageArea=f.get('luggage_area')||'',interest=f.get('interest')||'';
    if((luggage==='stored_hotel'||luggage==='stored_locker')&&!luggageArea){out.innerHTML='<section class="byf-no"><h2>Choose where you will pick up your luggage.</h2></section>';return;}
    const pickupExtra=(luggage==='stored_hotel'||luggage==='stored_locker')?(45+20):0;
    let plans=BYF_DATA.plans.filter(p=>{
      const stepTotal=p.steps.reduce((sum,x)=>sum+x.minutes,0),total=stepTotal+pickupExtra,earliest=new Date(Math.max(free.getTime(),onFreeDate(free,p.startMin).getTime())),latest=new Date(Math.min(recommended.getTime()-total*60000,onFreeDate(free,p.startMax).getTime())),dayOk=!p.days||/daily/i.test(p.days)||p.days.split(',').map(x=>x.trim().slice(0,3)).includes(weekday(free)),luggageOk=luggage==='none'||((luggage==='stored_hotel'||luggage==='stored_locker')&&p.luggage!=='no')||(luggage==='with_me'&&p.luggage==='yes');
      p._start=latest;p._pickupExtra=pickupExtra;p._score=(interest&&p.interest.includes(interest)?60:0)+proximity(p,start)+(p.interest.includes('Relax')&&interest==='Relax'?25:0)-Math.max(0,total-available)/5;
      return p.airport===airport&&areaMatch(p,start)&&p.min+pickupExtra<=available&&luggageOk&&dayOk&&earliest<=latest;
    });
    plans.sort((x,y)=>y._score-x._score||Math.abs(available-x.recommended)-Math.abs(available-y.recommended));
    if(available<=0||!plans.length){const live=a.transport?'<a class="byf-submit byf-no-primary" target="_blank" rel="noopener" href="'+esc(a.transport)+'">Check a live route to the airport →</a>':'';const nearUrls={HND:'https://tokyo-haneda.com/en/',NRT:'https://www.narita-airport.jp/en/',KIX:'https://www.kansai-airport.or.jp/en/'};const near=nearUrls[airport]?'<a class="byf-no-secondary" target="_blank" rel="noopener" href="'+esc(nearUrls[airport])+'">See options near the airport →</a>':'';out.innerHTML='<section class="byf-no"><p class="byf-kicker">NO VERIFIED CITY PLAN</p><h2>Stay closer to the airport.</h2><p>'+esc(BYF_DATA.messages.noPlan)+'</p><div class="byf-timebar"><b>'+fmtDate(recommended)+'</b><span>Recommended airport arrival</span><b>'+fmtDate(flight)+'</b><span>Your flight</span></div><div class="byf-actions">'+live+near+'<a href="#planner">Change my conditions</a></div></section>';track('no_plan_found',{airport,starting_area:start,available_minutes:available,luggage_state:luggage,interest});out.scrollIntoView({behavior:'smooth'});return;}
    out.innerHTML='<div class="byf-result-head"><p class="byf-kicker">YOUR OPTIONS</p><h2>Your comfortable sightseeing window</h2><div class="byf-window"><strong>'+Math.floor(available/60)+' hr '+(available%60)+' min</strong><span>'+fmtDate(free)+' → '+fmtDate(recommended)+'</span></div></div>'+plans.slice(0,3).map((p,i)=>{
      let cursor=new Date(p._start),leaveAt=null;for(const step of p.steps){const at=new Date(cursor);if(/head to (haneda|narita|kansai) airport|travel to (haneda|narita|kansai) airport|proceed to airline check-in/i.test(step.label)&&!leaveAt)leaveAt=at;cursor=new Date(cursor.getTime()+step.minutes*60000);}if(!leaveAt)leaveAt=p._start;
      const luggageLabel=p.luggage==='yes'?'Works with luggage':(luggage==='stored_hotel'?'Returns to your hotel':(luggage==='stored_locker'?'Includes luggage pickup':(p.luggage==='stored'?'Store large luggage first':'Best without luggage')));
      const reasons=[];if(proximity(p,start)>=20)reasons.push('Close to '+start);if(interest&&p.interest.includes(interest))reasons.push('Matches '+interest);if(luggage==='stored_hotel'||luggage==='stored_locker')reasons.push('Pickup route included');if(!reasons.length)reasons.push('Fits your available time');reasons.push('Airport buffer protected');
      const params=new URLSearchParams({byf_context:'1',airport,flight_at:f.get('flight_at'),free_at:f.get('free_at'),start,luggage,luggage_area:luggageArea,interest});
      return '<article class="byf-card"><div class="byf-card-top"><span>'+esc(i===0?'Best fit':p.type)+'</span><small>Checked '+esc(p.checked)+'</small></div><h3>'+esc(p.name)+'</h3><p class="byf-card-hook"><b>Why go:</b> '+esc(p.hook)+'</p><p class="byf-fit-reason"><b>Why this fits:</b> '+esc(reasons.slice(0,3).join(' • '))+'</p><div class="byf-card-facts"><span><b>'+Math.floor((p.recommended+p._pickupExtra)/60)+' hr '+((p.recommended+p._pickupExtra)%60)+' min</b>recommended</span><span><b>'+esc(luggageLabel)+'</b>luggage</span><span><b>'+esc(p.interest.slice(0,2).join(' · '))+'</b>experience</span></div><div class="byf-card-times"><span><small>Start this plan by</small><b>'+fmtDate(p._start)+'</b></span><span><small>Leave the final stop by</small><b>'+fmtDate(leaveAt)+'</b></span><span><small>Recommended airport arrival</small><b>'+fmtDate(recommended)+'</b></span></div><p class="byf-card-arrival"><b>'+fmtDate(flight)+'</b> flight</p><div class="byf-actions"><a data-plan-id="'+p.id+'" href="'+esc(p.url)+'?'+esc(params.toString())+'">View plan details</a><a class="byf-live-link" target="_blank" rel="noopener" href="'+esc(p.live)+'">Check live transport ↗</a></div></article>';
    }).join('');
    out.scrollIntoView({behavior:'smooth'});track('planner_complete',{airport,available_minutes:available,results:plans.length});
  });
  out.addEventListener('click',e=>{const plan=e.target.closest('[data-plan-id]');if(plan)track('plan_selected',{plan_id:Number(plan.dataset.planId)});if(e.target.closest('.byf-live-link'))track('live_transport_click');});
})();