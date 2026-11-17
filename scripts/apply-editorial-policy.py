#!/usr/bin/env python3
"""Publish support-page copy and apply the site's editorial advertising roles.

Run after content/plan generators. --support-only touches the five owned support
pages; the normal pass covers every public index.html. --check is read-only.
No AdSense account settings, review requests or provider consent settings change.
"""
from pathlib import Path
import argparse
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-11-17'
PUBLISHER = 'ca-pub-6391747094534886'
TAG_ID = 'GT-NGP9KVZR'
AD_LOADER = f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={PUBLISHER}" crossorigin="anonymous"></script>'
OWNED = ['about/index.html', 'how-we-check/index.html', 'privacy-policy/index.html', 'disclaimer/index.html', 'for-hotels/index.html']
ROOT_GUIDES = {'after-hotel-checkout-tokyo/index.html', 'before-late-flight-tokyo/index.html', 'how-early-arrive-haneda-airport/index.html'}

SUPPORT = {
'about/index.html': (
 'About the Publisher and Our Departure-Day Guides',
 'Who publishes Before You Fly Japan, what its departure-day planner does, how the guides are researched and how to report a correction.',
 '''<p class="byf-kicker">ABOUT BEFORE YOU FLY JAPAN</p>
<h1>A useful last day, with a clear way to the airport.</h1>
<p>A checkout time and a flight time leave an awkward gap. A whole afternoon can look free until you add the suitcase at the hotel, the walk to the train and the journey to the right terminal. Before You Fly Japan helps turn that gap into one manageable last stop.</p>
<h2>Who publishes these guides</h2>
<p>Before You Fly Japan is the publisher and editorial identity of this website. The site combines English-language departure-day guides with a free planning tool for Haneda, Narita and Kansai International Airport. Editorial enquiries and corrections are handled through our <a href="/contact/">contact form</a>; choose “Report a correction” to flag a route, price or opening-hour issue.</p>
<h2>What you can decide here</h2>
<p>Start with your actual airport, flight date, free time, starting area and luggage. The planner compares authored routes and shows when to start, when to leave the final area and when to be ready for airline procedures. Destination guides explain what to see, how to reach a specific stop and when a simpler alternative makes more sense.</p>
<p>A station meal can be the right choice. A long shopping trip can be the wrong one even when the flight is late. Our recommendations are built around the entire route rather than a list of famous places.</p>
<h2>How the information is made</h2>
<p>We research airport, railway, attraction and local tourism sources, then write a compact visit and assign planning allowances for movement and delays. We use calculation checks and simulated traveller scenarios to review the results. These are desk-researched guides: a source review or a software test is not a claim that an editor walked the route, measured a queue or interviewed travellers on site.</p>
<p>Each guide identifies its sources and separates published facts from suggested visit lengths. Photographs carry their own credits and do not establish that we visited the location. See <a href="/how-we-check/">how we research and calculate a route</a> for the details.</p>
<h2>What stays with the operator</h2>
<p>Your airline sets check-in, baggage and boarding deadlines. Operators control train departures, admission, storage availability and closures. We do not make bookings, provide live queue measurements or guarantee that a model journey will run to the minute. When circumstances change, the optional stop should become shorter.</p>
<h2>Corrections and accommodation teams</h2>
<p>A useful correction includes the page address, the detail that has changed and an operator notice or other source when available. Please leave booking references and passport details out of the message. Hotels and hostels can also use our <a href="/for-hotels/">free guest-information cards</a> to introduce the planner at checkout.</p>
<p><small>Publisher information reviewed 17 November 2026.</small></p>'''),
'how-we-check/index.html': (
 'How We Research Routes and Calculate Departure Times',
 'How Before You Fly Japan separates official facts, editorial time allowances, route calculations and simulated testing in departure-day guides.',
 '''<p class="byf-kicker">OUR METHOD</p>
<h1>How we research a route and calculate its timing</h1>
<p>The number that matters is not how many hours remain before takeoff. It is the time left after reaching the correct terminal, collecting bags and protecting the airline procedures. Our guides explain the choices; the planner works backwards through an authored route.</p>
<h2>Sources we prioritize</h2>
<ul><li>Airports for terminal layouts, departure procedures and terminal transfers.</li><li>Airlines for their own check-in, bag-drop, boarding and assistance requirements.</li><li>Railways and other transport operators for routes, station approaches and published travel information.</li><li>Attractions, museums, markets and their operators for admission, access, prices and closure notices.</li><li>Local government and official tourism organisations for district context and maps.</li></ul>
<p>A source link should answer a particular question. A railway's quoted train ride does not automatically include the walk to its platform. A temple hall's hours do not establish the hours of neighbouring shops. If a price or route detail is not confirmed, we keep the claim conditional rather than filling the gap with a guess.</p>
<h2>What the timing includes</h2>
<p>Each plan is a sequence of stages. Depending on the route, those stages include reaching the visit area, the visit itself, a meal or break, luggage drop or retrieval, station access, waiting, transfers, the airport journey and movement inside the terminal. They are planning allowances, not live train departures or measured queues.</p>
<p>The airport-ready target is the point at which you can begin the required airline procedures at the correct terminal, with bags collected. The planner currently protects three hours before an international departure. This is our conservative default, not an instruction issued by every airline. An earlier airline instruction takes priority; the planner does not automatically read your airline's rules.</p>
<h2>An example of the arithmetic</h2>
<p>For a 21:00 flight, the three-hour model gives an 18:00 airport-ready target. If a complete journey takes an illustrative 90 minutes and a bag pickup takes 20 more, the last activity must end by 16:10 at the pickup location. A separate walk or detour to that location must finish earlier. The example is arithmetic, not a published timetable.</p>
<p>A short local visit and the complete airport plan are different figures. “45–60 minutes at the temple” does not mean that a flight in an hour is feasible. The guide keeps the local visit estimate separate from the model that includes transport.</p>
<h2>How a plan is reviewed</h2>
<ol><li>Identify a named visit, a usable station approach and a return corridor.</li><li>Read the relevant official source and record the scope and date of that check.</li><li>Assign stage allowances and calculate the complete route backwards from the airport-ready target.</li><li>Check that the visiting stage fits the available opening information and closure rules.</li><li>Exercise starting areas, luggage choices, walking needs, date boundaries and urgent cases in software tests.</li><li>Compare the displayed duration, example stages and personalised results, including the page a traveller opens directly.</li></ol>
<p>The scenario checks are simulated. They can reveal arithmetic errors, impossible opening-hour combinations and missing allowances; they do not measure real traveller satisfaction, actual train punctuality or a route's step-free condition.</p>
<h2>Opening hours and uncertain dates</h2>
<p>Venue-specific rules are used where they are available. Some general shopping stages use a conservative district window, which is not a promise that a chosen shop is open throughout it. A museum that only opens during exhibitions needs a checked calendar; an unverified future date should not be treated as an available visit.</p>
<p>A verified source fact, an editorial estimate and a simulated test answer different questions. “Reviewed” means that the stated source or model was checked on the date shown. It does not mean an editor recently visited every stop or that conditions cannot change.</p>
<h2>Our risk labels</h2>
<p><strong>Time risk</strong> describes how queues, walking and transfers can reduce spare time. <strong>Luggage risk</strong> describes storage searches or return detours. <strong>Transfer complexity</strong> concerns station changes, terminal changes and route navigation. These are editorial judgements for comparison, not measured probabilities.</p>
<h2>Correction policy</h2>
<p>When an official notice or a reproducible error changes the advice, we revise the affected route or withdraw the recommendation. A shared change, such as a terminal transfer or fee, can require several guides to be updated. A route that no longer fits should lead back to the planner, with an explanation and a simpler option where one is supported.</p>
<p><a href="/contact/">Report a specific page or timing correction</a> · <a href="/guides/">Browse the departure-day guides</a></p>
<p><small>Method reviewed 17 November 2026. Individual sources and route records have their own dates.</small></p>'''),
'privacy-policy/index.html': (
 'Privacy Policy',
 'How Before You Fly Japan handles browser-stored planner conditions, shared URLs, Google Analytics, advertising technology and contact enquiries.',
 '''<p class="byf-kicker">PRIVACY</p>
<h1>Privacy Policy</h1>
<p><strong>Last updated: 17 November 2026</strong></p>
<p>Before You Fly Japan publishes this website and handles enquiries through its <a href="/contact/">contact form</a>. This policy explains the information used by the planner, hosting, measurement and contact services.</p>
<h2>Planner conditions in your browser</h2>
<p>The route calculation runs in your browser. We do not create a traveller account or save your entered flight and free-time conditions to a traveller profile. The browser tab uses session storage to remember the airport, dates and times, starting area, luggage choice, interests and walking preference while you revise a plan. Closing the tab normally ends that storage session; browser restore features may preserve it.</p>
<h2>Plan links and hosting requests</h2>
<p>A personalised plan address contains conditions such as the flight time, starting area and luggage choice. Anyone receiving that address can read those conditions. URLs can also remain in browser history, and the hosting provider receives the requested URL when serving a page. Do not put booking references, passport information, payment details or health information in the planner or a shared address.</p>
<h2>Google Analytics and site measurement</h2>
<p>We use Google Analytics to understand pages viewed and actions such as starting or completing the planner and selecting a plan. Our Google tag configuration supplies page addresses and referrers without their query strings or fragments. Our custom planner events use limited fields such as the airport, starting area, available minutes, luggage category and route identifier; they do not include the entered flight or free-time timestamps.</p>
<p>Google may process device, browser, approximate location, identifiers and interaction information under its own policies. Analytics may use cookies. Cloudflare supplies hosting, traffic security and site-performance measurement and may process IP addresses, request information, browser details and similar technical data. URL sanitisation for our Google tag does not remove the URL from your browser, shared links or hosting requests.</p>
<p>See <a href="https://policies.google.com/privacy">Google's privacy policy</a> and <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare's privacy policy</a> for their handling of data.</p>
<h2>Advertising and Google cookies</h2>
<p>Editorial guides may carry Google-provided advertising. Third-party vendors, including Google, may use cookies and other identifiers to serve ads based on previous visits to this or other websites. Google's advertising cookies enable Google and its partners to serve personalised ads based on those visits.</p>
<p>You can manage personalised advertising through <a href="https://myadcenter.google.com/">Google My Ad Center</a>, and review participating vendors' choices through <a href="https://optout.aboutads.info/">YourAdChoices</a>. These controls do not necessarily stop all advertising. Browser privacy settings can block or delete cookies and restrict storage; that may affect website functions.</p>
<h2>Contact enquiries</h2>
<p>The contact form processes the name, reply email, enquiry type and message you provide. Cloudflare Turnstile supplies a security check, and our server uses rate limits and validation to reduce abuse. Resend delivers the notification email to the site's enquiry inbox. We use the submitted contact information to handle the enquiry and do not publish it on the website.</p>
<p>Please avoid sensitive documents or private booking details. You may request correction or deletion of an enquiry through the same form. Identification of the relevant message may be needed before it can be located.</p>
<h2>Questions and changes</h2>
<p>For a privacy question, contact Before You Fly Japan through the <a href="/contact/">enquiry form</a>. We update this page when our services or data practices materially change.</p>'''),
'disclaimer/index.html': (
 'Planning Limits and Disclaimer',
 'What Before You Fly Japan estimates can and cannot establish about transport, airport deadlines, opening hours, access, luggage and bookings.',
 '''<p class="byf-kicker">PLANNING LIMITS</p>
<h1>What a departure-day plan can tell you</h1>
<p>Before You Fly Japan helps compare a manageable last stop with the journey to your airport. The guide and calculator provide planning guidance. They do not reserve transport or admission, confirm a flight, or guarantee arrival and boarding.</p>
<h2>Published facts and planning estimates</h2>
<p>We identify official information where available and add editorial allowances for a useful visit, walking, waiting, luggage and terminal movement. A suggested duration is not a live timetable, an observed queue or a promise that a shop will be open. Source and model dates describe the checks carried out; they do not replace current operational notices.</p>
<h2>Airline instructions take priority</h2>
<p>The planner's three-hour airport-ready default is for international departures and is not a universal airline rule. Check-in, bag-drop and boarding can have separate deadlines. If your airline asks you to arrive earlier, use that earlier time. Domestic flights, connections, special assistance and unusual baggage need the relevant airline's arrangements.</p>
<h2>When the optional visit should end</h2>
<p>Transport disruption, a storage problem, a long queue or a terminal change can remove spare time. Shorten or abandon sightseeing and use an appropriate current airport route. Recalculating a model cannot create a train service, a vacant locker or an open airline counter.</p>
<h2>Access, prices and purchases</h2>
<p>Step-free access must be established for the exact station and venue route; a walking allowance does not certify accessibility. Published prices, ticket conditions and opening hours can change. Purchases and bookings are made with the operator under its own terms, and we cannot change them for you.</p>
<p><a href="/how-we-check/">Read how we research and calculate routes</a> · <a href="/contact/">Report an error in a specific guide</a></p>
<p><small>Reviewed 17 November 2026.</small></p>'''),
}

