import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const descriptions = {
  "/": "Enter your flight, free time, starting area and luggage to get a verified Japan plan with a clear leave-by time and protected airport arrival.",
  "/about/": "Why Before You Fly works backwards from your flight to show what you can still safely do before leaving Japan.",
  "/guides/": "Departure-day guides for luggage, airport buffers and safe use of the time between hotel checkout and a flight from Japan.",
  "/after-hotel-checkout-tokyo/": "Decide where to store luggage, calculate usable time and choose a safe Tokyo plan after checkout before Haneda or Narita.",
  "/before-late-flight-tokyo/": "Use a late departure day in Tokyo safely with a fixed leave-by time, luggage plan, airport comparison and example timeline.",
  "/how-early-arrive-haneda-airport/": "A practical international-departure buffer for Haneda, with terminal checks, transfer risks and an example leave-by timeline.",
  "/how-we-check/": "How Before You Fly verifies official sources, walking, waiting, luggage, transfers, airport buffers and last-checked dates.",
  "/for-hotels/": "Free printable Before You Fly QR cards for hotels and hostels helping guests plan the time between checkout and departure.",
  "/privacy-policy/": "How Before You Fly Japan handles planner inputs, analytics, advertising cookies and contact enquiries.",
  "/disclaimer/": "Planning limitations and traveler responsibilities when using Before You Fly Japan departure-day guidance.",
};

function decode(value) {
  let output = value;
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  for (let pass = 0; pass < 3; pass += 1) {
    output = output.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, name) => named[name]);
  }
  return output.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escape(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

for (const relative of fs.globSync("**/index.html", { cwd: root })) {
  const file = path.join(root, relative);
  let html = fs.readFileSync(file, "utf8");
  const url = relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
  const h1 = decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "Before You Fly");
  const pageTitle = url === "/" ? "Before You Fly — Verified plans for your last hours in Japan" : `${h1} — Before You Fly`;
  const description = descriptions[url] || (url.startsWith("/plans/")
    ? `A time-safe ${h1} itinerary with a concrete timeline, luggage guidance, leave-by time and protected airport arrival.`
    : url.startsWith("/places/")
      ? `Use ${h1} safely before a flight from Japan: airport fit, minimum useful time, luggage difficulty, risks and verified guidance.`
      : "Practical departure-day guidance from Before You Fly Japan.");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(pageTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escape(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escape(h1)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escape(description)}">`);
  fs.writeFileSync(file, html);
}

const contactFile = path.join(root, "contact/index.html");
let contact = fs.readFileSync(contactFile, "utf8")
  .replace('content="index,follow,max-image-preview:large"', 'content="noindex,follow,max-image-preview:large"')
  .replace('/wp-content/plugins/before-you-fly-core/assets/byf.css?v=20260830-contact', '/assets/byf.css?v=20260908-1');
fs.writeFileSync(contactFile, contact);

const hotelsFile = path.join(root, "for-hotels/index.html");
let hotels = fs.readFileSync(hotelsFile, "utf8").replaceAll("https://beforeyouflyjapan.com/wp-content/plugins/before-you-fly-core/assets/hotel/", "/assets/hotel/");
fs.writeFileSync(hotelsFile, hotels);
console.log("Metadata and moved asset references normalized.");
