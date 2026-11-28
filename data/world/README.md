# TRAVORA World Knowledge Graph — starter release

This directory contains a **starter schema and small verified seed set**, not a completed 50,000-entity global database. Empty arrays are intentional. Do not market the dataset as 195 countries / 35,000 cities / 9,000 airports / 800 airlines / 5,000 corridors until those records have been sourced, reviewed, deduplicated and loaded.

## Files
- `manifest.json`: shard map and release status.
- Six regional shards: country and city records.
- `airports.json`, `airlines.json`, `corridors.json`: global entity collections.

## Required production fields
Every production record should include a stable ID, source URL(s), `lastVerified` date, licensing/provenance, and a confidence/status field. Visa/entry rules, baggage rules, flight times, route availability and compensation eligibility are time-sensitive and must not be guessed.

## Readers
- `country.html?c=japan`
- `city.html?city=tokyo`
- `airport.html?code=LHR`
- `airline.html?code=BA`
- `route.html?from=JFK&to=LHR`

Readers fetch one shard per page view. Missing records are shown as unavailable rather than fabricated.

## Build check
Run `python3 scripts/build_world.py --check-size` locally. The script validates JSON and reports actual tracked working-tree file size. It does not create 5,000 thin pages.