ANALYTICS_SCRIPT = '''<!-- BYF:privacy-analytics --><script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
(function(){
  function pageOnly(value){try{var u=new URL(value,window.location.origin);return /^https?:$/.test(u.protocol)?u.origin+u.pathname:"";}catch(e){return "";}}
  var context={page_location:pageOnly(window.location.href),page_referrer:document.referrer?pageOnly(document.referrer):""};
  gtag("js",new Date());
  gtag("set",context);
  gtag("config","GT-NGP9KVZR",context);
})();
</script><!-- /BYF:privacy-analytics -->'''


def editable_pages():
    return sorted(p for p in ROOT.rglob('index.html') if not any(x in p.relative_to(ROOT).parts for x in ['.git', 'node_modules', 'preview-dist', '.openai']))


def eligible(relative, text):
    if not re.search(r'<meta\s+name="robots"\s+content="index,follow', text):
        return False
    return relative.startswith('places/') or (relative.startswith('guides/') and relative != 'guides/index.html') or relative in ROOT_GUIDES


def support_pages():
    for relative, (title, description, body) in SUPPORT.items():
        p = ROOT / relative
        text = p.read_text()
        main = '<main id="main-content"><article class="byf-info-page">' + body + '</article></main>'
        text, count = re.subn(r'<main\b[\s\S]*?</main>(?=\s*<footer)', lambda _: main, text, count=1)
        if count != 1:
            raise ValueError('Could not identify support main: ' + relative)
        text = re.sub(r'<title>[\s\S]*?</title>', '<title>' + html.escape(title) + ' — Before You Fly</title>', text)
        for attr, value in [('name="description"', description), ('property="og:title"', title), ('property="og:description"', description)]:
            text = re.sub(r'(<meta ' + attr + r' content=")[^"]*', lambda m: m[1] + html.escape(value, quote=True), text)
        p.write_text(text)
    p = ROOT / 'for-hotels/index.html'
    text = p.read_text()
    # Repair the retained nested main landmarks while preserving the actual downloadable cards.
    text = text.replace('<main id="main-content"><main class="byf-hotel-page" lang="ja">', '<main id="main-content" class="byf-hotel-page" lang="ja">').replace('</main></main><footer', '</main><footer')
    text = text.replace('出発前の時間に収まる確認済みプランを探せる無料のWebツールです。', '荷物の回収や空港への移動を含めて、帰国日にできることを考える無料のWebツールです。')
    text = text.replace('観光サイトへのリンクではなく、出発時刻から逆算するツールです。', 'フライト時刻から、空港へ向かう時刻を逆算します。')
    text = re.sub(r'<!-- BYF:hotel-method -->[\s\S]*?<!-- /BYF:hotel-method -->', '', text)
    note = '''<!-- BYF:hotel-method --><section class="byf-hotel-section"><h2>ゲストへ案内する際のひとこと</h2><p>「荷物を取りに戻る場所も入力すると、空港へ向かう時刻まで含めて計画できます」とお伝えいただくと、使い方が分かりやすくなります。</p><p>表示される時刻は、公式情報と余裕時間をもとにした計画上の目安です。列車の発車時刻や、実際の混雑をその場で取得するサービスではありません。航空会社から早めの到着を案内されている場合は、そちらを優先してください。</p><p><a href="/how-we-check/" lang="en">How the routes and timing are researched</a> · <a href="/contact/">掲載内容について問い合わせる</a></p><small>案内内容を2026年11月17日に見直しました。</small></section><!-- /BYF:hotel-method -->'''
    text = text.replace('</main><footer', note + '</main><footer')
    p.write_text(text)


