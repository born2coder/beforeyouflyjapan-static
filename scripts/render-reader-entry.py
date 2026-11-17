"""Show useful departure choices before requiring any planner input."""
from pathlib import Path
import re,json,html
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
esc=lambda x:html.escape(x,quote=True)
examples='''<section class="byf-home-examples" id="departure-choices"><p class="byf-kicker">START WITH THE DAY YOU ACTUALLY HAVE</p><h2>Where are your bags, and which way is the airport?</h2><p>A good final stop leaves you on the right side of the city. These three choices explain the route before you enter a flight time.</p><div class="byf-home-choices"><article class="byf-home-choice"><h3>Bags waiting in Shinagawa · Haneda flight</h3><p>Keep the last meal near Shinagawa. JR’s ecute shops are inside the JR gates; the Keikyu airport train uses a separate gate. Collect the bag and leave time to reach Keikyu rather than adding a cross-city shopping trip.</p><a href="/places/shinagawa/">See the station, food and bag choices →</a></article><article class="byf-home-choice"><h3>A Narita flight · temple or Tokyo?</h3><p>Narita town offers the temple and Omotesando street, but the station walk and the return still take time. With bags in central Tokyo, a detour to Narita town can be less practical than going straight to the terminal.</p><a href="/guides/narita-departure-day/">Compare Tokyo, Narita town and the airport →</a></article><article class="byf-home-choice"><h3>Osaka checkout · KIX flight</h3><p>From Namba, a compact Minami stop keeps you near Nankai. From Umeda, collect bags and use the departure point for your chosen train or bus. For KIX Terminal 2, station arrival still leaves a shuttle journey.</p><a href="/guides/after-hotel-checkout-osaka/">Choose a final Osaka stop without a luggage detour →</a></article></div><p><strong>All times are Japan Standard Time.</strong> The planner uses published information and conservative estimates, not live train departures or airline-specific clearance. Its three-hour airport-procedure allowance is a model; an earlier airline requirement needs an earlier journey.</p></section>'''
f=ROOT/'index.html';s=f.read_text();s=re.sub(r'<!-- BYF:reader-entry -->.*?<!-- /BYF:reader-entry -->','',s,flags=re.S)
# Keep the calculator prominent; the three decision examples are immediately after it.
main=BeautifulSoup(s,'html.parser').select_one('main');first=next((x for x in main.children if getattr(x,'name',None)),None)
if first:
 raw=str(first)
 # Existing markup is not normalized; insertion after first top-level hero/app section by balanced parser position is safer via DOM main serialization.
 first.insert_after(BeautifulSoup('<!-- BYF:reader-entry -->'+examples+'<!-- /BYF:reader-entry -->','html.parser'))
 s=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:str(main),s,flags=re.S)
if '/assets/usefulness.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/assets/usefulness.css?v=20261117-1"></head>')
s=s.replace('Build your time-safe plan','Build your departure plan').replace('Show my verified options','Show my departure options').replace('Enjoy the plan, then stop exactly when the timeline tells you to leave.','Enjoy the stop, use the leave-by estimate and recheck live transport before setting off.').replace('Compare safe options by the experience you want to take home.','Compare the routes that fit your entered conditions and the experience you want to take home.')
f.write_text(s)
# Rebuild the directory once, with a single list per reader task instead of multiple lists of the same guides.
f=ROOT/'guides/index.html';s=f.read_text();soup=BeautifulSoup(s,'html.parser');hero=soup.select_one('main .byf-plan-hero')
practical=json.loads((ROOT/'content/place-practical.json').read_text());models=json.loads(__import__('subprocess').check_output(['node','scripts/visit-models.cjs'],cwd=ROOT,text=True))
questions=[('/how-early-arrive-haneda-airport/','Haneda: when to arrive and how to work backwards'),('/guides/how-early-arrive-narita-airport/','Narita: correct terminal, station walk and arrival time'),('/guides/how-early-arrive-kansai-airport/','KIX: Terminal 1 or the Terminal 2 shuttle'),('/guides/haneda-terminal-3-departure-guide/','Haneda T3: where to go before and after security'),('/guides/haneda-airport-open-24-hours/','Haneda overnight: terminal rules and flights after midnight')]
situations=[('/after-hotel-checkout-tokyo/','Tokyo after checkout: choose storage before the last stop'),('/before-late-flight-tokyo/','A late Tokyo flight: choose a meal, district or airport'),('/guides/after-hotel-checkout-osaka/','Osaka after checkout: Namba, Umeda and bag collection'),('/guides/before-late-flight-osaka/','A late Osaka flight: dinner without a rushed KIX return'),('/guides/luggage-before-flight-japan/','Hotel, station or airport: where should bags wait?')]
linklist=lambda a:'<ul>'+''.join('<li><a href="'+u+'">'+esc(t)+'</a></li>' for u,t in a)+'</ul>'
intro='<div class="byf-plan-hero byf-editorial-hero"><p class="byf-kicker">DEPARTURE-DAY GUIDES</p><h1>Choose a last stop you can enjoy, then leave on time.</h1><p>Start with the question you need answered: where to leave bags, which airport terminal to reach, or what is worth a short visit. Each guide explains a practical choice before sending you to the planner.</p></div>'
body='<main id="main-content">'+intro+'<div class="byf-reader-directory"><section id="search-answers"><h2>Airport questions, answered</h2>'+linklist(questions)+'</section><section><h2>After checkout or before a late flight</h2>'+linklist(situations)+'</section><section><h2>Compare the whole departure route</h2>'+linklist([('/guides/haneda-departure-day/','Haneda: compare final Tokyo stops'),('/guides/narita-departure-day/','Narita: Tokyo, Narita town or the terminal?'),('/guides/kansai-departure-day/','KIX: Namba, Umeda, Rinku or the airport?')])+'</section><section class="byf-place-directory" id="places"><h2>All 40 places: choose by your departure airport</h2><p>The suggested local visit and the planner’s complete itinerary are shown separately. Some complete routes include more than the place in the title. The gallery calendar currently needs a new review and is not offered as a current planner option.</p>'
for code,name in [('HND','Haneda'),('NRT','Narita'),('KIX','Kansai')]:
 body+='<h3>'+name+' departure options</h3><ul class="byf-destination-list">'
 for slug,m in models.items():
  if any(x['airport']==code for x in m['routes']):
   title=BeautifulSoup((ROOT/f'places/{slug}/index.html').read_text(),'html.parser').h1.get_text(' ',strip=True)
   body+='<li><a href="/places/'+slug+'/">'+esc(title)+'</a></li>'
 body+='</ul>'
body+='</section><section><h2>Ready to check your own flight?</h2><p>Enter the actual date, starting area and bag arrangement. The results show the journey components and protect a separate airport-procedure allowance.</p><p><a class="byf-submit" href="/#planner">Build my departure plan →</a></p></section></div></main>'
s=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:body,s,flags=re.S)
if '/assets/usefulness.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/assets/usefulness.css?v=20261117-1"></head>')
f.write_text(s)
print('Rebuilt home examples and one useful guide/destination directory.')
