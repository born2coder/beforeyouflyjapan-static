import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "assets/planner-data.js"), "utf8"), sandbox);
const plans = sandbox.window.BYF_STATIC_DATA.plans;
const planPages = new Map(plans.map((plan) => [new URL(plan.url).pathname, fs.readFileSync(path.join(root, new URL(plan.url).pathname.slice(1), "index.html"), "utf8")]));

function escape(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function plain(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
}

function extractSection(html, start) {
  const pattern = /<section\b|<\/section>/ig;
  pattern.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = pattern.exec(html))) {
    depth += match[0][1] === "/" ? -1 : 1;
    if (depth === 0) return { start, end: pattern.lastIndex };
  }
  throw new Error("Unclosed verdict section");
}

for (const relative of fs.globSync("places/*/index.html", { cwd: root })) {
  const file = path.join(root, relative);
  let html = fs.readFileSync(file, "utf8");
  const placePath = `/${relative.replace(/index\.html$/, "")}`;
  const title = plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "This place");
  const related = plans.filter((plan) => planPages.get(new URL(plan.url).pathname)?.includes(`href="${placePath}`));
  const airportPlans = Object.fromEntries(["HND", "NRT", "KIX"].map((code) => [code, related.filter((plan) => plan.airport === code)]));
  const minimum = related.length ? Math.min(...related.map((plan) => plan.min)) : null;
  const highLuggage = /Asakusa|Tsukiji|Ameyoko|Dotonbori|Harajuku|Kappabashi|Akihabara/i.test(title);
  const lowLuggage = /Airport|Shinagawa|Tokyo Station|Rinku|Umeda|Namba/i.test(title);
  const luggage = lowLuggage ? "Low" : highLuggage ? "High" : "Medium";
  const walking = /Airport|Shinagawa|Shiodome/i.test(title) ? "Low" : /Asakusa|Meiji|Odaiba|Harajuku|Omotesando|Naritasan|Tokyo Tower/i.test(title) ? "High" : "Medium";
  const supported = Object.entries(airportPlans).filter(([, items]) => items.length).map(([code]) => code);
  const complexity = supported.includes("NRT") && !/Narita/i.test(title) ? "High" : /Airport|Shinagawa|Hamamatsucho|Rinku/i.test(title) ? "Low" : "Medium";
  const timeRisk = complexity === "High" || walking === "High" ? "High" : complexity === "Low" && walking === "Low" ? "Low" : "Medium";
  const bestFor = plain(html.match(/<div class="byf-plan-hero">[\s\S]*?<h1[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1] || title);
  const avoid = plain(html.match(/<h3>When to skip it<\/h3>\s*<p>([\s\S]*?)<\/p>/i)?.[1] || "Skip it when live transport is disrupted or the remaining window is below the verified minimum.");
  const fit = (code, label) => airportPlans[code].length ? `${label} supported — use the planner for a route-specific leave-by time` : "Not currently a verified planner route";
  const rows = [
    ["Minimum useful time", minimum ? `${minimum} minutes before protected airport-ready time` : "Use the planner for your exact route"],
    ["Haneda suitability", fit("HND", "HND")], ["Narita suitability", fit("NRT", "NRT")], ["KIX suitability", fit("KIX", "KIX")],
    ["Time risk", timeRisk], ["Luggage risk", luggage], ["Walking intensity", walking], ["Transfer complexity", complexity],
  ];
  const verdict = `<section class="byf-verdict" aria-labelledby="quick-verdict"><p class="byf-kicker">BEFORE-YOU-FLY VERDICT</p><h2 id="quick-verdict">Quick verdict</h2><p class="byf-verdict-lead"><b>Best for:</b> ${escape(bestFor)}</p><div class="byf-verdict-grid">${rows.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join("")}</div><div class="byf-avoid"><b>Avoid if</b><p>${escape(avoid)}</p></div><a class="byf-submit" href="/#planner">Check this place against my flight →</a></section>`;
  const start = html.indexOf('<section class="byf-verdict"');
  const range = extractSection(html, start);
  html = `${html.slice(0, range.start)}${verdict}${html.slice(range.end)}`;
  fs.writeFileSync(file, html);
}

console.log("Updated 30 place verdicts from the plan-to-place graph.");
