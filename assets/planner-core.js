(function (root) {
  "use strict";

  const NEARBY_AREAS = {
    Tokyo: ["Tokyo Station", "Ginza", "Shinagawa", "Roppongi"],
    "Tokyo Station": ["Tokyo", "Ginza", "Ueno"],
    Ginza: ["Tokyo", "Tokyo Station", "Shinagawa", "Roppongi"],
    Shinagawa: ["Tokyo", "Ginza"],
    Shinjuku: ["Shibuya", "Ikebukuro"],
    Shibuya: ["Shinjuku", "Roppongi"],
    Ueno: ["Tokyo Station", "Asakusa"],
    Asakusa: ["Ueno"],
    Ikebukuro: ["Shinjuku"],
    Roppongi: ["Tokyo", "Ginza", "Shibuya"],
    Toyosu: ["Tokyo", "Ginza", "Odaiba"],
    Jimbocho: ["Tokyo", "Tokyo Station", "Ueno"],
    Harajuku: ["Shinjuku", "Shibuya"],
    Hamamatsucho: ["Ginza", "Shinagawa", "Roppongi"],
    Akihabara: ["Tokyo Station", "Ueno"],
    Tsukiji: ["Tokyo Station", "Ginza"],
    Nihonbashi: ["Tokyo", "Tokyo Station", "Ginza"],
    Namba: ["Umeda"],
    Umeda: ["Namba"],
    Narita: ["Narita Airport"],
    "Narita Airport": ["Narita"],
  };

  const AREA_REGIONS = {
    Tokyo: "Tokyo",
    "Tokyo Station": "Tokyo",
    Shinjuku: "Tokyo",
    Shibuya: "Tokyo",
    Ginza: "Tokyo",
    Shinagawa: "Tokyo",
    Ueno: "Tokyo",
    Asakusa: "Tokyo",
    Ikebukuro: "Tokyo",
    Roppongi: "Tokyo",
    Odaiba: "Tokyo",
    Toyosu: "Tokyo",
    Jimbocho: "Tokyo",
    Harajuku: "Tokyo",
    Hamamatsucho: "Tokyo",
    Akihabara: "Tokyo",
    Tsukiji: "Tokyo",
    Nihonbashi: "Tokyo",
    "Haneda Airport": "Tokyo",
    Narita: "Chiba",
    "Narita Airport": "Chiba",
    Namba: "Osaka",
    Umeda: "Osaka",
    "Kansai Airport": "Osaka",
    "Rinku Town": "Osaka",
  };

  const AIRPORT_TRANSFER_PATTERN = /(?:travel|head) (?:to|toward) (?:haneda|narita|kansai) airport/i;

  const PLAN_UPDATES = {
    31: {
      area: "Narita Airport",
      airportPlan: true,
      hook: "a low-complexity meal or quiet rest near your confirmed Narita terminal, without another city detour",
      min: 125,
      recommended: 140,
      checked: "2026-08-29",
      steps: [
        { minutes: 30, label: "Travel to Narita Airport", leave: "Leave this area by" },
        { minutes: 15, label: "Confirm your terminal and airline instructions" },
        { minutes: 70, label: "Choose one quiet meal, cafe break, or rest near your terminal" },
        { minutes: 10, label: "Be ready for airline check-in or security" },
      ],
    },
    32: {
      area: "Narita Airport",
      airportPlan: true,
      hook: "one final Japanese meal or focused souvenir browse inside Narita Airport after confirming your terminal",
      min: 125,
      recommended: 140,
      checked: "2026-08-29",
      steps: [
        { minutes: 30, label: "Travel to Narita Airport", leave: "Leave this area by" },
        { minutes: 15, label: "Confirm your terminal and airline instructions" },
        { minutes: 70, label: "Choose one Japanese meal or focused souvenir browse" },
        { minutes: 10, label: "Be ready for airline check-in or security" },
      ],
    },
    27: {
      area: "Shinagawa",
      hook: "a calm final Japanese meal and souvenir browse at Shinagawa Station, already on Haneda’s southbound airport corridor",
      starts: ["Tokyo", "Tokyo Station", "Ginza", "Shinagawa"],
      min: 110,
      recommended: 125,
      startMin: "09:00",
      startMax: "19:00",
      steps: [
        { minutes: 10, label: "Reach Shinagawa Station’s dining area" },
        { minutes: 55, label: "Choose one Japanese meal and a final station souvenir" },
        { minutes: 10, label: "Return to the Keikyu airport route" },
        { minutes: 35, label: "Travel to Haneda Airport", leave: "Leave this area by" },
        { minutes: 0, label: "Arrive at Haneda Airport" },
      ],
    },
    89: {
      area: "Tokyo Station",
      hook: "Tokyo Station’s restored red-brick facade followed by one focused browse for regional sweets, bento, or character gifts",
      starts: ["Tokyo", "Tokyo Station", "Ginza", "Ueno"],
      min: 125,
      recommended: 145,
      startMin: "10:00",
      startMax: "19:30",
      steps: [
        { minutes: 10, label: "Reach the Marunouchi side of Tokyo Station" },
        { minutes: 25, label: "See the red-brick station facade and Marunouchi plaza" },
        { minutes: 35, label: "Choose one souvenir zone inside Tokyo Station" },
        { minutes: 10, label: "Return to the Haneda departure route" },
        { minutes: 45, label: "Travel to Haneda Airport", leave: "Leave this area by" },
        { minutes: 0, label: "Arrive at Haneda Airport" },
      ],
    },
    95: {
      area: "Ginza",
      hook: "Shiodome’s modern skyline, public art, and a quiet final coffee without leaving the direct Haneda corridor",
      starts: ["Tokyo", "Tokyo Station", "Ginza", "Shinagawa"],
      min: 115,
      recommended: 130,
      startMin: "08:00",
      startMax: "19:00",
      steps: [
        { minutes: 15, label: "Reach Shiodome from Ginza or Tokyo Station" },
        { minutes: 50, label: "Walk the Shiodome plazas and take one coffee break" },
        { minutes: 15, label: "Reach the airport departure route" },
        { minutes: 35, label: "Travel to Haneda Airport", leave: "Leave this area by" },
        { minutes: 0, label: "Arrive at Haneda Airport" },
      ],
    },
    26: {
      area: "Ginza",
      hook: "one unhurried Japanese lunch, a short Ginza architecture walk, and a wagashi or depachika souvenir",
      starts: ["Tokyo", "Tokyo Station", "Ginza", "Shinagawa", "Roppongi"],
      min: 160,
      recommended: 175,
      steps: [
        { minutes: 15, label: "Reach central Ginza" },
        { minutes: 60, label: "Choose one Japanese lunch" },
        { minutes: 25, label: "Take a short Ginza walk or buy wagashi" },
        { minutes: 10, label: "Return to the airport departure route" },
        { minutes: 50, label: "Travel to Haneda Airport", leave: "Leave this area by" },
        { minutes: 0, label: "Arrive at Haneda Airport" },
      ],
    },
    28: {
      area: "Haneda Airport",
      airportPlan: true,
      checked: "2026-08-29",
      hook: "arrive early, confirm your terminal, then choose one last Japanese meal, souvenir browse, or observation deck before the protected airline-procedure time",
      starts: ["Tokyo", "Tokyo Station", "Ginza", "Shinagawa", "Shinjuku", "Shibuya", "Ueno", "Asakusa", "Ikebukuro", "Roppongi", "Odaiba"],
      min: 125,
      recommended: 140,
      steps: [
        { minutes: 55, label: "Travel to Haneda Airport", leave: "Leave this area by" },
        { minutes: 15, label: "Confirm your terminal and airline instructions" },
        { minutes: 45, label: "Choose one: Japanese meal, souvenir browse, or observation deck" },
        { minutes: 10, label: "Proceed to airline check-in or security" },
      ],
    },
    98: {
      area: "Shibuya",
      hook: "a compact Shibuya stop: one viewpoint or coffee break, a short street-level walk, then a direct Haneda departure",
      starts: ["Shinjuku", "Shibuya", "Roppongi"],
      interest: ["Modern Tokyo", "Shopping", "Relax", "Food"],
      min: 185,
      recommended: 205,
      checked: "2026-08-29",
      startMin: "09:00",
      startMax: "19:00",
      steps: [
        { minutes: 20, label: "Reach Shibuya Station" },
        { minutes: 60, label: "Choose one viewpoint, cafe break, or focused shop" },
        { minutes: 30, label: "Take a short street-level walk near Shibuya Station" },
        { minutes: 15, label: "Reach the Haneda departure route" },
        { minutes: 60, label: "Travel to Haneda Airport", leave: "Leave this area by" },
        { minutes: 0, label: "Arrive at Haneda Airport" },
      ],
    },
    258: {
      hook: "Roppongi’s evening energy followed by one focused Azabudai meal or shop, with a clear return to the Haneda route",
    },
    256: { area: "Toyosu" },
    254: {
      area: "Jimbocho",
      hook: "a focused browse through Jimbocho’s specialist bookshops followed by one Kanda coffee or meal",
    },
    247: {
      area: "Harajuku",
      hook: "Harajuku’s street fashion and Omotesando’s architecture in one walkable corridor before the Haneda transfer",
    },
    244: { area: "Hamamatsucho" },
    243: { area: "Hamamatsucho" },
    234: { area: "Harajuku" },
    121: {
      area: "Tokyo Station",
      hook: "a full final-day route from Tokyo Station and Nihonbashi through Tsukiji and Ginza to Tokyo Bay, only for a genuinely long window",
    },
    104: { area: "Akihabara" },
    96: {
      area: "Harajuku",
      hook: "the forested approach and shrine precincts of Meiji Jingu, with time to return directly toward Haneda",
    },
    92: {
      area: "Tsukiji",
      hook: "one focused Tsukiji Outer Market meal and short browse before returning to the Haneda corridor",
    },
    90: { area: "Nihonbashi" },
    33: {
      area: "Namba",
      hook: "Dotonbori’s giant signs and riverwalk, followed by one Osaka specialty before returning to Nankai Namba for KIX",
      min: 190,
      recommended: 215,
      days: "Daily",
      startMin: "10:00",
      startMax: "18:00",
      steps: [
        { minutes: 15, label: "Walk from Namba to Ebisubashi" },
        { minutes: 30, label: "See the Dotonbori signs and Tonbori Riverwalk" },
        { minutes: 50, label: "Choose one Osaka specialty for lunch" },
        { minutes: 20, label: "Return to Nankai Namba Station" },
        { minutes: 55, label: "Travel to Kansai Airport", leave: "Leave this area by" },
        { minutes: 20, label: "Keep a KIX transfer margin" },
      ],
    },
    34: {
      area: "Namba",
      hook: "a compact loop from Nankai Namba to Hozenji Yokocho for atmosphere, food, and final Osaka souvenirs",
      min: 180,
      recommended: 205,
      days: "Daily",
      startMin: "09:00",
      startMax: "18:30",
      steps: [
        { minutes: 15, label: "Walk from Nankai Namba toward Hozenji Yokocho" },
        { minutes: 35, label: "See Hozenji Yokocho and the edge of Dotonbori" },
        { minutes: 40, label: "Choose one quick meal or final Osaka souvenir" },
        { minutes: 15, label: "Return to Nankai Namba Station" },
        { minutes: 55, label: "Travel to Kansai Airport", leave: "Leave this area by" },
        { minutes: 20, label: "Keep a KIX transfer margin" },
      ],
    },
    35: {
      area: "Umeda",
      hook: "Osaka Station City and Grand Green Osaka: one city view, one meal or depachika browse, then a direct airport departure",
      min: 215,
      recommended: 240,
      days: "Daily",
      startMin: "09:30",
      startMax: "17:30",
      steps: [
        { minutes: 15, label: "Reach Osaka Station City" },
        { minutes: 45, label: "Choose Grand Green Osaka or an Osaka Station City viewpoint" },
        { minutes: 45, label: "Eat or shop for regional food near Osaka Station" },
        { minutes: 20, label: "Reach the KIX departure station or bus stop" },
        { minutes: 70, label: "Travel to Kansai Airport", leave: "Leave this area by" },
        { minutes: 20, label: "Keep a KIX transfer margin" },
      ],
    },
    36: {
      area: "Rinku Town",
      hook: "an Osaka Bay view and a focused outlet or food-hall stop one station before KIX—not a full shopping marathon",
      starts: ["Namba", "Umeda"],
      min: 170,
      recommended: 195,
      days: "Daily",
      steps: [
        { minutes: 55, label: "Travel to Rinku-Town Station" },
        { minutes: 70, label: "Choose the seaside view, food hall, or a focused outlet browse" },
        { minutes: 15, label: "Return to Rinku-Town Station" },
        { minutes: 10, label: "Travel to Kansai Airport", leave: "Leave this area by" },
        { minutes: 20, label: "Keep a KIX transfer margin" },
      ],
    },
    37: {
      area: "Kansai Airport",
      airportPlan: true,
      checked: "2026-08-29",
      hook: "reach KIX early, confirm the terminal, then choose one Japanese meal, souvenir browse, Aeroplaza rest, or Sky View only when its shuttle schedule fits",
      starts: ["Namba", "Umeda"],
      min: 145,
      recommended: 165,
      days: "Daily",
      startMin: "06:00",
      startMax: "20:00",
      steps: [
        { minutes: 70, label: "Travel to Kansai Airport", leave: "Leave this area by" },
        { minutes: 15, label: "Confirm your terminal and airline instructions" },
        { minutes: 50, label: "Choose one: Japanese meal, souvenir browse, or Aeroplaza rest" },
        { minutes: 10, label: "Proceed to airline check-in or security" },
      ],
    },
  };

  const EXTRA_PLANS = [
    {
      id: 2801,
      name: "Haneda Terminal Mini Experience",
      url: "https://beforeyouflyjapan.com/plans/haneda-airport-experience-before-your-flight/",
      hook: "confirm your terminal first, then use a small protected window for one meal, souvenir browse, or observation deck",
      airport: "HND",
      area: "Haneda Airport",
      airportPlan: true,
      starts: ["Haneda Airport"],
      interest: ["Food", "Shopping", "Relax"],
      min: 60,
      recommended: 70,
      days: "Daily",
      startMin: "05:00",
      startMax: "21:00",
      luggage: "yes",
      type: "At the airport",
      steps: [
        { minutes: 10, label: "Confirm your terminal and airline instructions" },
        { minutes: 40, label: "Choose one: Japanese meal, souvenir browse, or observation deck" },
        { minutes: 10, label: "Proceed to airline check-in or security" },
      ],
      live: "https://tokyo-haneda.com/en/",
      checked: "2026-08-28",
    },
    {
      id: 3601,
      name: "Rinku Town Quick Stop from KIX",
      url: "https://beforeyouflyjapan.com/plans/rinku-town-before-your-kix-flight/",
      hook: "one station from KIX for an Osaka Bay view, quick meal, or focused outlet browse with a clear return cutoff",
      airport: "KIX",
      area: "Rinku Town",
      starts: ["Kansai Airport"],
      interest: ["Shopping", "Relax", "Food"],
      min: 130,
      recommended: 150,
      days: "Daily",
      startMin: "10:00",
      startMax: "18:00",
      luggage: "yes",
      type: "Near the airport",
      steps: [
        { minutes: 15, label: "Travel to Rinku-Town Station" },
        { minutes: 70, label: "Choose the seaside view, food hall, or a focused outlet browse" },
        { minutes: 15, label: "Return to Rinku-Town Station" },
        { minutes: 10, label: "Travel to Kansai Airport", leave: "Leave this area by" },
        { minutes: 20, label: "Keep a KIX transfer margin" },
      ],
      live: "https://www.kansai-airport.or.jp/en/access/",
      checked: "2026-08-28",
    },
    {
      id: 3701,
      name: "KIX Terminal Mini Experience",
      url: "https://beforeyouflyjapan.com/plans/kansai-airport-experience-before-your-flight/",
      hook: "confirm your terminal first, then choose one Japanese meal, souvenir browse, or Aeroplaza rest without leaving the airport complex",
      airport: "KIX",
      area: "Kansai Airport",
      airportPlan: true,
      starts: ["Kansai Airport"],
      interest: ["Food", "Shopping", "Relax"],
      min: 65,
      recommended: 75,
      days: "Daily",
      startMin: "05:00",
      startMax: "21:00",
      luggage: "yes",
      type: "At the airport",
      steps: [
        { minutes: 10, label: "Confirm your terminal and airline instructions" },
        { minutes: 45, label: "Choose one: Japanese meal, souvenir browse, or Aeroplaza rest" },
        { minutes: 10, label: "Proceed to airline check-in or security" },
      ],
      live: "https://www.kansai-airport.or.jp/en/",
      checked: "2026-08-28",
    },
  ];

  function inferArea(plan) {
    if (plan.area) return plan.area;
    const names = ["Tokyo Station", "Shinagawa", "Shinjuku", "Shibuya", "Ginza", "Ueno", "Asakusa", "Ikebukuro", "Roppongi", "Odaiba", "Toyosu", "Jimbocho", "Harajuku", "Hamamatsucho", "Akihabara", "Tsukiji", "Nihonbashi", "Narita", "Namba", "Umeda", "Kansai Airport"];
    return names.find((area) => plan.name.includes(area)) || (plan.airport === "KIX" ? "Namba" : "Tokyo");
  }

  function enhanceData(source) {
    if (!source || !Array.isArray(source.plans)) return source;
    const plans = source.plans.map((original) => {
      const update = PLAN_UPDATES[original.id] || {};
      return { ...original, ...update, area: update.area || inferArea(original), steps: (update.steps || original.steps).map((step) => ({ happens: "", action: "", next: "", leave: "", ...step })) };
    });
    const ids = new Set(plans.map((plan) => plan.id));
    EXTRA_PLANS.forEach((plan) => { if (!ids.has(plan.id)) plans.push(plan); });
    return {
      ...source,
      plans,
      areas: {
        ...source.areas,
        "Haneda Airport": { label: "Haneda Airport", region: "Tokyo", corridor: "airport" },
        "Rinku Town": { label: "Rinku Town", region: "Osaka", corridor: "airport" },
      },
    };
  }

  function isNearby(a, b) {
    return a === b || (NEARBY_AREAS[a] || []).includes(b) || (NEARBY_AREAS[b] || []).includes(a);
  }

  function pickupMinutes(startArea, luggageArea) {
    if (!luggageArea) return null;
    if (startArea === luggageArea) return 35;
    const airportArea = (area) => /Airport$/.test(area || "");
    if (airportArea(startArea) !== airportArea(luggageArea)) {
      return AREA_REGIONS[startArea] && AREA_REGIONS[startArea] === AREA_REGIONS[luggageArea] ? 120 : null;
    }
    if (isNearby(startArea, luggageArea)) return 60;
    return AREA_REGIONS[startArea] && AREA_REGIONS[startArea] === AREA_REGIONS[luggageArea] ? 90 : null;
  }

  function areaMatches(plan, startArea) {
    if (plan.area === startArea) return true;
    if (plan.starts.includes(startArea)) return true;
    if (startArea === "Tokyo" && plan.airport === "HND" && !plan.airportPlan) return true;
    return plan.starts.some((area) => isNearby(area, startArea));
  }

  function airportTransferMinimum(airport, area) {
    const minimums = {
      HND: { "Haneda Airport": 0, Shinagawa: 35, Tokyo: 50, "Tokyo Station": 50, Ginza: 50, Roppongi: 50, Shibuya: 60, Shinjuku: 60, Ueno: 75, Asakusa: 75, Ikebukuro: 75, Odaiba: 75, Toyosu: 75, Jimbocho: 65, Harajuku: 65, Hamamatsucho: 45, Akihabara: 70, Tsukiji: 55, Nihonbashi: 55 },
      NRT: { "Narita Airport": 0, Narita: 35, Tokyo: 110, "Tokyo Station": 110, Ginza: 110, Shinagawa: 120, Roppongi: 120, Shibuya: 120, Shinjuku: 120, Ueno: 100, Asakusa: 100, Ikebukuro: 120, Odaiba: 130, Toyosu: 130, Jimbocho: 115, Harajuku: 125, Hamamatsucho: 120, Akihabara: 105, Tsukiji: 120, Nihonbashi: 110 },
      KIX: { "Kansai Airport": 0, "Rinku Town": 20, Namba: 70, Umeda: 90 },
    };
    return minimums[airport] && minimums[airport][area] != null ? minimums[airport][area] : null;
  }

  function normalizeLuggageMode(luggage) {
    if (luggage === "with_me") return "store_near_stop";
    if (luggage === "stored_hotel" || luggage === "stored_locker") return "return_elsewhere";
    return luggage || "store_near_stop";
  }

  function mergeGenericAirportConnector(steps) {
    const airportIndex = steps.findIndex(isAirportTransferStep);
    if (airportIndex <= 0) return steps;
    const connector = steps[airportIndex - 1];
    if (!/(?:airport (?:departure )?(?:route|point)|narita departure point|departure station)/i.test(connector.label)) return steps;
    steps[airportIndex] = { ...steps[airportIndex], minutes: Number(steps[airportIndex].minutes || 0) + Number(connector.minutes || 0) };
    steps.splice(airportIndex - 1, 1);
    return steps;
  }

  function isReturnConnector(step) {
    return Boolean(step && /(?:\breturn\b|\breach\b|walk back|departure station)/i.test(step.label));
  }

  function isAirportTransferStep(step) {
    return Boolean(step && AIRPORT_TRANSFER_PATTERN.test(step.label || ""));
  }

  function prepareSteps(plan, startArea) {
    const steps = plan.steps.map((step) => ({ ...step }));
    if (!plan.airportPlan || startArea !== plan.area) return steps;
    const airportIndex = steps.findIndex(isAirportTransferStep);
    if (airportIndex === 0) steps.splice(airportIndex, 1);
    return steps;
  }

  function withLuggageStep(plan, luggage, luggageArea, startArea) {
    const mode = normalizeLuggageMode(luggage);
    let steps = prepareSteps(plan, startArea);

    if (plan.airportPlan) {
      if (mode !== "return_elsewhere") return { compatible: true, pickupMinutes: 0, mode, storageArea: plan.area || startArea, steps };
      if (!luggageArea) return { compatible: false, pickupMinutes: 0, mode, steps };
      const airportIndex = steps.findIndex(isAirportTransferStep);
      if (airportIndex < 0) {
        const alreadyAtStorage = luggageArea === startArea || luggageArea === plan.area;
        if (!alreadyAtStorage) return { compatible: false, pickupMinutes: 0, mode, storageArea: luggageArea, steps };
        const minutes = pickupMinutes(startArea, luggageArea);
        steps.unshift({ minutes, label: `Collect your luggage in ${luggageArea}`, isPickup: true, leave: "", happens: "", action: "", next: "" });
        return { compatible: true, pickupMinutes: minutes, mode, storageArea: luggageArea, steps };
      }
      const minutes = pickupMinutes(startArea, luggageArea);
      if (minutes === null) return { compatible: false, pickupMinutes: 0, mode, steps };
      steps.splice(airportIndex, 0, {
        minutes,
        label: `Return to ${luggageArea} and collect your luggage`,
        isPickup: true,
        leave: "",
        happens: "",
        action: "",
        next: "",
      });
      return { compatible: true, pickupMinutes: minutes, mode, storageArea: luggageArea, steps };
    }

    if (mode === "store_near_stop") {
      const storageArea = plan.area || startArea;
      const travelsToStorage = storageArea !== startArea;
      const firstStepReachesStorage = travelsToStorage && steps[0] && !isAirportTransferStep(steps[0]) && /^(?:travel|head|reach|walk|take)\b/i.test(steps[0].label || "");
      const dropMinutes = travelsToStorage ? 25 : 20;
      const dropIndex = firstStepReachesStorage ? 1 : 0;
      steps.splice(dropIndex, 0, { minutes: dropMinutes, label: `Store your luggage in ${storageArea}, near the suggested stop`, storageArea, isStorageDrop: true, leave: "", happens: "", action: "", next: "" });
      const airportIndex = steps.findIndex(isAirportTransferStep);
      const connectorIndex = airportIndex - 1;
      if (connectorIndex >= 0 && isReturnConnector(steps[connectorIndex])) {
        steps[connectorIndex] = { ...steps[connectorIndex], minutes: Math.max(15, Number(steps[connectorIndex].minutes || 0)), label: `Collect your luggage in ${storageArea} and reach the airport transfer`, storageArea, isPickup: true };
      } else {
        steps.splice(airportIndex >= 0 ? airportIndex : steps.length, 0, { minutes: 15, label: `Collect your luggage in ${storageArea} and begin the airport transfer`, storageArea, isPickup: true, leave: "", happens: "", action: "", next: "" });
      }
      return { compatible: true, dropMinutes, pickupMinutes: 15, mode, storageArea, steps };
    }

    steps = mergeGenericAirportConnector(steps);
    if (mode === "none") return { compatible: true, pickupMinutes: 0, mode, steps };
    if (mode !== "return_elsewhere" || !luggageArea) return { compatible: false, pickupMinutes: 0, mode, steps };
    const pickupBaseArea = plan.pickupBaseArea || plan.area || startArea;
    const minutes = pickupMinutes(pickupBaseArea, luggageArea);
    if (minutes === null) return { compatible: false, pickupMinutes: 0, mode, steps };
    const label = luggage === "stored_hotel"
      ? `Return to your hotel in ${luggageArea} and collect your luggage`
      : luggage === "stored_locker"
        ? `Collect your luggage from the locker in ${luggageArea}`
        : `Return to ${luggageArea} and collect your luggage`;
    const airportIndex = steps.findIndex(isAirportTransferStep);
    steps.splice(airportIndex >= 0 ? airportIndex : steps.length, 0, { minutes, label, isPickup: true, leave: "", happens: "", action: "", next: "" });
    if (airportIndex >= 0 && luggageArea !== pickupBaseArea) {
      const transferMinimum = airportTransferMinimum(plan.airport, luggageArea);
      const shiftedAirportIndex = airportIndex + 1;
      if (transferMinimum !== null) steps[shiftedAirportIndex] = { ...steps[shiftedAirportIndex], minutes: Math.max(Number(steps[shiftedAirportIndex].minutes || 0), transferMinimum) };
    }
    return { compatible: true, pickupMinutes: minutes, mode, storageArea: luggageArea, steps };
  }

  function totalMinutes(steps) {
    return steps.reduce((sum, step) => sum + Number(step.minutes || 0), 0);
  }

  function timingFacts(steps, start, airportPlan) {
    let cursor = new Date(start);
    let leaveAt = null;
    let airportArrivalAt = airportPlan ? new Date(start) : null;
    steps.forEach((step) => {
      if (isAirportTransferStep(step) && !leaveAt) {
        leaveAt = new Date(cursor);
        airportArrivalAt = new Date(cursor.getTime() + Number(step.minutes || 0) * 60000);
      }
      cursor = new Date(cursor.getTime() + Number(step.minutes || 0) * 60000);
    });
    return { leaveAt, airportArrivalAt, readyAt: cursor };
  }

  function scorePlan(plan, { startArea, interest, luggageMode, luggageArea, total, available }) {
    const exact = plan.area === startArea;
    const direct = plan.starts.includes(startArea);
    const nearby = isNearby(plan.area, startArea);
    let score = exact ? 90 : direct ? 55 : nearby ? 35 : 10;
    if (interest && plan.interest.includes(interest)) score += 50;
    if (plan.airportPlan && exact) score += 30;
    if (luggageMode === "return_elsewhere" && luggageArea) {
      if (plan.area === luggageArea) score += 40;
      else if (isNearby(plan.area, luggageArea)) score += 20;
      else if (AREA_REGIONS[plan.area] === AREA_REGIONS[luggageArea]) score -= 15;
      if (/Airport$/.test(plan.area || "") !== /Airport$/.test(luggageArea)) score -= 30;
    }
    score -= Math.min(20, Math.abs(available - total) / 30);
    return score;
  }

  function onJstDate(date, hhmm) {
    const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo" })
      .formatToParts(date)
      .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return new Date(`${parts.year}-${parts.month}-${parts.day}T${hhmm}:00+09:00`);
  }

  function planWindow(free, recommended, total, plan) {
    const earliest = new Date(Math.max(free.getTime(), onJstDate(free, plan.startMin).getTime()));
    const latest = new Date(Math.min(recommended.getTime() - total * 60000, onJstDate(free, plan.startMax).getTime()));
    return { earliest, latest, valid: earliest <= latest };
  }

  function isStartWithinWindow(start, window) {
    return Boolean(start && Number.isFinite(start.getTime()) && start >= window.earliest && start <= window.latest);
  }

  root.BYFPlannerCore = { enhanceData, inferArea, isNearby, pickupMinutes, airportTransferMinimum, areaMatches, normalizeLuggageMode, isAirportTransferStep, prepareSteps, withLuggageStep, totalMinutes, timingFacts, scorePlan, onJstDate, planWindow, isStartWithinWindow };
})(window);
