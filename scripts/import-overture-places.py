import json, gzip, pathlib, datetime
import duckdb

RELEASE = "2026-11-18.0"
S3_GLOB = f"s3://overturemaps-us-west-2/release/{RELEASE}/theme=places/type=place/*"
OUT = pathlib.Path("data/overture")
OUT.mkdir(parents=True, exist_ok=True)

con = duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs;")
con.execute("INSTALL spatial; LOAD spatial;")
con.execute("SET s3_region='us-west-2';")
con.execute("SET threads=4;")
con.execute("SET memory_limit='10GB';")
con.execute("SET enable_progress_bar=false;")

sql=f"""
WITH source AS MATERIALIZED (
 SELECT
  id,
  names.primary AS name,
  basic_category,
  taxonomy.primary AS taxonomy_primary,
  taxonomy.hierarchy AS taxonomy_hierarchy,
  addresses[1].country AS country_code,
  addresses[1].locality AS locality,
  addresses[1].region AS region,
  addresses[1].postcode AS postcode,
  addresses[1].freeform AS address,
  websites,
  phones,
  emails,
  brand.names.primary AS brand,
  operating_status,
  confidence,
  ST_Y(geometry) AS latitude,
  ST_X(geometry) AS longitude,
  to_json(sources) AS source_details
 FROM read_parquet('{S3_GLOB}', union_by_name=true)
 WHERE addresses[1].country IS NOT NULL
   AND names.primary IS NOT NULL
   AND (confidence IS NULL OR confidence >= 0.7)
   AND (operating_status IS NULL OR operating_status <> 'permanently_closed')
   AND (
     list_contains(taxonomy.hierarchy, 'lodging')
     OR list_contains(taxonomy.hierarchy, 'cultural_and_historic')
     OR list_contains(taxonomy.hierarchy, 'arts_and_entertainment')
     OR basic_category IN (
       'park','zoo','aquarium','theme_park','amusement_park','tourist_attraction','viewpoint',
       'car_rental','airport','bus_station','train_station','railway_station','ferry_terminal',
       'seaport','subway_station','tram_stop','transit_station'
     )
     OR taxonomy.primary='car_rental'
   )
),
classified AS (
 SELECT 'hotels' AS dataset, 500 AS cap, * FROM source
  WHERE list_contains(taxonomy_hierarchy, 'lodging')
 UNION ALL
 SELECT 'attractions' AS dataset, 500 AS cap, * FROM source
  WHERE list_contains(taxonomy_hierarchy, 'cultural_and_historic')
     OR list_contains(taxonomy_hierarchy, 'arts_and_entertainment')
     OR basic_category IN ('park','zoo','aquarium','theme_park','amusement_park','tourist_attraction','viewpoint')
 UNION ALL
 SELECT 'car-rental-locations' AS dataset, 200 AS cap, * FROM source
  WHERE basic_category='car_rental' OR taxonomy_primary='car_rental'
 UNION ALL
 SELECT 'transport-nodes' AS dataset, 500 AS cap, * FROM source
  WHERE basic_category IN ('airport','bus_station','train_station','railway_station','ferry_terminal','seaport','subway_station','tram_stop','transit_station')
),
ranked AS (
 SELECT *, ROW_NUMBER() OVER (
   PARTITION BY dataset,country_code
   ORDER BY confidence DESC NULLS LAST,name,id
 ) AS country_rank
 FROM classified
)
SELECT dataset,country_rank,id,name,basic_category,taxonomy_primary,taxonomy_hierarchy,
 country_code,locality,region,postcode,address,websites,phones,emails,brand,
 operating_status,confidence,latitude,longitude,source_details
FROM ranked
WHERE country_rank<=cap
ORDER BY dataset,country_code,country_rank
"""
print("Scanning the Overture Places theme once and sampling all four travel categories.",flush=True)
cur=con.execute(sql)
columns=[d[0] for d in cur.description]
keys=["hotels","attractions","car-rental-locations","transport-nodes"]
streams={k:gzip.open(OUT/f"{k}.json.gz","wt",encoding="utf-8",compresslevel=6) for k in keys}
first={k:True for k in keys}
counts={k:0 for k in keys}
countries={k:set() for k in keys}
try:
 for stream in streams.values():stream.write("[")
 while True:
  batch=cur.fetchmany(5000)
  if not batch:break
  for row in batch:
   item=dict(zip(columns,row))
   key=item.pop("dataset")
   item.pop("country_rank",None)
   if not first[key]:streams[key].write(",")
   json.dump(item,streams[key],ensure_ascii=False,separators=(",",":"),default=str)
   first[key]=False
   counts[key]+=1
   countries[key].add(item["country_code"])
 for stream in streams.values():stream.write("]")
finally:
 for stream in streams.values():stream.close()

metadata={
 "source":"Overture Maps Places theme",
 "sourceUrl":"https://docs.overturemaps.org/guides/places/",
 "dataRelease":RELEASE,
 "retrievedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "sourceThemeLicense":"CDLA Permissive 2.0 and Apache 2.0; per-source licence/provenance retained in each record's source_details",
 "schema":"Overture Places schema v2.0.0",
 "sampling":"Country-balanced extract, not the complete Overture global Places dataset. Maximum records per country are capped by category.",
 "filters":{"minimumConfidence":0.7,"closedPlaces":"Permanently closed places excluded; unknown and temporarily closed status retained.","country":"Requires an ISO country code in the first address."},
 "datasets":{}
}
caps={"hotels":500,"attractions":500,"car-rental-locations":200,"transport-nodes":500}
titles={
 "hotels":"Lodging, hotels, resorts, hostels and guest houses",
 "attractions":"Cultural, historic, entertainment and visitor attractions",
 "car-rental-locations":"Car rental locations and branches",
 "transport-nodes":"Airports, bus stations, rail stations and ferry terminals"
}
for key in keys:
 if not counts[key]:
  raise RuntimeError(f"Overture query returned zero records for {key}; refusing to publish an empty dataset.")
 metadata["datasets"][key]={
  "title":titles[key],
  "file":f"data/overture/{key}.json.gz",
  "records":counts[key],
  "countries":len(countries[key]),
  "countryCodes":sorted(countries[key]),
  "maximumPerCountry":caps[key],
  "license":"Overture Places theme CDLA Permissive 2.0 / Apache 2.0; individual source details retained"
 }
(OUT/"metadata.json").write_text(json.dumps(metadata,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print("Stored Overture records: "+", ".join(f"{k}={counts[k]}" for k in keys),flush=True)
con.close()
