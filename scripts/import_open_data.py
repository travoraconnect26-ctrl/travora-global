#!/usr/bin/env python3
"""Import open travel reference datasets into TRAVORA's sharded JSON graph.

Sources:
- REST Countries legacy public API (country fields; see manifest for snapshot date)
- GeoNames cities15000 (CC BY 4.0)
- OurAirports airports.csv (public domain)
- OpenFlights airlines.dat/routes.dat (ODbL 1.0)

The OpenFlights route file is a historical community snapshot, not live schedules.
No flight times, baggage rules, visa decisions, terminal transfers or legal eligibility
are inferred. The importer selects records and writes provenance into every shard.
"""
import csv, io, json, math, pathlib, urllib.request, zipfile, datetime, collections, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'world'
TODAY=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
URLS={
 'countries':'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,currencies,languages,timezones,continents,car,unMember',
 'cities':'https://download.geonames.org/export/dump/cities15000.zip',
 'airports':'https://davidmegginson.github.io/ourairports-data/airports.csv',
 'airlines':'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
 'routes':'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
}
REGIONS={'Europe':'europe','Asia':'asia','Africa':'africa-middle-east','Oceania':'oceania','Americas':'north-america'}
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'TRAVORA-OpenData-Importer/1.0'})
 with urllib.request.urlopen(req,timeout=90) as r:return r.read()
def csv_rows(raw):
 return list(csv.reader(io.StringIO(raw.decode('utf-8-sig'))))
def clean(s): return s.strip() if s and s!='\\N' else ''
def country_import():
 try:\n  raw=json.loads(get(URLS['countries']))\n  country_source=URLS['countries']\n except Exception:\n  country_source='https://raw.githubusercontent.com/mledoze/countries/master/countries.json'\n  raw=json.loads(get(country_source))
 # UN members plus the two UN non-member observer states, for the conventional 195-country set.
 chosen=[x for x in raw if x.get('unMember') or x.get('cca3') in ('VAT','PSE')]
 by={k:[] for k in set(REGIONS.values())}
 iso_to_id={}
 for x in chosen:
  name=x.get('name',{}).get('common','')
  iso=x.get('cca2','')
  slug=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
  iso_to_id[iso]=slug
  region=REGIONS.get((x.get('region') or ''),'africa-middle-east')
  if x.get('region')=='Americas' and (x.get('subregion') or '') in ('South America','South America and the Caribbean'): region='south-america'
  cur=x.get('currencies') or {}
  langs=x.get('languages') or {}
  item={'id':slug,'name':name,'iso2':iso,'iso3':x.get('cca3'),'capital':(x.get('capital') or []),'region':x.get('region'),'subregion':x.get('subregion'),'continents':x.get('continents') or [],'currencies':[{'code':k,'name':v.get('name'),'symbol':v.get('symbol')} for k,v in cur.items()],'languages':list(langs.values()),'timezones':x.get('timezones') or [],'drivingSide':(x.get('car') or {}).get('side'),'unMember':bool(x.get('unMember')),'travelerGuidance':{'us':'Check current US Department of State country information and entry requirements before travel.','uk':'Check current FCDO foreign travel advice and entry requirements before travel.'},'sources':[country_source],'lastVerified':TODAY,'sourceStatus':'reference-data-not-visa-advice','staticPage':None}
  by[region].append(item)
 return by,iso_to_id
def airport_import():
 rows=csv.DictReader(io.StringIO(get(URLS['airports']).decode('utf-8-sig')))
 out=[]
 for x in rows:
  iata=clean(x.get('iata_code')); typ=clean(x.get('type'))
  if len(iata)!=3 or not iata.isalpha() or clean(x.get('scheduled_service')).lower()!='yes' or typ not in ('large_airport','medium_airport'):continue
  out.append({'id':iata,'iata':iata,'icao':clean(x.get('icao_code')) or None,'name':clean(x.get('name')),'city':clean(x.get('municipality')),'countryCode':clean(x.get('iso_country')),'regionCode':clean(x.get('iso_region')),'latitude':float(x['latitude_deg']) if clean(x.get('latitude_deg')) else None,'longitude':float(x['longitude_deg']) if clean(x.get('longitude_deg')) else None,'elevationFt':int(float(x['elevation_ft'])) if clean(x.get('elevation_ft')) else None,'airportType':typ,'scheduledService':True,'sources':[URLS['airports']],'lastVerified':TODAY,'terminalTransfer':'Check the airport operator’s official terminal and transit guidance.','pickupAdvice':'Compare pre-booked pickup and public transport options; confirm the meeting point with the provider.'})
 # Deduplicate IATA, prefer large airport and complete coordinates
 best={}
 for x in out:
  old=best.get(x['iata'])
  if old is None or (x['airportType']=='large_airport' and old['airportType']!='large_airport'):best[x['iata']]=x
 return list(best.values())
