import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const pages = fs.globSync("**/index.html", { cwd: root }).sort();
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const redirects = fs.readFileSync(path.join(root, "_redirects"), "utf8").trim().split("\n").map((line) => line.split(/\s+/));

function pageUrl(relative) {
  return relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
}

function metadata(html, name) {
  return html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`, "i"))?.[1] || "";
}

function canonical(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
}

function localTarget(url) {
  const parsed = new URL(url, "https://beforeyouflyjapan.com");
  if (parsed.origin !== "https://beforeyouflyjapan.com") return null;
  if (parsed.pathname.startsWith("/api/")) return null;
  const raw = decodeURIComponent(parsed.pathname);
  if (raw === "/") return path.join(root, "index.html");
  if (path.extname(raw)) return path.join(root, raw.slice(1));
  return path.join(root, raw.slice(1), "index.html");
}

test("SEO layer and application layer are separated", () => {
  assert.equal(pages.length, 87);
  const planPages = pages.filter((name) => name.startsWith("plans/"));
  const placePages = pages.filter((name) => name.startsWith("places/"));
  assert.equal(planPages.length, 46);
  assert.equal(placePages.length, 30);
  for (const relative of planPages) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    assert.match(metadata(html, "robots"), /noindex,follow/);
    assert.ok(!sitemap.includes(`https://beforeyouflyjapan.com${pageUrl(relative)}`));
    assert.match(html, /id="your-timeline"/);
  }
  for (const relative of placePages) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    assert.match(metadata(html, "robots"), /^index,follow/);
    assert.match(html, /class="byf-verdict"/);
    assert.ok(sitemap.includes(`https://beforeyouflyjapan.com${pageUrl(relative)}`));
  }
  assert.equal((sitemap.match(/<url>/g) || []).length, 38);
});

test("metadata is unique, self-canonical and has one H1", () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const relative of pages) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
    const description = metadata(html, "description");
    assert.ok(title.length >= 10, `${relative}: missing title`);
    assert.ok(description.length >= 50, `${relative}: weak description`);
    assert.ok(!titles.has(title), `${relative}: duplicate title`);
    assert.ok(!descriptions.has(description), `${relative}: duplicate description`);
    titles.add(title);
    descriptions.add(description);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${relative}: H1 count`);
    assert.equal(canonical(html), `https://beforeyouflyjapan.com${pageUrl(relative)}`);
    assert.doesNotMatch(html, /&amp;#\d+;|WordPress|Twenty Twenty|wp-content|wp-includes/i);
  }
});

test("internal links resolve without redirect hops", () => {
  const redirectSources = new Set(redirects.map(([source]) => source));
  for (const relative of pages) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (/^(?:data:|mailto:|tel:|#)/.test(url)) continue;
      const parsed = new URL(url, "https://beforeyouflyjapan.com");
      if (parsed.origin !== "https://beforeyouflyjapan.com") continue;
      assert.ok(!redirectSources.has(parsed.pathname), `${relative}: internal redirect ${url}`);
      const target = localTarget(url);
      if (target) assert.ok(fs.existsSync(target), `${relative}: broken local link ${url}`);
    }
  }
});

test("redirects are one hop and targets exist", () => {
  const sources = new Set(redirects.map(([source]) => source));
  assert.equal(redirects.length, 117);
  for (const [source, target, status] of redirects) {
    assert.equal(status, "301", source);
    assert.ok(!sources.has(target), `${source}: redirect chain to ${target}`);
    const local = localTarget(target);
    assert.ok(local && fs.existsSync(local), `${source}: missing target ${target}`);
  }
});

test("priority guides contain decision support and source dates", () => {
  const required = {
    "before-late-flight-tokyo/index.html": ["Quick answer", "Example timeline", "What can go wrong", "Safer alternative", "Official sources"],
    "how-early-arrive-haneda-airport/index.html": ["Quick answer", "Recommended buffer", "Example:", "Transfer risk", "Official sources"],
    "after-hotel-checkout-tokyo/index.html": ["Quick answer", "Choose the luggage plan", "Calculate usable time", "Official sources"],
    "how-we-check/index.html": ["Sources we prioritize", "What the timing includes", "Our risk labels", "Correction policy"],
  };
  for (const [relative, phrases] of Object.entries(required)) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    for (const phrase of phrases) assert.ok(html.includes(phrase), `${relative}: missing ${phrase}`);
    assert.match(html, /2026-09-08/);
  }
});

test("planner scripts load safely and result links target the personalized timeline", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const planner = fs.readFileSync(path.join(root, "assets/planner.js"), "utf8");
  assert.match(home, /<script defer src="\/assets\/planner-core\.js/);
  assert.match(home, /<script defer src="\/assets\/planner-data\.js/);
  assert.match(home, /<script defer src="\/assets\/planner\.js/);
  assert.match(planner, /#your-timeline/);

  for (const relative of pages.filter((name) => name.startsWith("plans/"))) {
    const html = fs.readFileSync(path.join(root, relative), "utf8");
    assert.match(html, /<script defer src="\/assets\/plan-context\.js/);
  }
});

test("homepage exposes the current Search Console verification token once", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const token = '<meta name="google-site-verification" content="HHR-KfF6i7VxLJHq3Acgiq4nZ14VRq0HYPmX6iC-IaU">';
  assert.equal(home.split(token).length - 1, 1);
  assert.ok(home.indexOf(token) < home.indexOf("</head>"));
});