def apply(text, relative):
    # Publisher verification is separate from ad placement. The meta tag preserves
    # the existing account identifier without loading the advertising runtime.
    text = re.sub(r'<meta\s+name=["\']google-adsense-account["\'][^>]*>\s*', '', text, flags=re.I)
    text = text.replace('</head>', f'<meta name="google-adsense-account" content="{PUBLISHER}"></head>')
    text = re.sub(r'<script\b[^>]*\bsrc=["\'][^"\']*adsbygoogle\.js[^"\']*["\'][^>]*>\s*</script>', '', text, flags=re.I)
    if eligible(relative, text):
        text = text.replace('</head>', AD_LOADER + '</head>')
    else:
        text = re.sub(r'<ins\b[^>]*class=["\'][^"\']*adsbygoogle[^"\']*["\'][^>]*>[\s\S]*?</ins>', '', text, flags=re.I)
        text = re.sub(r'<script\b(?![^>]*\bsrc=)[^>]*>(?:(?!</script>)[\s\S])*?adsbygoogle\s*(?:=|\.)[\s\S]*?</script>', '', text, flags=re.I)
    # Replace the previous inline initialiser, never append a second config.
    text = re.sub(r'<!-- BYF:privacy-analytics -->[\s\S]*?<!-- /BYF:privacy-analytics -->', '', text)
    text = re.sub(r'<script\b(?![^>]*\bsrc=)[^>]*>(?:(?!</script>)[\s\S])*?gtag\s*\(\s*["\']config["\']\s*,\s*["\']GT-NGP9KVZR["\'][\s\S]*?</script>', '', text)
    # Existing pages all use this Google tag. Keep the external loader and place
    # a single reviewed initialiser immediately afterwards (async load is safe).
    tag = re.search(r'<script\b[^>]*\bsrc=["\'][^"\']*googletagmanager\.com/gtag/js[^"\']*["\'][^>]*>\s*</script>', text)
    if tag:
        text = text[:tag.end()] + ANALYTICS_SCRIPT + text[tag.end():]
    text = text.replace('Verified timings · Official sources · Japan Standard Time', 'Planning estimates · Official sources · Japan Standard Time')
    return text


