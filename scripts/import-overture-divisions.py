import json, gzip, pathlib, datetime
import duckdb

RELEASE="2026-11-18.0"
PATH=f"s3://overturemaps-us-west-2/release/{RELEASE}/theme=divisions/type=division/*"
OUT=pathlib.Path("data/overture")
OUT.mkdir(parents=True,exist_ok=True)
con=duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs;")
con.execute("INSTALL spatial; LOAD spatial;")
con.execute("SET s3_region='us-west-2';")
con.execute("SET threads=4;")
con.execute("SET memory_limit='8GB';")
con.execute("SET enable_progress_bar=false;")
sql=f"""
WITH filtered AS (
 SELECT id,names.primary AS name,subtype,class,admin_level,country,
        parent_division_id,ST_Y(geometry) AS latitude,ST_X(geometry) AS longitude,
        to_json(sources) AS source_details
 FROM read_parquet('{PATH}',union_by_name=true)
 WHERE country IS NOT NULL
   AND names.primary IS NOT NULL
   AND subtype IN ('country','dependency','region','macroregion','county','macrocounty','localadmin','locality','borough','macrohood','neighborhood','microhood')
), ranked AS (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY country ORDER BY
   CASE subtype WHEN 'country' THEN 0 WHEN 'region' THEN 1 WHEN 'locality' THEN 2 ELSE 3 END,
   name,id) AS country_rank
 FROM filtered
)
SELECT id,name,subtype,class,admin_level,country,parent_division_id,latitude,longitude,source_details
FROM ranked WHERE country_rank<=1000 ORDER BY country,country_rank
"""
print("Querying Overture global divisions and populated settlements",flush=True)
cur=con.execute(sql)
cols=[x[0] for x in cur.description]
path=OUT/"settlements.json.gz"
count=0
countries=set()
with gzip.open(path,"wt",encoding="utf-8",compresslevel=6) as out:
 out.write("[")
 first=True
 while True:
  batch=cur.fetchmany(5000)
  if not batch:break
  for row in batch:
   item=dict(zip(cols,row));countries.add(item["country"])
   if not first:out.write(",")
   json.dump(item,out,ensure_ascii=False,separators=(",",":"),default=str)
   first=False;count+=1
 out.write("]")
if not count:raise RuntimeError("Overture divisions query returned zero records.")
metadata={
 "dataset":"Overture Divisions — countries, regions, counties, localities and neighborhoods",
 "source":"Overture Maps Divisions theme",
 "sourceUrl":"https://docs.overturemaps.org/guides/divisions/",
 "release":RELEASE,
 "retrievedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "licence":"Open Database License 1.0 (ODbL); attribution and share-alike obligations apply. Source provenance is retained per record.",
 "scope":"Country-balanced extract of Overture division point records; up to 1,000 records per country. Includes administrative areas and populated settlements, not a complete global gazetteer.",
 "records":count,
 "countries":len(countries),
 "countryCodes":sorted(countries),
 "maximumPerCountry":1000,
 "file":"data/overture/settlements.json.gz"
}
(OUT/"settlements-metadata.json").write_text(json.dumps(metadata,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(f"Stored {count} division/settlement records across {len(countries)} countries ({path.stat().st_size} compressed bytes).",flush=True)
con.close()
