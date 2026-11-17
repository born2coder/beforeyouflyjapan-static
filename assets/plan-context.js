(function () {
  "use strict";

  // Shared by the static renderer and the browser. Durations and stage times
  // always come from the enhanced planner engine, not a second HTML template.
  const presentation = (() => {
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    const clock = date => new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Tokyo'}).format(date);
    const stamp = date => new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Tokyo'}).format(date);
    const intention = {
      Shinagawa:'Use the station for a meal and one small purchase, with the Keikyu departure route close at hand. ecute is inside the JR gates; choose an outside-gate alternative if you are not entitled to enter.',
      'Tokyo Station':'See the Marunouchi red-brick frontage, then choose one shopping zone. Tokyo Character Street is on the Yaesu / First Avenue side outside JR gates; GRANSTA shops can be inside the gates.',
      Ginza:'Keep the visit around the Ginza 4-chome crossing and one food or shopping destination such as Ginza Mitsukoshi. A restaurant queue is a reason to shorten the browse, not delay the airport trip.',
      Shibuya:'Use Hachiko and the scramble crossing for orientation, then choose a nearby café or shop. A timed rooftop attraction is a separate commitment; do not join a ticket queue without time to finish it.',
      Harajuku:'Use the Takeshita Street side for fashion shopping, then follow the named street stages. Meiji Jingu is a separate shrine route with seasonal closing limits; this shopping stage does not include it.',
      Hamamatsucho:'Use Zojoji and the Tokyo Tower exterior as the compact visit. Going up the tower is a separate paid activity; skip it if the queue would take the airport-transfer time.',
      Roppongi:'Choose one public-space or café stop in the Roppongi / Azabudai corridor. Observation facilities have separate tickets and opening rules; the street walk does not include their admission.',
      Ueno:'For a station-side food visit, keep to Ameyoko and the route back to your airport train. A park museum is another timed activity, not an automatic addition to this market stop.',
      Asakusa:'Follow Kaminarimon, Nakamise and the Sensoji approach, then return to the station for your airport route. The grounds, main hall and individual shops have different hours.',
      Akihabara:'Make Radio Kaikan or one other named shop the main shopping target. Leave time for checkout and packing rather than trying to cover every floor and another building.',
      Tsukiji:'Use the outer-market lanes for one food priority and a small browse. The market calendar and individual shop hours matter; Toyosu is a different location and is not part of this stop.',
      Toyosu:'Choose the market visitor area or a bay-side walk, according to what is open. This route does not include entry to a tuna-auction viewing programme or a reserved attraction.',
      Nihonbashi:'See Nihonbashi Bridge, then make one food or craft stop toward COREDO Muromachi. The bridge itself is a short public-street visit; department-store browsing needs its own time.',
      Jimbocho:'Start with one subject or kind of book in the Jimbocho bookshop district. A compact browse beats crossing between many specialist shops whose hours can differ.',
      Odaiba:'Choose Odaiba Marine Park for a bay view or one indoor shopping building in poor weather. Keep the final stop on the side of the station used for the airport route.',
      Narita:'Use Narita Omotesando for a short food-and-street visit, with Naritasan as the priority only when the separate temple stage fits. The sloping return to the station needs time.',
      Namba:'Keep the visit in Minami around Nankai Namba, Hozenji or Ebisubashi according to the route. Return to Nankai Namba for the airport train; Osaka Metro Namba is not the same platform.',
      Umeda:'Stay within the Osaka Station City / Umeda station complex for a meal, food shopping or a short public-space pause. Umeda Sky Building is a separate walk and ticketed visit.',
      Omotesando:'Choose Omotesando Hills or one design shop on the avenue. Keep checkout and packing inside the visit allowance and use your actual return station.',
      'Rinku Town':'Choose one outlet zone or a short Rinku Park sea view. Return to Rinku Town station for the airport-bound service; allow for the separate T2 shuttle if your flight needs it.',
      'Haneda Airport':'Stay in your airline’s departure terminal. For T3, Edo Ko-ji and the observation deck are on the public side; a T2 flight is not a reason to travel to T3 for a meal.',
      'Narita Airport':'Stay in the terminal used by your flight, with a meal or souvenir shop near the next required procedure. Do not add a Narita town excursion after arriving at the airport.',
      'Kansai Airport':'Stay in your departure terminal or Aeroplaza as appropriate. Sky View is a separate excursion with transport and opening constraints; it is not built into this meal stop.'
    };
    const names = ['Tokyo Station','Shinagawa','Ginza','Shibuya','Harajuku','Hamamatsucho','Roppongi','Ueno','Asakusa','Akihabara','Tsukiji','Toyosu','Nihonbashi','Jimbocho','Odaiba','Narita','Namba','Umeda','Rinku Town','Omotesando'];
    function stageArea(plan, steps, index) {
      let area=plan.area;
      for(let i=0;i<=index;i++) {
        const label=steps[i].label || '';
        if(/airport/i.test(label)) continue;
        const found=names.find(n=>label.toLowerCase().includes(n.toLowerCase()));
        if(found)area=found;
      }
      return area;
    }
    function airportRoute(airport,area) {
      if(airport==='KIX') return area==='Umeda' ? 'From JR Osaka, compare the airport-bound JR service with the official airport bus from the stop you can actually reach. Confirm T1 or the Aeroplaza shuttle connection for T2; station arrival is not T2 counter arrival.' : area==='Rinku Town' ? 'Use an airport-bound train from Rinku Town. Kansai-airport Station serves T1 / Aeroplaza; T2 requires its free shuttle, plus walking and waiting.' : 'Use the Nankai airport route from Nankai Namba. Check the train destination and your terminal; after Kansai-airport Station, T2 needs the Aeroplaza shuttle.';
      if(airport==='NRT') return /Narita/.test(area) ? 'From JR Narita or Keisei Narita, use the airport-bound service for your terminal. T3 passengers use Airport Terminal 2 station, then the signed walk or shuttle; do not stop the calculation at the railway gate.' : /Ueno|Akihabara/.test(area) ? 'Compare Keisei from Keisei-Ueno with the airport route from your exact position. JR Ueno and Keisei-Ueno are different stations; include the walk before a reserved train.' : 'From Tokyo Station, compare Narita Express with the official airport-bus departure point. Another starting area needs its own live connection. Match the terminal station, then allow the path to your airline counter.';
      return area==='Shinagawa' ? 'Follow the Keikyu airport route from Shinagawa and check the train destination before boarding. Use your flight’s HND terminal station; the JR and Keikyu gates are different.' : area==='Hamamatsucho' ? 'Follow the Tokyo Monorail connection at Hamamatsucho and use the station for your flight’s terminal. Include the platform wait and the walk from the airport station to the airline area.' : 'Compare the route via Shinagawa and Keikyu with the Tokyo Monorail via Hamamatsucho from the actual last stop. Check your Haneda terminal station and the train destination; a rail ride alone is not the full allowance.';
    }
    function directions(core,plan,steps,index,storageArea) {
      const step=steps[index],label=step.label||'',area=stageArea(plan,steps,index);
      if(step.isStorageDrop)return `Leave bags at a suitable locker or staffed counter in ${step.storageArea||storageArea||plan.area}. Note its gate side and collection limit before walking away. If there is no suitable compartment, shorten the stop rather than search across another station.`;
      if(step.isPickup)return `Collect all bags at ${step.storageArea||storageArea||plan.area} and keep the collection receipt available. This stage includes the modeled return/pickup allowance; an exact hotel or locker route can take longer. Start the airport journey when this stage ends.`;
      if(core.isAirportTransferStep(step))return airportRoute(plan.airport,area)+` The ${Number(step.minutes||0)} minutes shown are the route’s planning allowance, including its assigned walking, waiting and connections; they are not a published train ride or guaranteed departure.`;
      if(/^Arrive at .*Airport/i.test(label))return 'The modeled airport journey is complete. Follow signs to the correct terminal and airline counter; any separately shown terminal-navigation stage still comes next. Keep the airline’s required arrival and boarding times ahead of optional shopping.';
      if(/margin|disruption|terminal navigation/i.test(label))return step.action||'Use this allowance for the path to the correct terminal/counter, a missed connection or a small delay. It is deliberately not assigned to another attraction.';
      if(/terminal and airline|check-in|security/i.test(label))return step.action||'Read the departure display for the flight number, terminal and counter. Confirm when the airline accepts check-in and baggage before choosing a public-area activity. If already after security, use facilities near the gate.';
      if(step.action && !/Follow the checked entrance route|Return along the checked route/i.test(step.action))return step.action;
      if(/Tokyo Character Street/i.test(label))return 'Use Tokyo Station First Avenue on the Yaesu side, outside JR ticket gates. Keep to two character shops and include checkout and packing; limited-release queues can use the entire visit.';
      if(/Gallery/i.test(label))return 'Use the Tokyo Station Gallery entrance by the Marunouchi North Exit. The interior requires exhibition admission; follow the checked exhibition calendar, and use the station facade as the alternative when it is closed.';
      if(/Fukagawa/i.test(label))return 'Use the Fukagawa Edo Museum entrance for the reconstructed Edo streets. The local station approach and return are separate stages; keep enough time for entry, facilities and the airport connection.';
      if(/Hanazono/i.test(label))return 'Use Hanazono Shrine’s public approach for a compact shrine visit in Shinjuku. Keep to the grounds and return toward the station you will actually use; events or stalls can change the available space.';
      if(/Toshogu/i.test(label))return 'Use Ueno Park’s approach to Ueno Toshogu. Distinguish the public approach from the paid area and its closing time; if paid entry no longer fits, keep the visit outside.';
      if(/Animate/i.test(label))return 'Use Animate Shinjuku on Shinjuku Marui Men’s 7F for one series or product category, including checkout time. The official shop route is from Shinjuku-sanchome E2 or JR Shinjuku’s East Exit. A release-event or purchase queue is a reason to switch to a short browse, not extend the airport deadline.';
      if(/Nakano Broadway/i.test(label))return 'From Nakano’s north side, use the Sun Mall approach to Nakano Broadway and identify two shops before browsing. Individual shop days and hours differ; return on the same familiar route.';
      if(/Kamigata/i.test(label))return 'Use the Kamigata Ukiyoe Museum near Hozenji for a focused look at Osaka actor prints. Admission and access through the museum’s floors are separate from the free alley walk; skip Hozenji if delayed.';
      if(/Yasaka/i.test(label))return 'Use Namba Yasaka Shrine’s public entrance for the lion-shaped hall and a short grounds visit. Return toward Nankai Namba; it is not next to every station entrance labelled Namba.';
      if(/Hozenji/i.test(label))return 'Find Hozenji’s small temple space and the neighboring stone-paved alley, then return toward Nankai Namba. Stay considerate of worshippers and restaurant entrances; a long meal is not included in this short walk.';
      if(/Meiji Shrine/i.test(label))return 'From the Harajuku side, follow Meiji Jingu’s south approach toward the main sanctuary and return along the approach. Finish before the official seasonal grounds closing time; the museum and garden need separate admission/time.';
      if(/Sensoji|Nakamise/i.test(label))return 'Follow Kaminarimon and Nakamise toward Sensoji, then return to your chosen Asakusa station. The main hall closes at 17:00; an evening stage is a grounds/exterior walk, with individual shops conditional on their own hours.';
      if(/Kappabashi/i.test(label))return 'Choose one category—bowls, chopsticks or food replicas—and browse nearby specialist shops on Kappabashi. A closed target shop is a reason to switch locally; knives need suitable checked-baggage packing.';
      if(/Shiodome/i.test(label))return 'Use Shiodome City Center and the signed public walkways for orientation from Shimbashi’s Shiodome side. Choose a short outward section and return; building terraces and high-floor restaurants have their own access rules.';
      if(/^(?:travel|head|walk|reach|return|take)\b/i.test(label)) {
        if(/(?:return|reach).*airport|departure (?:route|point|station)/i.test(label))return airportRoute(plan.airport,area)+' This is the approach to the departure route; the airport journey is accounted for by its own stage below.';
        if(/return.*station/i.test(label))return `Return to the station entrance saved for your ${area} airport connection. Pick the correct operator and gate side rather than the nearest station-name pin; any bag collection is shown separately when selected.`;
        return `Reach the named ${area} stop using the station approach in its destination guide. This stage is an editorial allowance for walking and local orientation, not a scheduled transport service. ${intention[area]||'Keep the stop within the named district.'}`;
      }
      if(/bookshop|Jimbocho/i.test(label))return intention.Jimbocho;
      if(/Tsukiji/i.test(label))return intention.Tsukiji+' Do not assume every shop opens on a calendar closure day; change to a station or airport meal if the target is closed.';
      if(/Tokyo Station|Marunouchi|red-brick|souvenir zone/i.test(label))return intention['Tokyo Station'];
      if(/Tokyo Tower|Zojoji/i.test(label))return intention.Hamamatsucho;
      if(/Shibuya|viewpoint/i.test(label))return intention.Shibuya;
      if(/Harajuku/i.test(label))return intention.Harajuku;
      if(/Omotesando/i.test(label))return 'Choose Omotesando Hills or one design shop on the avenue and leave checkout/packing time. This is Tokyo’s Omotesando, not Narita’s temple approach; keep the return station on the airport route.';
      if(/Rinku|seaside/i.test(label))return intention['Rinku Town'];
      if(/Dotonbori|Ebisubashi/i.test(label))return intention.Namba;
      if(plan.airportPlan)return intention[plan.area];
      return intention[area]||`Keep this ${area} visit within the named stop. If a queue uses the remaining local allowance, move to the station-side alternative rather than adding another attraction.`;
    }
    function example(core,plan,data) {
      const flight=new Date('2026-10-10T23:30:00+09:00'),target=new Date(+flight-data.airports[plan.airport].buffer*60000);
      const fit=core.withLuggageStep(plan,'none','',plan.area),steps=fit.steps;
      const window=core.scheduleWindow(new Date('2026-10-10T08:00:00+09:00'),target,steps,plan);
      if(!window.valid)throw new Error('No checked example window for '+plan.id);
      return {flight,target,start:window.latest,steps};
    }
    function timeline(core,plan,steps,start,storageArea) {
      let cursor=new Date(start);
      return steps.map((step,index)=>{
        const begin=new Date(cursor);cursor=new Date(+cursor+Number(step.minutes||0)*60000);
        const classes=['byf-rich-step',core.isAirportTransferStep(step)?'is-airport-move':'',step.isPickup?'is-luggage-pickup':'',step.isStorageDrop?'is-luggage-drop':''].filter(Boolean).join(' ');
        return `<article class="${classes}" data-minutes="${Number(step.minutes||0)}" data-start-at="${begin.toISOString()}" data-end-at="${cursor.toISOString()}"><time datetime="${begin.toISOString()}">${escape(clock(begin))}</time><div><h3>${escape(step.label)}</h3><p>${escape(directions(core,plan,steps,index,storageArea))}</p><p class="byf-duration">${Number(step.minutes||0) ? 'Planning allowance: '+Number(step.minutes||0)+' minutes' : 'Arrival milestone · no additional activity time'}</p></div></article>`;
      }).join('')+`<p class="byf-complete-time" data-completed-at="${cursor.toISOString()}"><b>Complete route ends:</b> ${escape(stamp(cursor))} JST. Any time remaining before the airport-ready target stays spare.</p>`;
    }
    function keyTimes(core,plan,steps,start,flight,target) {
      const timing=core.timingFacts(steps,start,plan.airportPlan);
      return [['Example flight',flight],['Ready for airline procedures by',target],['At the airport by',timing.airportArrivalAt||target],[plan.airportPlan&&!timing.leaveAt?'Begin airport experience by':`Leave for ${plan.airport} by`,timing.leaveAt||start]].map(([label,value],i)=>`<span${i===3?' class="is-leave"':''}><small>${escape(label)}</small><b>${escape(stamp(value))}</b></span>`).join('');
    }
    return {escape,clock,stamp,intention,directions,example,timeline,keyTimes};
  })();
  window.BYFPlanPresentation=presentation;

  function initializePlanContext() {
  const core = window.BYFPlannerCore;
  const source = window.BYF_STATIC_DATA;
  if (!source || !core || !Array.isArray(source.plans)) return;
  const data = core.enhanceData(source);
  const params = new URLSearchParams(window.location.search);
  const requestedId = Number(params.get("plan_id"));
  const path = window.location.pathname.replace(/\/+$/, "/");
  const plan = data.plans.find((item) => {
    if (requestedId && item.id !== requestedId) return false;
    try {
      return new URL(item.url).pathname.replace(/\/+$/, "/") === path;
    } catch {
      return false;
    }
  });
  if (!plan) return;

  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" });
  const timeOnly = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" });
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

  const planGuidance = {
    28: {
      choose: ["You want the lowest-complexity Haneda option and are satisfied with one airport experience.", "You will confirm the departure terminal and airline counter before eating or shopping.", "You are willing to skip the optional experience if airline procedures need attention."],
      avoid: ["Your terminal or check-in status is still unresolved.", "You need a particular restaurant, shop, or observation deck to be open.", "Your airline deadline is already close."],
      sources: [["Haneda international departure procedures", "https://tokyo-haneda.com/en/flight/int/dep_step.html"], ["Haneda terminal floor guide", "https://tokyo-haneda.com/en/floor/floor-guide.html"]],
    },
    31: {
      choose: ["You are at or near Narita and want a quiet, low-complexity final stop.", "A meal, cafe break, or rest near your confirmed terminal is enough.", "You will resolve terminal and counter questions before using optional time."],
      avoid: ["You intend to return to Narita city after reaching the airport.", "Your terminal or airline counter is still uncertain.", "Your airline deadline is already close."],
      sources: [["Narita international departure procedure", "https://www.narita-airport.jp/en/airportguide/inter-dep/"], ["Narita airport facility layout", "https://www.narita-airport.jp/en/service/ud/guide/"]],
    },
    32: {
      choose: ["You want one final Japanese meal or focused souvenir browse inside Narita Airport.", "You will confirm your terminal and check-in counter first.", "You can choose from what is open near your actual departure route."],
      avoid: ["You need a specific shop or restaurant to be guaranteed.", "Your terminal or check-in status is unresolved.", "Shopping would delay airline procedures."],
      sources: [["Narita international departure procedure", "https://www.narita-airport.jp/en/airportguide/inter-dep/"], ["Narita shops and restaurants", "https://www.narita-airport.jp/en/shop/"]],
    },
    33: {
      choose: ["You are already in Namba and want one unmistakably Osaka food-and-street scene.", "You can keep the visit to Ebisubashi, the riverwalk, and one meal.", "You will return to Nankai Namba before the displayed leave-by time."],
      avoid: ["Crowds or restaurant queues are already slowing the route.", "Your luggage is outside Namba or a nearby station area.", "Live KIX transport is disrupted."],
      sources: [["Dotonbori — Osaka Official Tourism Guide", "https://osaka-info.jp/en/spot/dotonbori/"], ["KIX train access", "https://www.kansai-airport.or.jp/en/access/from-airport/train"]],
    },
    34: {
      choose: ["You want a compact Namba loop rather than another cross-city transfer.", "A quick meal, Hozenji atmosphere, or final souvenir is enough.", "You can stay close to Nankai Namba."],
      avoid: ["You plan to queue for a famous restaurant.", "Your luggage is outside Namba or Umeda.", "Live KIX transport is disrupted."],
      sources: [["Dotonbori and Minami — Osaka Official Tourism Guide", "https://osaka-info.jp/en/spot/dotonbori/"], ["KIX train access", "https://www.kansai-airport.or.jp/en/access/from-airport/train"]],
    },
    35: {
      choose: ["You are already in Umeda and want a city view, green space, food, or shopping in one station complex.", "You prefer an indoor-friendly plan with many exit points.", "You will use the displayed airport departure time as a hard stop."],
      avoid: ["You want to add Umeda Sky Building queues or another district.", "Your luggage is outside Umeda or Namba.", "Live KIX transport is disrupted."],
      sources: [["Osaka Station City — Osaka Official Tourism Guide", "https://osaka-info.jp/en/spot/osaka-station-city/"], ["Grand Green Osaka — Osaka Official Tourism Guide", "https://discover.osaka-info.jp/en/spots/grand-green-osaka"], ["KIX access", "https://www.kansai-airport.or.jp/en/access/to-airport"]],
    },
    36: {
      choose: ["You want an Osaka Bay view or a focused outlet stop close to KIX.", "You can choose one zone instead of trying to cover the whole outlet.", "The shops are open and the return train margin is comfortable."],
      avoid: ["You have less than the displayed complete-plan time.", "You expect a full outlet shopping trip.", "Bad weather or service disruption makes the extra airport-island crossing uncertain."],
      sources: [["Rinku Premium Outlets", "https://www.premiumoutlets.co.jp/en/rinku/"], ["KIX access", "https://www.kansai-airport.or.jp/en/access/"]],
    },
    37: {
      choose: ["You want the lowest-complexity option and are happy with one airport experience.", "You will confirm your terminal and airline instructions before eating or shopping.", "You will treat Sky View as optional and check its shuttle timetable first."],
      avoid: ["Your airline deadline is already close.", "A terminal change or unresolved check-in issue needs attention.", "You need a particular shop, restaurant, or Sky View visit to be guaranteed."],
      sources: [["KIX shops and restaurants", "https://www.kansai-airport.or.jp/en/shop-and-dine/"], ["KIX airport map", "https://www.kansai-airport.or.jp/en/map"], ["KIX Sky View access and hours", "https://www.kansai-airport.or.jp/en/shop-and-dine/skyview/access"]],
    },
  };

  function basePlanId(id) {
    if (id === 2801) return 28;
    if (id === 3601) return 36;
    if (id === 3701) return 37;
    return id;
  }

  function improvePlanPage() {
    const guidance = planGuidance[basePlanId(plan.id)];
    const heroTitle = document.querySelector(".byf-plan-hero h1");
    if (heroTitle) heroTitle.textContent = plan.name;
    const lead = document.querySelector(".byf-experience-lead");
    if (lead) lead.textContent = presentation.intention[plan.area] || plan.hook;
    const memory = document.querySelector(".byf-memory");
    if (memory) memory.innerHTML = `<b>What you’ll remember:</b> ${escapeHtml(plan.hook)}`;
    const preview = document.querySelector(".byf-place-preview p:not(.byf-kicker)");
    if (preview && plan.airportPlan) preview.textContent = plan.hook;
    const fit = document.querySelector(".byf-plan-fit");
    if (fit) {
      const definitions = fit.querySelectorAll("dd");
      if (definitions[0]) definitions[0].textContent = plan.starts.join(", ");
      const baseMinutes = core.totalMinutes(core.withLuggageStep(plan, "none", "", plan.area).steps);
      if (definitions[1]) definitions[1].textContent = `${baseMinutes} min complete model from ${plan.area}, before airport-ready time; luggage and a different start can add time`;
      if (definitions[2]) definitions[2].textContent = plan.strictStarts ? "Calculated from opening hours, admission deadlines and the checked closure calendar." : `${plan.startMin}–${plan.startMax} JST · ${plan.days}`;
      if (definitions[3]) definitions[3].textContent = "Large luggage can be stored near the suggested stop. Locker space is not guaranteed; an entered return elsewhere receives a separate conservative allowance.";
      const lists = fit.querySelectorAll("ul");
      if (guidance && lists[0]) lists[0].innerHTML = guidance.choose.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      if (guidance && lists[1]) lists[1].innerHTML = guidance.avoid.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      fit.querySelectorAll("li").forEach((item) => {
        if (/^You have at least .*before your recommended airport arrival time\./.test(item.textContent)) item.textContent = "Your available time covers the complete route, including luggage and the airport journey, before your airport-ready target.";
      });
    }
    const baseFact = document.querySelectorAll(".byf-facts > span")[1];
    if (baseFact) baseFact.innerHTML = `<b>${core.totalMinutes(core.withLuggageStep(plan, "none", "", plan.area).steps)} min</b> complete model`;
    const sources = document.querySelector(".byf-source");
    if (sources && guidance) {
      const list = sources.querySelector("ul");
      if (list) list.innerHTML = guidance.sources.map(([label, url]) => `<li><a target="_blank" rel="noopener" href="${escapeHtml(url)}">${escapeHtml(label)} ↗</a></li>`).join("");
    }
    const checked = sources && sources.querySelector("small");
    if (checked) checked.textContent = `Route-source review recorded: ${plan.checked}. Example arithmetic and page consistency rebuilt: 17 November 2026. The arithmetic rebuild is not a new on-site verification.`;
  }

  function renderTimeline(steps, start) {
    const timeline = document.querySelector(".byf-rich-timeline");
    if (timeline) timeline.innerHTML = presentation.timeline(core, plan, steps, start, luggageFit?.storageArea);
  }

  improvePlanPage();

  const personalized = params.get("byf_context") === "1";
  let steps = plan.steps.map((step) => ({ ...step }));
  let flight;
  let recommended;
  let start;
  let airportCode = plan.airport;
  let luggageFit = null;

  function showInvalid() {
    const notice = document.createElement("aside");
    notice.className = "byf-alert";
    notice.innerHTML = 'This saved plan no longer fits the entered conditions, supported starting areas or opening-hour limits. <a href="/#planner">Recalculate your options</a>. The timeline below is a general example.';
    document.querySelector(".byf-model")?.before(notice);
  }
  if (personalized) {
    const flightAt = params.get("flight_at");
    const freeAt = params.get("free_at");
    airportCode = params.get("airport");
    const airport = data.airports[airportCode];
    flight = flightAt ? new Date(`${flightAt}:00+09:00`) : null;
    const free = freeAt ? new Date(`${freeAt}:00+09:00`) : null;
    if (!airport || airportCode !== plan.airport || !flight || !free || flight <= free || !Number.isFinite(flight.getTime()) || !Number.isFinite(free.getTime())) { showInvalid(); return; }
    luggageFit = core.withLuggageStep(plan, params.get("luggage") || "", params.get("luggage_area") || "", params.get("start") || "");
    if (!luggageFit.compatible || !core.areaMatches(plan, params.get("start") || "")) { showInvalid(); return; }
    steps = core.withTravelNeeds(luggageFit.steps, params.get("needs") || "standard");
    recommended = new Date(flight.getTime() - airport.buffer * 60000);
    const total = core.totalMinutes(steps);
    const window = core.scheduleWindow(free, recommended, steps, plan);
    if (!window.valid || !core.supportsNeeds(plan, params.get("needs"))) {
      showInvalid();
      return;
    }
    const requestedStart = params.get("plan_start_at") ? new Date(params.get("plan_start_at")) : null;
    start = core.isStartWithinWindow(requestedStart, window) ? requestedStart : window.latest;

    const availableMinutes = Math.max(0, Math.floor((recommended - free) / 60000));
    const hours = Math.floor(availableMinutes / 60);
    const minutes = availableMinutes % 60;
    const duration = `${hours ? `${hours} hr${hours === 1 ? "" : "s"}` : ""}${hours && minutes ? " " : ""}${minutes ? `${minutes} min` : ""}`;
    const situation = document.createElement("aside");
    situation.className = "byf-situation";
    situation.setAttribute("aria-label", "Your planner conditions");
    situation.innerHTML = `<b>Your situation</b>You have about ${escapeHtml(duration || "0 min")} before the protected airport-ready time for ${escapeHtml(airportCode)}. This timeline includes your starting area and the luggage choice entered in the planner.`;
    const model = document.querySelector(".byf-model");
    if (model) model.before(situation);
  } else {
    const example=presentation.example(core,plan,data);
    flight=example.flight; recommended=example.target; start=example.start; steps=example.steps;
  }

  renderTimeline(steps, start);
  if (personalized) {
    const controls = document.createElement("div");
    controls.className = "byf-plan-tools";
    const back = new URLSearchParams(params);
    ["byf_context", "plan_id", "plan_start_at"].forEach((key) => back.delete(key));
    controls.innerHTML = `<a href="/?${escapeHtml(back.toString())}#planner">Change my conditions</a><button type="button" data-copy-plan>Copy plan link</button><button type="button" data-print-plan>Print / save PDF</button><span role="status"></span>`;
    controls.querySelector("[data-copy-plan]").addEventListener("click", async () => {
      const status = controls.querySelector('[role="status"]');
      try { await navigator.clipboard.writeText(window.location.href); status.textContent = "Plan link copied. It includes your flight and luggage conditions."; }
      catch { status.textContent = "Copy the address from your browser to share these conditions."; }
    });
    controls.querySelector("[data-print-plan]").addEventListener("click", () => window.print());
    document.querySelector(".byf-model")?.prepend(controls);
  }
  const timing = core.timingFacts(steps, start, plan.airportPlan);
  const hasAirportTravel = Boolean(timing.leaveAt);
  const leaveAt = timing.leaveAt || start;
  const airportArrivalAt = timing.airportArrivalAt || recommended;
  const keyTimes = document.querySelector(".byf-key-times");
  if (keyTimes) keyTimes.innerHTML = [
    [personalized ? "Your flight" : "Example flight", flight],
    ["Ready for airline procedures by", recommended],
    ["At the airport by", airportArrivalAt],
    [plan.airportPlan && !hasAirportTravel ? "Begin airport experience by" : `Leave for ${airportCode} by`, leaveAt],
  ].map(([label, value], index) => `<span${index === 3 ? ' class="is-leave"' : ""}><small>${escapeHtml(label)}</small><b>${escapeHtml(formatter.format(value))}</b></span>`).join("");
  document.querySelectorAll(".byf-deadline b").forEach((node) => { node.textContent = formatter.format(leaveAt); });
  const modelHeading = document.querySelector(".byf-model h2");
  if (modelHeading) modelHeading.textContent = personalized ? `Your timeline for the ${formatter.format(flight)} ${airportCode} flight` : `Example timeline · ${formatter.format(flight)} ${airportCode} flight`;
  const modelIntro = document.querySelector(".byf-model h2 + p");
  if (modelIntro) modelIntro.textContent = personalized ? "Calculated from your flight, starting area, and luggage return. ‘At the airport’ and ‘ready for airline procedures’ are shown separately." : "Worked example for 10 October 2026, beginning in " + plan.area + " with no luggage detour. It illustrates the checked model and is not a current opening-hours or train-service promise. Enter your actual travel date to check availability.";
  if (personalized) {
    const definitions = document.querySelectorAll(".byf-plan-fit dd");
    const durationFact = document.querySelectorAll(".byf-facts > span")[1];
    if (durationFact) durationFact.innerHTML = `<b>${core.totalMinutes(steps)} min</b> your complete plan`;
    if (definitions[1]) definitions[1].textContent = `${core.totalMinutes(steps)} min for this personalized plan, including any luggage allowance`;
    if (definitions[3] && luggageFit) {
      definitions[3].textContent = luggageFit.mode === "return_elsewhere"
        ? plan.airportPlan && params.get("start") === luggageFit.storageArea
          ? `Your luggage pickup in ${luggageFit.storageArea} is included with a conservative allowance.`
          : `Your return to ${luggageFit.storageArea} is included with a conservative allowance. Check the exact hotel or storage route live; it can take longer.`
        : luggageFit.mode === "store_near_stop" && !plan.airportPlan
          ? `This plan includes ${luggageFit.dropMinutes} minutes to store luggage in ${luggageFit.storageArea}, the return journey to that storage area, and a separate collection allowance before the airport transfer.`
          : "No separate luggage detour is included.";
    }
  }
  }

  if (typeof document === "undefined") return;
  if (window.BYFPlannerCore) {
    initializePlanContext();
  } else {
    const script = document.createElement("script");
    script.src = "/assets/planner-core.js?v=20261004-1";
    script.dataset.byfPlannerCore = "1";
    script.addEventListener("load", initializePlanContext, { once: true });
    document.head.append(script);
  }
})();