def verify(pages):
    problems = []
    for p in pages:
        rel = p.relative_to(ROOT).as_posix()
        text = p.read_text()
        metas = re.findall(r'<meta name="google-adsense-account" content="([^"]+)">', text)
        ads = len(re.findall(r'<script\b[^>]*src="[^"]*adsbygoogle\.js', text))
        if metas != [PUBLISHER]: problems.append(rel + ': publisher meta')
        if ads != int(eligible(rel, text)): problems.append(rel + ': advertising role')
        if 'googletagmanager.com/gtag/js' in text and text.count('<!-- BYF:privacy-analytics -->') != 1: problems.append(rel + ': analytics context')
        if 'Verified timings · Official sources' in text: problems.append(rel + ': unqualified footer')
    return problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--support-only', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    pages = [ROOT / r for r in OWNED] if args.support_only else editable_pages()
    if not args.check:
        # Validate against the actual existing public account ID, not a new or
        # guessed AdSense account. Existing meta tags also allow repeat runs.
        ids = set()
        for p in editable_pages():
            ids.update(re.findall(r'ca-pub-\d+', p.read_text()))
        if ids != {PUBLISHER}: raise ValueError('Unexpected publisher IDs: ' + str(ids))
        support_pages()
        for p in pages:
            p.write_text(apply(p.read_text(), p.relative_to(ROOT).as_posix()))
        (ROOT / 'ads.txt').write_text('google.com, pub-6391747094534886, DIRECT, f08c47fec0942fa0\n')
    issues = verify(pages)
    allowed = sum(eligible(p.relative_to(ROOT).as_posix(), p.read_text()) for p in pages)
    print(json.dumps({'checked': len(pages), 'adEligible': allowed, 'adExcluded': len(pages) - allowed, 'issues': issues}))
    if issues: raise SystemExit(1)

if __name__ == '__main__':
    main()
