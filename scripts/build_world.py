#!/usr/bin/env python3
"""Validate TRAVORA world shards and optionally build a sitemap index.
This tool only publishes entities explicitly present in data/world/*.json.
It does not invent missing global coverage.
"""
import json, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'/'world'
REQUIRED={'europe.json','asia.json','north-america.json','south-america.json','oceania.json','africa-middle-east.json','airports.json','airlines.json','corridors.json'}
def main():
    missing=REQUIRED-{p.name for p in DATA.glob('*.json')}
    if missing: raise SystemExit('Missing shards: '+', '.join(sorted(missing)))
    totals={}
    for p in sorted(DATA.glob('*.json')):
        obj=json.loads(p.read_text(encoding='utf-8'))
        if not isinstance(obj,dict): raise SystemExit(f'{p}: top-level JSON must be an object')
        for key in ('countries','cities','airports','airlines','corridors'):
            rows=obj.get(key,[])
            if not isinstance(rows,list): raise SystemExit(f'{p}: {key} must be an array')
            ids=[str(x.get('id') or x.get('iata') or (str(x.get('from',''))+'-'+str(x.get('to','')))) for x in rows]
            if len(ids)!=len(set(ids)): raise SystemExit(f'{p}: duplicate {key} identifiers')
            totals[key]=totals.get(key,0)+len(rows)
    print('Validated shard records:',json.dumps(totals,sort_keys=True))
    print('Coverage is the number of records actually present; no 50k claim is made.')
    if '--check-size' in sys.argv:
        size=sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts)
        print(f'Repository working-tree file size: {size/1024/1024:.2f} MiB')
        if size>250*1024*1024: raise SystemExit('Repository exceeds 250 MiB target')
if __name__=='__main__': main()
