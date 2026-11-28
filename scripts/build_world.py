#!/usr/bin/env python3
"""Validate world shards and generate optional static SEO pages + sitemap shards.
Only records marked publishStatic=true are rendered. Missing global data is never invented.
"""
import json, pathlib, sys, html, math
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'/'world'
BASE='https://travora.eu.cc'
REQUIRED={'europe.json','asia.json','north-america.json','south-america.json','oceania.json','africa-middle-east.json','airports.json','airlines.json','corridors.json'}
def load_and_validate():
    missing=REQUIRED-{p.name for p in DATA.glob('*.json')}
    if missing: raise SystemExit('Missing shards: '+', '.join(sorted(missing)))
    all_rows=[]; totals={}
    for p in sorted(DATA.glob('*.json')):
        obj=json.loads(p.read_text(encoding='utf-8'))
        if not isinstance(obj,dict): raise SystemExit(f'{p}: top-level JSON must be an object')
        for key in ('countries','cities','airports','airlines','corridors'):
            rows=obj.get(key,[])
            if not isinstance(rows,list): raise SystemExit(f'{p}: {key} must be an array')
            ids=[str(x.get('id') or x.get('iata') or (str(x.get('from',''))+'-'+str(x.get('to','')))) for x in rows]
            if len(ids)!=len(set(ids)): raise SystemExit(f'{p}: duplicate {key} identifiers')
            totals[key]=totals.get(key,0)+len(rows)
            for row in rows: all_rows.append((key,row))
    return totals,all_rows
def render_page(kind,row):
    name=html.escape(str(row.get('name') or row.get('title') or row.get('id') or 'Travel reference'))
    desc=html.escape(str(row.get('description') or f'{name} travel reference from TRAVORA. Confirm current details with official sources.'))
    links=[('flights_aviasales','Aviasales'),('comp_compensair','Compensair'),('stays_klook','Klook'),('stays_kkday','KKday'),('esim_airalo','Airalo'),('esim_yesim','Yesim'),('esim_saily','Saily'),('esim_drimsim','Drimsim'),('transfers_kiwitaxi','Kiwitaxi'),('transfers_welcome','Welcome Pickups'),('transfers_gettransfer','GetTransfer'),('transfers_intui','intui.travel'),('cars_localrent','Localrent'),('cars_autoeurope','Auto Europe'),('cars_getrentacar','GetRentacar'),('cars_economybookings','Economybookings'),('cars_qeeq','QEEQ'),('cars_bikesbooking','BikesBooking'),('tours_klook','Klook Experiences'),('tours_tiqets','Tiqets'),('tours_gocity','Go City'),('tours_wegotrip','WeGoTrip'),('luggage_radical','Radical Storage')]
    cards='<section><h2>Trip Essentials &amp; Booking Partners</h2><div class="partner-row">'+''.join(f'<a data-partner="{k}">{label}</a>' for k,label in links)+'</div><p>TRAVORA may earn a commission from qualifying bookings.</p></section>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name} | TRAVORA</title><meta name="description" content="{desc[:155]}"><link rel="canonical" href="{BASE}/{kind}/{html.escape(str(row['id']))}.html"><link rel="stylesheet" href="../assets/app.css?v=20261128-affiliate-world"><script defer src="../assets/partners.js?v=20261128-affiliate-world"></script></head><body><main class="container"><p><a href="../encyclopedia.html">Travel Encyclopedia</a></p><h1>{name}</h1><p>{desc}</p><p>Reference data is subject to change. Confirm entry, transport, airline and booking information with the relevant official authority or provider.</p>{cards}<p>Affiliate disclosure: TRAVORA may earn a commission at no extra cost to you.</p></main></body></html>'''
def generate(all_rows):
    urls=[]
    for kind,row in all_rows:
        if not row.get('publishStatic'): continue
        ident=str(row.get('id') or row.get('iata') or '')
        if not ident or '/' in ident or '..' in ident: raise SystemExit(f'Unsafe static page identifier: {ident!r}')
        folder={'countries':'countries','cities':'cities','airports':'airports','airlines':'guides','corridors':'guides'}[kind]
        path=ROOT/folder/(ident+'.html')
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(render_page(folder,row),encoding='utf-8')
        urls.append(f'{BASE}/{folder}/{ident}.html')
    chunk_size=45000
    parts=[]
    for i in range(0,len(urls),chunk_size):
        part=f'sitemap-entities-{i//chunk_size+1}.xml'
        body=''.join(f'<url><loc>{html.escape(u)}</loc></url>' for u in urls[i:i+chunk_size])
        (ROOT/part).write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+body+'</urlset>',encoding='utf-8')
        parts.append(part)
    if parts:
        entries=''.join(f'<sitemap><loc>{BASE}/{p}</loc></sitemap>' for p in parts)
        (ROOT/'sitemap-entities-index.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries+'</sitemapindex>',encoding='utf-8')
        main_parts=['sitemap-pages-1.xml','sitemap-entities-index.xml']
        main_entries=''.join(f'<sitemap><loc>{BASE}/{p}</loc></sitemap>' for p in main_parts)
        (ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+main_entries+'</sitemapindex>',encoding='utf-8')
    print(f'Generated {len(urls)} static entity pages across {len(parts)} sitemap shards.')
def main():
    totals,rows=load_and_validate()
    print('Validated shard records:',json.dumps(totals,sort_keys=True))
    print('Coverage is actual record count; no 50k claim is made.')
    if '--generate' in sys.argv: generate(rows)
    if '--check-size' in sys.argv:
        size=sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts)
        print(f'Repository working-tree file size: {size/1024/1024:.2f} MiB')
        if size>250*1024*1024: raise SystemExit('Repository exceeds 250 MiB target')
if __name__=='__main__': main()