def city_import(airports,iso_to_id):
 data=get(URLS['cities'])
 z=zipfile.ZipFile(io.BytesIO(data))
 name=next(n for n in z.namelist() if n.endswith('.txt'))
 rows=[]
 # GeoNames TSV: geonameid,name,asciiname,alternatenames,lat,lon,feature class,feature code,country,cc2,admin1...
 for line in io.TextIOWrapper(z.open(name),encoding='utf-8'):
  p=line.rstrip('\n').split('\t')
  if len(p)<19:continue
  try:pop=int(p[14] or 0);lat=float(p[4]);lon=float(p[5])
  except:continue
  iso=p[8]
  if pop<50000 or iso not in iso_to_id:continue
  rows.append((pop,p,lat,lon))
 rows.sort(reverse=True,key=lambda x:x[0])
 # Major city shortlist, one unique GeoNames ID per record; nearest scheduled IATA airport by haversine.
 airports_geo=[a for a in airports if a['latitude'] is not None and a['longitude'] is not None]
 cities=[]
 for pop,p,lat,lon in rows[:1200]:
  near=None;best=1e20
  for a in airports_geo:
   la,lo=a['latitude'],a['longitude']
   dlat=math.radians(la-lat);dlon=math.radians(lo-lon)
   h=math.sin(dlat/2)**2+math.cos(math.radians(lat))*math.cos(math.radians(la))*math.sin(dlon/2)**2
   dist=6371*2*math.asin(min(1,math.sqrt(h)))
   if dist<best:best=dist;near=a['iata']
  cities.append({'id':p[0],'geonameId':int(p[0]),'name':p[1],'countryId':iso_to_id[p[8]],'countryCode':p[8],'regionCode':p[10],'regionName':p[11],'latitude':lat,'longitude':lon,'population':pop,'nearestAirportIata':near,'nearestAirportDistanceKm':round(best,1) if near else None,'sources':['https://download.geonames.org/export/dump/cities15000.zip'],'license':'CC-BY-4.0','lastVerified':TODAY})
 return cities
def airline_route_import():
 airlines=[]; lookup={}
 for p in csv_rows(get(URLS['airlines'])):
  if len(p)<8:continue
  code=clean(p[3]);name=clean(p[1])
  if not name:continue
  row={'id':str(p[0]),'name':name,'alias':clean(p[2]) or None,'iata':code or None,'icao':clean(p[4]) or None,'callsign':clean(p[5]) or None,'country':clean(p[6]),'active':clean(p[7]),'source':'OpenFlights historical snapshot','lastVerified':TODAY}
  airlines.append(row)
  if code and len(code)==2 and clean(p[7]).upper()=='Y':lookup[code]=row
 airports_raw={}
 for p in csv_rows(get('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat')):
  if len(p)>=8:
   code=clean(p[4])
   if code and len(code)==3:airports_raw[code]={'city':clean(p[2]),'country':clean(p[3]),'lat':float(p[6]) if clean(p[6]) else None,'lon':float(p[7]) if clean(p[7]) else None}
 counts=collections.Counter()
 for p in csv_rows(get(URLS['routes'])):
  if len(p)>=9 and clean(p[7])=='0':
   airline=clean(p[0]);src=clean(p[2]);dst=clean(p[4])
   if airline in lookup and src in airports_raw and dst in airports_raw and src!=dst:counts[(src,dst)]+=1
 corridors=[]
 for (src,dst),count in counts.most_common():
  a,b=airports_raw[src],airports_raw[dst]
  if a['country'] not in ('United States','United Kingdom') and b['country'] not in ('United States','United Kingdom'):continue
  corridors.append({'id':src+'-'+dst,'from':src,'to':dst,'fromCity':a['city'],'fromCountry':a['country'],'toCity':b['city'],'toCountry':b['country'],'observedOpenFlightsCarrierCount':count,'source':'OpenFlights historical route snapshot','sourceUrl':URLS['routes'],'lastVerified':TODAY,'scheduleStatus':'historical-route-data-not-live','estimatedFlightTime':None,'bookingWindowAdvice':None})
  if len(corridors)>=500:break
 return airlines,corridors
