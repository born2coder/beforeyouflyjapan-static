"""Build one integrated reader article per place from reviewed editorial data.
Run with beautifulsoup4 installed. Does not assert site visits or live availability.
"""
from pathlib import Path
from urllib.parse import urlencode
import json,re,html,subprocess
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
DATE='2026-11-17';DOMAIN='https://beforeyouflyjapan.com'
esc=lambda s:html.escape(str(s),quote=True)

def render():
 editorial={}
 for name in ['editorial-tokyo','editorial-regions']:editorial.update(json.loads((ROOT/f'content/{name}.json').read_text()))
 practical=json.loads((ROOT/'content/place-practical.json').read_text());storage=json.loads((ROOT/'content/storage-context.json').read_text())
 models=json.loads(subprocess.check_output(['node','scripts/visit-models.cjs'],cwd=ROOT,text=True))
 assert set(editorial)==set(practical)==set(models),'Every destination needs a reviewed article and actual route.'
 airports={'HND':'Haneda','NRT':'Narita','KIX':'Kansai'}
 hubs={'HND':'haneda','NRT':'narita','KIX':'kansai'}
 for slug,row in editorial.items():
  file=ROOT/f'places/{slug}/index.html';text=file.read_text();s=BeautifulSoup(text,'html.parser');original=practical[slug]
  title=s.h1.get_text(' ',strip=True);photo=s.select_one('.byf-place-photo');assert photo,slug+' missing attributed photograph'
  # Retain the real licensed photograph and its attribution without duplicating old sections.
  image=photo.find('img');image['loading']='eager';image['fetchpriority']='high'
  crumbs=s.select_one('.byf-breadcrumbs');crumbs=str(crumbs) if crumbs else '<nav class="byf-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/guides/#places">Destinations</a> / '+esc(title)+'</nav>'
  hero=f'<div class="byf-plan-hero byf-editorial-hero"><p class="byf-kicker">ONE LAST JAPAN STOP</p><h1>{esc(title)}</h1><p>{esc(row["opening"])}</p></div>'
  nav='<nav class="byf-visit-nav" aria-label="On this page"><a href="#flight-fit">At a glance</a><a href="#one-stop">A visit worth making</a><a href="#access-bags">Bags &amp; collection</a><a href="#plan-from-here">Airport route &amp; timing</a></nav>'
  duration=row['visitMinutes']
  duration=(duration+' minutes') if re.fullmatch(r'[0-9–—− -]+',duration) else duration.replace('45–60 in','45–60 minutes in').replace('20–30 exterior;60–90 Main Deck','20–30 minutes outside; 60–90 minutes on the Main Deck')
  verdict=f'<section class="byf-verdict byf-editorial-summary" id="flight-fit"><h2>Is this the stop for you?</h2><dl class="byf-verdict-grid"><div><dt>Suggested time at the place</dt><dd>{esc(duration)} — local visit only</dd></div><div><dt>Choose it for</dt><dd>{esc(row["suitableFor"])}</dd></div></dl><p class="byf-avoid"><strong>Choose another stop if:</strong> {esc(row["skipIf"])}</p></section>'
  sections=[]
  for i,part in enumerate(row['sections']):
   sid='one-stop' if i==0 else 'visit-'+part['id']
   sections.append(f'<section class="byf-editorial-section" id="{esc(sid)}"><h2>{esc(part["title"])}</h2>{part["html"]}</section>')
  mapurl='https://www.google.com/maps/search/?'+urlencode({'api':'1','query':original['anchor']+', Japan'})
  bag=f'<section class="byf-practical" id="access-bags"><h2>Leave bags where you can collect them on the way back</h2><p><a class="byf-map-link" data-byf-event="place_map_click" data-place="{slug}" href="{esc(mapurl)}" target="_blank" rel="noopener">Find {esc(original["anchor"])} on the map ↗</a></p>{storage[slug]["html"]}<p class="byf-source-note">{esc(storage[slug]["basis"])}</p></section>'
  routeblocks=[]
  for model in models[slug]['routes']:
   code=model['airport'];params={'airport':code,'start':model['area'],'interest':next((v for v in model['interests'] if v in ['Food','Culture','Shopping','Relax','Anime / Pop Culture','Waterfront']),''),'place':slug}
   detailparams={'plan_id':model['id']}
   steps=''.join('<li><span>'+esc(x['label'])+'</span><b>'+str(x['minutes'])+' min</b></li>' for x in model['steps'])
   routeblocks.append(f'<article class="byf-route-model"><p class="byf-kicker">{code} · FROM {esc(model["area"])}</p><h3>{esc(model["name"])}</h3><p><strong>{model["minutes"]} minutes for {code}</strong> in this complete model, with no luggage detour. The model includes the stages below; your start, bags and walking needs change the result.</p><details><summary>See the stages included in this model</summary><ol class="byf-model-stages">{steps}</ol></details><p><a href="{esc(model["url"]+"?"+urlencode(detailparams))}">Read the dated worked example</a></p><a class="byf-submit" data-byf-event="place_planner_click" data-place="{slug}" href="/?{esc(urlencode(params))}#planner">Use my flight · {esc(airports[code])} →</a></article>')
  unavailable='<aside class="byf-availability-note"><strong>The gallery is not currently offered by the planner.</strong> Its checked exhibition calendar ends on 8 November 2026. The article below explains the location and facilities; it does not establish the current exhibition, admission price or opening date. Until the calendar is reviewed again, the planner will explain that this stop is unavailable and offer other options.</aside>' if slug=='tokyo-station-gallery' else ''
  routes=f'<section class="byf-place-links" id="plan-from-here"><h2>See what the airport plan actually includes</h2><p>The local visit above is an editorial suggestion. The planner’s complete route can include other stops, a longer visit and the airport journey. Read its stages before choosing: these numbers are <strong>not minimum time before takeoff</strong>. A separate airline-procedure allowance is protected after the route.</p><div class="byf-route-models">'+''.join(routeblocks)+'</div><p>Flight date and free time are left blank for you. Use the actual starting area if you are elsewhere. Only a supported start and an eligible date can produce a suggested plan; the train and queue allowances are estimates.</p></section>'
  sourceitems=''.join(f'<li><a href="{esc(x["url"])}" target="_blank" rel="noopener">{esc(x["label"])}</a>'+'</li>' for x in row['sources'])
  source=f'<section class="byf-source"><h2>Sources behind this visit</h2><p>Local-visit research reviewed {DATE}. We compared the linked operator and tourism information remotely. The visit ranges are editorial allowances; we have not timed or walked these routes on site. Storage publication dates and planner calendar limits are stated separately.</p><ul>{sourceitems}</ul></section>'
  related='<aside class="byf-primary-links"><h2>Choose the rest of your departure day</h2><ul>'+''.join(f'<li><a href="/guides/{hubs[m["airport"]]}-departure-day/">{esc(airports[m["airport"]])}: compare the places and airport journey</a></li>' for m in models[slug]['routes'])+'<li><a href="/guides/luggage-before-flight-japan/">Compare hotel, station and airport storage</a></li><li><a href="/guides/#places">Browse all 40 destination guides</a></li></ul></aside>'
  main='<main id="main-content">'+crumbs+hero+nav+unavailable+str(photo)+verdict+'<div class="byf-editorial-body">'+''.join(sections)+bag+routes+source+related+'</div></main>'
  # Convert authored tables to focusable, contained scroll regions, with scoped headers.
  dom=BeautifulSoup(main,'html.parser')
  for table in dom.select('table'):
   for th in table.select('thead th'):th['scope']='col'
   wrap=dom.new_tag('div',attrs={'class':'byf-answer-table','role':'region','aria-label':'Visit comparison','tabindex':'0'});table.wrap(wrap)
  main=str(dom)
  # Do not let the calendar warning create duplicate anchors (it has none).
  text=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:main,text,flags=re.S)
  if '/assets/usefulness.css' not in text:text=text.replace('</head>','<link rel="stylesheet" href="/assets/usefulness.css?v=20261117-1"></head>')
  # Exactly one current Article. Breadcrumb schema stays in place.
  def schema(m):
   try:obj=json.loads(m[1])
   except ValueError:return m[0]
   return '' if obj.get('@type')=='Article' else m[0]
  text=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,text,flags=re.S)
  desc=re.search(r'<meta name="description" content="([^"]*)"',text)[1]
  article={'@context':'https://schema.org','@type':'Article','headline':title,'description':html.unescape(desc),'mainEntityOfPage':DOMAIN+f'/places/{slug}/','dateModified':DATE,'author':{'@type':'Organization','name':'Before You Fly Japan','url':DOMAIN+'/about/'},'image':DOMAIN+image['src']}
  text=text.replace('</head>','<script type="application/ld+json">'+json.dumps(article,ensure_ascii=False).replace('<','\\u003c')+'</script></head>')
  file.write_text(text)
 print(f'Rendered {len(editorial)} unified place guides with local decisions, one photo, storage context and actual route stages.')

if __name__=='__main__':render()
