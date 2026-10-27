"""Refresh public official-source evidence and licensed Wikimedia photographs.

Run before build-search-experience.mjs. No credentials or private analytics data.
"""
import concurrent.futures, json, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urlsplit, unquote, quote
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'content/place-practical.json').read_text())
OUT = ROOT / 'audit/practical-source-review.json'
PHOTOS = ROOT / 'assets/places'
PHOTOS.mkdir(exist_ok=True)
PREVIOUS = {row['slug']: row for row in json.loads(OUT.read_text())} if OUT.exists() else {}

def get(url, binary=False):
    with urlopen(Request(url, headers={'User-Agent': 'BeforeYouFlyJapan/1.0 (editorial source and image attribution review)'}), timeout=25) as response:
        body = response.read()
        return body if binary else body.decode('utf-8', errors='replace')

def review(item):
    slug, row = item
    result = {'slug': slug, 'checked': '2026-10-27', 'url': row['source']}
    try:
        if PREVIOUS.get(slug, {}).get('fetched') and PREVIOUS[slug]['url'] == row['source']:
            result.update(fetched=True, sourceTitle=PREVIOUS[slug].get('sourceTitle',''), textChars=PREVIOUS[slug].get('textChars',len(PREVIOUS[slug].get('text',''))))
            soup = None
        else:
            soup = BeautifulSoup(get(row['source']), 'html.parser')
        if soup is not None:
            for el in soup.select('script,style,header,footer,nav'): el.decompose()
            main = soup.select_one('main, #main, #contents, article') or soup
            result['sourceTitle'] = soup.title.get_text(' ',strip=True) if soup.title else ''
            result['textChars'] = len(main.get_text(' ', strip=True))
            result['fetched'] = result['textChars'] > 0
    except Exception as error:
        result.update(fetched=False, error=str(error))
    try:
        if PREVIOUS.get(slug, {}).get('photo'):
            result['photo'] = PREVIOUS[slug]['photo']
            return result
        if row.get('commonsFile'):
            filename = row['commonsFile']
        else:
            summary = json.loads(get('https://en.wikipedia.org/api/rest_v1/page/summary/' + quote(row['wiki'].replace(' ', '_'))))
            original = summary['originalimage']['source']
            parts = urlsplit(original).path.split('/')
            filename = unquote(parts[-2] if '/thumb/' in original else parts[-1])
        query = urlencode({'action':'query','titles':'File:' + filename,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':'1000','format':'json'})
        info = json.loads(get('https://commons.wikimedia.org/w/api.php?' + query))
        image = next(iter(info['query']['pages'].values()))['imageinfo'][0]
        meta = image['extmetadata']
        license = meta['LicenseShortName']['value']
        if not (license.startswith('CC BY') or license in ['Public domain','CC0']):
            raise ValueError('Unsupported license: ' + license)
        # Commons may refuse thumbnails; the original is usable and resized locally.
        try: raw = get(image.get('thumburl', image['url']), True)
        except Exception: raw = get(image['url'], True)
        from PIL import Image
        from io import BytesIO
        img = Image.open(BytesIO(raw)).convert('RGB')
        img.thumbnail((1000, 750))
        destination = PHOTOS / (slug + '.webp')
        img.save(destination, 'WEBP', quality=80)
        result['photo'] = {'path':'/assets/places/' + slug + '.webp', 'width': img.width,'height':img.height,'source':image['descriptionurl'],'author':BeautifulSoup(meta.get('Artist',{}).get('value','Wikimedia contributor'),'html.parser').get_text(' ',strip=True),'license':license,'licenseUrl':meta.get('LicenseUrl',{}).get('value','https://creativecommons.org/publicdomain/mark/1.0/' if license == 'Public domain' else 'https://creativecommons.org/publicdomain/zero/1.0/'),'alt':row['photoAlt']}
    except Exception as error:
        result['photoError'] = str(error)
    print(slug, 'source=' + str(result['fetched']), 'photo=' + str('photo' in result), result.get('photoError', ''), flush=True)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(review, DATA.items()))
OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
print('Source/photo review saved:', len(results), flush=True)
