import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const domain = "https://beforeyouflyjapan.com";
const numbered = fs.readdirSync(path.join(root, "plans")).filter((name) => /-[2-9]$/.test(name))
  .map((name) => [`/plans/${name}/`, `/plans/${name.replace(/-[2-9]$/, "")}/`]);
numbered.push(...fs.readdirSync(path.join(root, "places")).filter((name) => /-[2-9]$/.test(name))
  .map((name) => [`/places/${name}/`, `/places/${name.replace(/-[2-9]$/, "")}/`]));
const redirects = new Map(numbered);

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "assets/planner-data.js"), "utf8"), sandbox);
const plans = sandbox.window.BYF_STATIC_DATA.plans;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function text(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function attr(html, expression) {
  return html.match(expression)?.[1]?.trim() || "";
}

function extractBalanced(html, start, tag) {
  const open = new RegExp(`<${tag}\\b`, "ig");
  const close = new RegExp(`</${tag}>`, "ig");
  open.lastIndex = start;
  const first = open.exec(html);
  if (!first) return null;
  let depth = 1;
  let cursor = first.index + first[0].length;
  while (depth) {
    open.lastIndex = cursor;
    close.lastIndex = cursor;
    const nextOpen = open.exec(html);
    const nextClose = close.exec(html);
    if (!nextClose) return null;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      cursor = nextClose.index + nextClose[0].length;
    }
  }
  return html.slice(first.index, cursor);
}

function innerHtml(element) {
  return element.slice(element.indexOf(">") + 1, element.lastIndexOf("</"));
}

function cleanPath(urlPath) {
  return redirects.get(urlPath) || urlPath;
}

function replaceUrls(html) {
  for (const [from, to] of redirects) {
    html = html.replaceAll(`${domain}${from}`, `${domain}${to}`).replaceAll(from, to);
  }
  return html;
}

function siteHeader() {
  return `<header class="byf-site-header" lang="en"><a class="byf-site-brand" href="/" aria-label="Before You Fly home"><span aria-hidden="true">BYF</span> Before You Fly</a><nav aria-label="Primary navigation"><a href="/#planner">Plan your time</a><a href="/guides/">Guides</a><a href="/how-we-check/">How we check</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav></header>`;
}

function siteFooter() {
  return `<footer class="byf-site-footer" lang="en"><a href="/">Before You Fly</a><p>One more Japan experience, before you fly.</p><nav aria-label="Service information"><a href="/about/">About</a><a href="/how-we-check/">How we check information</a><a href="/disclaimer/">Disclaimer</a><a href="/privacy-policy/">Privacy</a><a href="/contact/">Contact</a></nav><small>Verified timings · Official sources · Japan Standard Time</small></footer>`;
}

function findPlan(urlPath) {
  return plans.find((plan) => new URL(plan.url).pathname === urlPath || cleanPath(new URL(plan.url).pathname) === urlPath);
}

function uniqueDescription(kind, title, hero, urlPath) {
  if (kind === "plan") {
    const plan = findPlan(urlPath);
    const airport = plan?.airport || (title.match(/Haneda/i) ? "Haneda" : title.match(/Narita/i) ? "Narita" : "Kansai Airport");
    return `A time-safe ${title} itinerary with a concrete timeline, luggage guidance, leave-by time and protected ${airport} arrival.`;
  }
  if (kind === "place") return `Use ${title} safely before a flight from Japan: airport fit, minimum useful time, luggage difficulty, risks and verified leave-by guidance.`;
  return hero || `Practical departure-day guidance from Before You Fly Japan.`;
}