def write(name,obj):
 (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 countries,iso_to_id=country_import()
 airports=airport_import()
 cities=city_import(airports,iso_to_id)
 airlines,corridors=airline_route_import()
 for region,items in countries.items():
  shard=json.loads((OUT/(region+'.json')).read_text()) if (OUT/(region+'.json')).exists() else {'region':region,'countries':[],'cities':[]}
  shard['countries']=items
  shard['cities']=[c for c in cities if c['countryId'] in {x['id'] for x in items}]
  shard['sources']=['REST Countries','GeoNames cities15000']
  write(region+'.json',shard)
 write('airports.json',{'airports':airports,'source':'OurAirports','sourceUrl':URLS['airports'],'license':'Public domain','retrievedAt':TODAY})
 write('airlines.json',{'airlines':airlines,'source':'OpenFlights','sourceUrl':URLS['airlines'],'license':'ODbL-1.0','retrievedAt':TODAY,'snapshotWarning':'Community snapshot; not a live airline registry.'})
 write('corridors.json',{'corridors':corridors,'source':'OpenFlights','sourceUrl':URLS['routes'],'license':'ODbL-1.0','retrievedAt':TODAY,'snapshotWarning':'Historical route existence only; not a live schedule, flight-time or booking availability feed.'})
 manifest={'schemaVersion':2,'updatedAt':TODAY,'coverageStatus':'open-data-imported-snapshot','coverageCounts':{'countries':sum(len(x) for x in countries.values()),'cities':len(cities),'airports':len(airports),'airlines':len(airlines),'corridors':len(corridors)},'sources':[{'name':'REST Countries-compatible country dataset','url':country_source,'fields':'capital, region, currencies, languages, timezones, continents, driving side','license':'Check upstream terms; fallback mledoze/countries is ODbL-1.0','retrievedAt':TODAY},{'name':'GeoNames cities15000','url':URLS['cities'],'license':'CC-BY-4.0','attribution':'GeoNames (www.geonames.org)','retrievedAt':TODAY},{'name':'OurAirports','url':URLS['airports'],'license':'Public domain per OurAirports terms','retrievedAt':TODAY},{'name':'OpenFlights airlines/routes','url':'https://openflights.org/data.php','license':'ODbL-1.0; share-alike obligations apply','retrievedAt':TODAY}],'notes':['US/UK guidance is a link-out reminder, not individualized visa advice.','Airport terminal transfer details are not sourced in this import; use airport official information.','OpenFlights routes are historical snapshots and must not be represented as current scheduled service.','Nearest airport is a straight-line distance calculation from the selected airport coordinate, not guaranteed ground travel time.']}
 manifest['countryRegions']={x['id']:region for region,items in countries.items() for x in items}\n manifest['cityRegions']={str(x['geonameId']): next((r for r,items in countries.items() if x['countryId'] in {c['id'] for c in items}), 'europe') for x in cities}\n write('city-index.json',{'cities':{**{x['name'].lower():{'id':str(x['geonameId']),'region':next((r for r,items in countries.items() if x['countryId'] in {c['id'] for c in items}), 'europe')} for x in cities},**{str(x['geonameId']):{'id':str(x['geonameId']),'region':next((r for r,items in countries.items() if x['countryId'] in {c['id'] for c in items}), 'europe')} for x in cities}}})\n write('manifest.json',manifest)
 print(json.dumps(manifest['coverageCounts'],indent=2))
if __name__=='__main__':main()
