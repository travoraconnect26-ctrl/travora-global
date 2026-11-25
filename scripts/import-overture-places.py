import os, json, gzip, pathlib, datetime
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
con.execute("SET memory_limit='8GB';")
con.execute("SET enable_progress_bar=false;")

base_select = f"""
SELECT
  id,
  names.primary AS name,
  basic_category AS basic_category,
  taxonomy.primary AS taxonomy_primary,
  taxonomy.hierarchy AS taxonomy_hierarchy,
  addresses[1].country AS country_code,
  addresses[1].locality AS locality,
  addresses[1].region AS region,
  addresses[1].postcode AS postcode,
  addresses[1].freeform AS address,
  websites AS websites,
  phones AS phones,
  emails AS emails,
  brand.names.primary AS brand,
  operating_status AS operating_status,
  confidence AS confidence,
  ST_Y(geometry) AS latitude,
  ST_X(geometry) AS longitude,
  to_json(sources) AS source_details
FROM read_parquet('{S3_GLOB}', union_by_name=true)
"""

datasets = [
  {
    "key": "hotels",
    "title": "Lodging, hotels, resorts, hostels and guest houses",
    "cap": 500,
    "where": "list_contains(taxonomy.hierarchy, 'lodging')"
  },
  {
    "key": "attractions",
    "title": "Cultural, historic, entertainment and visitor attractions",
    "cap": 500,
    "where": """(
      list_contains(taxonomy.hierarchy, 'cultural_and_historic')
      OR list_contains(taxonomy.hierarchy, 'arts_and_entertainment')
      OR basic_category IN ('park','zoo','aquarium','theme_park','amusement_park','tourist_attraction','viewpoint')
    )"""
  },
  {
    "key": "car-rental-locations",
    "title": "Car rental locations and branches",
    "cap": 200,
    "where": """(
      basic_category = 'car_rental'
      OR taxonomy.primary = 'car_rental'
      OR list_contains(taxonomy.hierarchy, 'car_rental')
    )"""
  },
  {
    "key": "transport-nodes",
    "title": "Airports, bus stations, rail stations and ferry terminals",
    "cap": 500,
    "where": """basic_category IN (
      'airport','bus_station','train_station','railway_station',
      'ferry_terminal','seaport','subway_station','tram_stop','transit_station'
    )"""
  }
]

metadata = {
  "source": "Overture Maps Places theme",
  "sourceUrl": "https://docs.overturemaps.org/guides/places/",
  "dataRelease": RELEASE,
  "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "sourceThemeLicense": "CDLA Permissive 2.0 and Apache 2.0; per-source licence/provenance retained in each record's source_details",
  "schema": "Overture Places schema v2.0.0",
  "sampling": "Country-balanced extract, not the complete Overture global Places dataset. Maximum records per country are capped by category to keep the static site and Git repository usable.",
  "filters": {
    "minimumConfidence": 0.7,
    "closedPlaces": "Permanently closed places excluded; unknown and temporarily closed status retained.",
    "country": "Requires an ISO country code in the first address."
  },
  "datasets": {}
}

for item in datasets:
    key = item["key"]
    cap = item["cap"]
    sql = f"""
    WITH filtered AS (
      {base_select}
      WHERE {item['where']}
        AND addresses[1].country IS NOT NULL
        AND names.primary IS NOT NULL
        AND (confidence IS NULL OR confidence >= 0.7)
        AND (operating_status IS NULL OR operating_status <> 'permanently_closed')
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY country_code
          ORDER BY confidence DESC NULLS LAST, name, id
        ) AS country_rank
      FROM filtered
    )
    SELECT
      id, name, basic_category, taxonomy_primary, taxonomy_hierarchy,
      country_code, locality, region, postcode, address,
      websites, phones, emails, brand, operating_status, confidence,
      latitude, longitude, source_details
    FROM ranked
    WHERE country_rank <= {cap}
    ORDER BY country_code, country_rank
    """
    print(f"Querying Overture dataset: {key}", flush=True)
    cur = con.execute(sql)
    columns = [d[0] for d in cur.description]
    path = OUT / f"{key}.json.gz"
    count = 0
    countries = set()
    with gzip.open(path, "wt", encoding="utf-8", compresslevel=6) as stream:
      stream.write("[")
      first = True
      while True:
        batch = cur.fetchmany(5000)
        if not batch:
          break
        for row in batch:
          record = dict(zip(columns, row))
          countries.add(record["country_code"])
          if not first:
            stream.write(",")
          json.dump(record, stream, ensure_ascii=False, separators=(",", ":"), default=str)
          first = False
          count += 1
      stream.write("]")
    if count == 0:
      raise RuntimeError(f"Overture query for {key} returned zero records; refusing to publish an empty dataset.")
    metadata["datasets"][key] = {
      "title": item["title"],
      "file": f"data/overture/{key}.json.gz",
      "records": count,
      "countries": len(countries),
      "countryCodes": sorted(countries),
      "maximumPerCountry": cap,
      "license": "Overture Places theme CDLA Permissive 2.0 / Apache 2.0; individual source details retained"
    }
    (OUT / "metadata.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{key}: {count} records in {len(countries)} countries; {path.stat().st_size} compressed bytes", flush=True)

con.close()