function placeSummary(html, title, urlPath) {
  const related = plans.filter((plan) => html.includes(cleanPath(new URL(plan.url).pathname)));
  const airports = Object.fromEntries(["HND", "NRT", "KIX"].map((code) => [code, related.filter((plan) => plan.airport === code)]));
  const minutes = related.map((plan) => plan.min).filter(Number.isFinite);
  const minimum = minutes.length ? Math.min(...minutes) : null;
  const highLuggage = /Asakusa|Tsukiji|Ameyoko|Dotonbori|Harajuku|Kappabashi|Akihabara/i.test(title);
  const lowLuggage = /Airport|Shinagawa|Tokyo Station|Rinku|Umeda|Namba/i.test(title);
  const luggage = lowLuggage ? "Low" : highLuggage ? "High" : "Medium";
  const highWalking = /Asakusa|Meiji|Odaiba|Harajuku|Omotesando|Naritasan|Tokyo Tower/i.test(title);
  const walking = /Airport|Shinagawa|Shiodome/i.test(title) ? "Low" : highWalking ? "High" : "Medium";
  const supported = Object.entries(airports).filter(([, items]) => items.length).map(([code]) => code);
  const complexity = supported.includes("NRT") && !/Narita/i.test(title) ? "High" : supported.length > 1 ? "Medium" : /Airport|Shinagawa|Hamamatsucho|Rinku/i.test(title) ? "Low" : "Medium";
  const timeRisk = complexity === "High" || walking === "High" ? "High" : complexity === "Low" && walking === "Low" ? "Low" : "Medium";
  const bestFor = text(attr(html, /<div class="byf-plan-hero">[\s\S]*?<p>([\s\S]*?)<\/p>/i)) || title;
  const skip = text(attr(html, /<h3>When to skip it<\/h3>\s*<p>([\s\S]*?)<\/p>/i)) || "Skip it when live transport is disrupted, luggage adds a return trip, or your remaining window is below the minimum shown.";
  const rows = [
    ["Minimum useful time", minimum ? `${minimum} minutes before protected airport-ready time` : "Use the planner for your exact route"],
    ["Haneda suitability", airports.HND.length ? "Supported — use the planner for a route-specific leave-by time" : "Not currently a verified planner route"],
    ["Narita suitability", airports.NRT.length ? "Supported — protect the longer airport transfer" : "Not currently a verified planner route"],
    ["KIX suitability", airports.KIX.length ? "Supported — confirm the airport-bound train or bus live" : "Not currently a verified planner route"],
    ["Time risk", timeRisk], ["Luggage risk", luggage], ["Walking intensity", walking], ["Transfer complexity", complexity],
  ];
  return `<section class="byf-verdict" aria-labelledby="quick-verdict"><p class="byf-kicker">BEFORE-YOU-FLY VERDICT</p><h2 id="quick-verdict">Quick verdict</h2><p class="byf-verdict-lead"><b>Best for:</b> ${escapeHtml(bestFor)}</p><div class="byf-verdict-grid">${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</div><div class="byf-avoid"><b>Avoid if</b><p>${escapeHtml(skip)}</p></div><a class="byf-submit" href="/#planner">Check this place against my flight →</a></section>`;
}

function scripts(kind) {
  const analytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=GT-NGP9KVZR"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","GT-NGP9KVZR");</script>`;
  const adsense = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6391747094534886" crossorigin="anonymous"></script>`;
  const planner = kind === "home" ? `<script defer src="/assets/planner-core.js?v=20260908-1"></script><script defer src="/assets/planner-data.js?v=20260908-1"></script><script defer src="/assets/planner.js?v=20260908-1"></script>` : "";
  const context = kind === "plan" ? `<script defer src="/assets/planner-core.js?v=20260908-1"></script><script defer src="/assets/planner-data.js?v=20260908-1"></script><script defer src="/assets/plan-context.js?v=20260908-1"></script>` : "";
  return `${analytics}${adsense}${planner}${context}`;
}

