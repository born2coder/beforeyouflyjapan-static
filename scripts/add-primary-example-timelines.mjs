import fs from "node:fs";

const timelines = {
  "places/haneda-airport/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time and assumes the airline has not set an earlier deadline.", ["3:00 PM — Leave central Tokyo", "4:00 PM — Reach the correct Haneda terminal", "4:20 PM — Finish terminal and airline checks", "5:50 PM — End one meal, shop or observation stop", "6:00 PM — Be at the airline check-in area"]],
  "places/tsukiji-outer-market/index.html": ["Example: 6:00 PM Haneda flight", "This market-day example protects a 3:00 PM airport-ready time and keeps the visit inside Tsukiji’s useful morning window.", ["11:40 AM — Start the plan with luggage already stored", "12:05 PM — Reach Tsukiji", "1:35 PM — Finish one focused food visit", "1:55 PM — Reach the airport departure station", "3:00 PM — Arrive at Haneda"]],
  "places/tokyo-tower/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time; skip the deck if its queue threatens the fixed turnaround.", ["1:50 PM — Start toward Zojoji", "2:20 PM — Begin the temple visit", "3:35 PM — Reach Tokyo Tower", "4:50 PM — Leave the tower area", "6:00 PM — Arrive at Haneda"]],
  "places/omotesando/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time and assumes large bags are stored before Harajuku.", ["1:10 PM — Start toward Harajuku", "1:35 PM — Begin the Harajuku stop", "3:10 PM — Start one Omotesando shop or meal", "4:25 PM — Turn back toward the station", "6:00 PM — Arrive at Haneda"]],
  "places/shiodome/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time and stays on one simple pedestrian-deck route.", ["3:05 PM — Start toward Shiodome", "3:30 PM — Begin the short walk", "4:45 PM — Turn back toward the airport route", "5:05 PM — Board the Haneda-bound route", "6:00 PM — Arrive at Haneda"]],
  "places/nihonbashi/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time and limits shopping to one store or food hall.", ["3:00 PM — Start toward Nihonbashi", "3:25 PM — Begin the bridge-and-store walk", "4:35 PM — Turn back toward Tokyo Station", "4:55 PM — Join the airport route", "6:00 PM — Arrive at Haneda"]],
  "places/naritasan-shinshoji/index.html": ["Example: 8:00 PM Narita flight", "This example protects a 5:00 PM airport-ready time with luggage stored near Narita Station and a confirmed return train.", ["1:15 PM — Start toward Narita town", "1:35 PM — Begin the Naritasan visit", "3:05 PM — Use Omotesando for one meal or shop", "4:05 PM — Return to Narita Station", "5:00 PM — Arrive at Narita Airport"]],
  "places/toyosu/index.html": ["Example: 6:00 PM Haneda flight", "This market-day example protects a 3:00 PM airport-ready time and assumes the official market calendar is open.", ["10:25 AM — Start toward Toyosu", "11:00 AM — Begin one market breakfast", "12:30 PM — Walk the waterfront", "1:30 PM — Return to Toyosu Station", "3:00 PM — Arrive at Haneda"]],
  "places/shinagawa/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time and keeps luggage with you or in confirmed station storage.", ["3:30 PM — Start toward Shinagawa", "3:50 PM — Choose one station-side meal or shop", "5:05 PM — Finish and return to the correct platform", "5:20 PM — Join the Haneda route", "6:00 PM — Arrive at Haneda"]],
  "places/asakusa-sensoji/index.html": ["Example: 9:00 PM Haneda flight", "This example protects a 6:00 PM airport-ready time. For Narita, use the planner’s longer 250-minute route instead.", ["2:15 PM — Start toward Asakusa with luggage stored", "2:45 PM — Enter through Kaminarimon", "4:30 PM — Finish Sensoji and one nearby street", "4:50 PM — Leave Asakusa Station", "6:00 PM — Arrive at Haneda"]],
};

for (const [file, [heading, note, items]] of Object.entries(timelines)) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("byf-example-timeline")) continue;
  const list = items.map((item) => {
    const [time, action] = item.split(" — ");
    return `<li><b>${time} —</b> ${action}</li>`;
  }).join("");
  const block = `<section class="byf-example-timeline"><p class="byf-kicker">EXAMPLE TIMELINE</p><h2>${heading}</h2><p>${note}</p><ol class="byf-numbered">${list}</ol></section>`;
  const marker = '<aside class="byf-primary-links"';
  if (!html.includes(marker)) throw new Error(`${file}: related-link marker missing`);
  html = html.replace(marker, `${block}${marker}`);
  fs.writeFileSync(file, html);
}

console.log(`Added example timelines to ${Object.keys(timelines).length} Primary Place pages.`);