function renderFile(file) {
  let html = replaceUrls(fs.readFileSync(file, "utf8"));
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const urlPath = relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
  const kind = urlPath === "/" ? "home" : urlPath.startsWith("/plans/") ? "plan" : urlPath.startsWith("/places/") ? "place" : "page";
  if (urlPath === "/contact/") return;
  const title = text(attr(html, /<title>([\s\S]*?)<\/title>/i)).replace(/\s+[–—-]\s+Before You Fly(?: Japan)?$/i, "") || "Before You Fly";
  const hero = text(attr(html, /<(?:div|section) class="(?:byf-plan-hero|byf-hero|byf-info-hero)[^"]*">[\s\S]*?<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/i));
  const description = uniqueDescription(kind, title, hero, urlPath);
  const entryStart = html.search(/<div class="entry-content\b/i);
  let content;
  if (entryStart >= 0) content = innerHtml(extractBalanced(html, entryStart, "div"));
  else {
    const mainStart = html.search(/<main\b/i);
    content = innerHtml(extractBalanced(html, mainStart, "main"));
  }
  content = content.replace(/<h1 class="wp-block-post-title">[\s\S]*?<\/h1>/gi, "").trim();
  if (kind === "place" && !content.includes("class=\"byf-verdict\"")) {
    const heroEnd = content.indexOf("</div>") + 6;
    content = `${content.slice(0, heroEnd)}${placeSummary(content, title, urlPath)}${content.slice(heroEnd)}`;
  }
  if (kind === "plan") content = content.replace(/<section class="byf-model"/, `<section class="byf-model" id="your-timeline"`);
  const robots = kind === "plan" || ["/contact/", "/privacy-policy/", "/disclaimer/"].includes(urlPath) ? "noindex,follow,max-image-preview:large" : "index,follow,max-image-preview:large";
  const canonical = `${domain}${urlPath}`;
  const bodyClass = `byf-static ${kind === "plan" ? "single-byf_plan" : kind === "place" ? "single-byf_place" : `page-${path.dirname(relative).replaceAll("/", "-")}`}`;
  const output = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} – Before You Fly</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${robots}">
<link rel="canonical" href="${canonical}"><meta property="og:type" content="${kind === "plan" ? "article" : "website"}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23173f5f%22/%3E%3Ccircle cx=%2243%22 cy=%2221%22 r=%2210%22 fill=%22%23b54434%22/%3E%3Cpath d=%22M14 42h36M22 34l8 8-8 8%22 fill=%22none%22 stroke=%22white%22 stroke-width=%224%22/%3E%3C/svg%3E"><link rel="stylesheet" href="/assets/byf.css?v=20260908-1"><link rel="stylesheet" href="/assets/seo.css?v=20260908-1">${scripts(kind)}</head>
<body class="${bodyClass}">${siteHeader()}<a class="skip-link screen-reader-text" href="#main-content">Skip to content</a><main id="main-content">${content}</main>${siteFooter()}</body></html>\n`;
  fs.writeFileSync(file, output);
}

for (const [from, to] of redirects) {
  const oldDir = path.join(root, from);
  const newDir = path.join(root, to);
  if (!fs.existsSync(oldDir)) continue;
  if (fs.existsSync(newDir)) throw new Error(`Target already exists: ${to}`);
  fs.renameSync(oldDir, newDir);
}

for (const file of fs.globSync("**/index.html", { cwd: root, exclude: [".git/**"] }).map((name) => path.join(root, name))) renderFile(file);

let dataSource = fs.readFileSync(path.join(root, "assets/planner-data.js"), "utf8");
dataSource = replaceUrls(dataSource);
fs.writeFileSync(path.join(root, "assets/planner-data.js"), dataSource);

const redirectLines = ["/wp-sitemap.xml /sitemap.xml 301"];
for (const [from, to] of redirects) {
  for (let suffix = 2; suffix <= 5; suffix += 1) {
    const variant = from.replace(/-[2-9]\/$/, `-${suffix}/`);
    redirectLines.push(`${variant} ${to} 301`);
  }
}
fs.writeFileSync(path.join(root, "_redirects"), `${[...new Set(redirectLines)].join("\n")}\n`);

const indexable = fs.globSync("**/index.html", { cwd: root }).map((name) => name === "index.html" ? "/" : `/${name.replace(/index\.html$/, "")}`)
  .filter((url) => !url.startsWith("/plans/") && !["/contact/", "/privacy-policy/", "/disclaimer/"].includes(url)).sort();
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((url) => `  <url><loc>${domain}${url}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

console.log(JSON.stringify({ htmlPages: fs.globSync("**/index.html", { cwd: root }).length, indexable: indexable.length, appStatePlans: plans.length, redirects: redirectLines.length - 1 }, null, 2));
