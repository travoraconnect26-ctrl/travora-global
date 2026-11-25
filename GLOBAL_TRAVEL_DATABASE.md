# TRAVORA Global Travel Data Database

## Purpose
Build a searchable, worldwide reference database for places and travel infrastructure, starting with free/open datasets. This is a staged data project, not a claim that every hotel, route, airline or fare is already covered.

## Existing foundation
- 34,248 populated-place records are already bundled under `cities/` and `world-cities.json`.
- Country and territory reference data is bundled in `country-data.json`.
- Nearby map discovery currently queries OpenStreetMap through public Overpass instances when a visitor searches a place.
- City photo lookup uses geotagged Wikimedia Commons files where available.
- Google Maps is only opened as an external visitor link; Google Maps content is not copied into TRAVORA.

## Database entities and fields

| Entity | Core fields | Free/open starting source | Important limitation |
|---|---|---|---|
| Cities, towns, villages | name, country, admin area, coordinates, population, timezone, source ID | Existing GeoNames-derived place files | GeoNames populated-place classes do not represent every named hamlet or neighbourhood. |
| Hotels and stays | name, coordinates, address, type, operator, phone, website, stars, rooms | OpenStreetMap `tourism=hotel/hostel/guest_house/motel/apartment` | Incomplete coverage; no room inventory, live availability or reliable prices. |
| Bus stops/stations | name, coordinates, network, operator, stop ID | OpenStreetMap; public GTFS feeds | A stop point is not a route timetable. GTFS feeds are published separately by agencies and may change. |
| Rail stations | name, coordinates, operator, network, station code | OpenStreetMap; public GTFS / GTFS-Realtime feeds where licensed | No universal worldwide rail timetable or fare database. |
| Airports | name, coordinates, IATA/ICAO codes, operator | OurAirports public-domain CSV and OpenStreetMap | Airport records do not provide flight schedules or seat inventory. |
| Airlines | name, alias, IATA/ICAO codes, callsign, country, source flag | Stored OpenFlights snapshot (`data/airlines-openflights.json`, 6,162 records) | Historical snapshot; source active flag is not proof of current operation. ODbL/DbCL attribution and share-alike obligations apply. |
| Flights and routes | origin, destination, operating carrier, schedule, service dates | Airline/airport open feeds where published; licensed supplier APIs for broad coverage | No complete free global live flight inventory. |
| Cruise/ferry ports | name, coordinates, operator, website, port type | OpenStreetMap | Port features do not provide cruise calls, itineraries, cabin availability or fares. |
| Attractions | name, coordinates, category, address, operator, website, opening hours | OpenStreetMap and Wikimedia Commons | Descriptions, opening hours and photo coverage vary. |
| Car rental | branch name, coordinates, operator, website, phone | OpenStreetMap | Mapped branches do not provide fleet availability or rental quotes. |

## Required data rules
1. Store the source, source object ID, source URL, retrieval timestamp and applicable licence/attribution with every imported record.
2. Preserve original source IDs and tags. Do not fabricate addresses, phone numbers, prices, routes, schedules, photos or opening hours.
3. Deduplicate using source ID first; use coordinates plus normalized name only as a cautious secondary match.
4. Keep live availability and prices separate from reference records and show their provider and last-checked time.
5. Respect each source's licence, attribution, rate limits, API policies and caching rules. Do not bulk-copy Google Maps photos or reviews.
6. Treat missing data as unknown, not as proof that a service does not exist.

## Deployment architecture and $0 constraint
The current site is static GitHub Pages. It cannot host a writable central database or run a continuous bulk-ingestion service by itself. Public Overpass servers are shared community infrastructure and are not a dependable production database API. A truly global, regularly refreshed database needs a separate ingestion process, persistent storage, and query hosting. Free tiers may have quotas, sleep limits, storage limits or usage terms; do not assume unlimited free capacity.

Recommended staged implementation:
1. Keep the existing 34,248-place index as the global geographic backbone.
2. Build an openly licensed, attributed reference snapshot for static records only where bulk redistribution is permitted.
3. Import mapped hotels, stations, ports, airports and attractions in regional batches, with source IDs and update dates.
4. Add public GTFS feeds agency-by-agency for supported bus and rail networks.
5. Add airline/cruise schedules and live prices only when a lawful, reliable source is available; otherwise link to official providers and label the data as unavailable.
6. Add a searchable data coverage page showing what is indexed, each source's update date, and known gaps.

## Current coverage status
- Geographic place index: 34,248 records bundled.
- Hotels, transport stops, airports, ports and attractions: nearby on-demand OpenStreetMap search, not a complete global snapshot.
- Bus and rail routes/timetables: not globally integrated.
- Airline reference snapshot: 6,162 OpenFlights records stored in `data/airlines-openflights.json` and searchable at `airlines.html`; historical snapshot, not a verified current-operator list. Live flight schedules/fares are not integrated.
- Cruise itineraries/calls and cabin fares: not globally integrated.
- Live hotel inventory/prices: not integrated.
- Wikimedia geotagged photos: available only where Commons has suitable nearby files.
- Google Maps photos/reviews: visitor opens Google Maps externally; no Google Maps API integration.

This file is the data contract and honest coverage register for future database imports.

## Stored airline dataset
The first bulk reference dataset is committed at `data/airlines-openflights.json`. It contains 6,162 source records from OpenFlights' `airlines.dat`, including source ID, name, alias, IATA/ICAO codes, callsign, country and the source's active flag. Retrieval date: 2026-11-25. OpenFlights describes its airline data as a snapshot and its database as ODbL/DbCL; the source active flag must not be presented as verified current operating status. Source: https://openflights.org/data.php. The file is connected to the searchable public directory at `airlines.html`.


## Airline directory connection
The stored OpenFlights reference file is now loaded by `airlines.html`. The page provides search by name, alias, country, IATA, ICAO and callsign, country/source-flag filters, and pagination. The home page and worldwide comparison page link to this directory. It remains historical reference data, not a live airline registry or flight feed.

## Additional stored reference datasets
- **Airports and aerodromes:** OurAirports public-domain snapshots are stored under `data/ourairports/`: 86,389 airport/facility rows, 48,449 runway rows, 30,403 radio-frequency rows, and 11,008 navaid rows (as of the current committed snapshot). These describe facilities, not scheduled flights or passenger traffic per airport.
- **Airline route archive and aircraft type codes:** OpenFlights snapshots under `data/openflights/`: 67,663 historical route rows and 246 aircraft type-code rows. Route records are historical and do not establish a current operating schedule or aircraft assignment.
- **Public transport feed catalogue:** `data/mobility-database/feeds_v2.csv` stores 8,149 feed metadata records from MobilityData. It is not a local mirror of the GTFS schedules; each feed's status, authentication and licence must be checked before ingestion.
- **Country passenger and tourism indicators:** `data/worldbank/passenger-statistics.json` stores 31,430 non-null annual observations from World Bank WDI indicators, including air passengers, registered-carrier departures, rail passenger-kilometres and international tourism arrivals/departures. Units and indicator definitions are stored with each observation. Rail passenger-kilometres are not a count of unique passengers.
- **Cruise passenger statistics:** `data/cruise-statistics.json` stores 226 observations from CLIA's 2025 Global Market Report and Carnival Corporation's SEC filing for 2022–2025: global passenger totals, source regions and selected source markets, destination trade volumes, average cruise duration and passenger age. The report remains CLIA copyrighted; the repository stores attributed factual observations only. See `DATA_SOURCES.md` for source and interpretation notes.
- **Wikidata hotel, cruise ship, registered aircraft, car rental and attraction records:** importer and monthly refresh workflow are in `scripts/import-wikidata-travel.mjs` and `.github/workflows/refresh-wikidata-travel.yml`. Outputs are stored under `data/wikidata/` after a successful run. Wikidata structured data is CC0; the selected classes are not exhaustive and only properties present in the source are populated, including explicit room counts (P8733) when recorded.

## Current record-browser page
The single public database hub is `global-database.html`. Its expandable sections load the stored JSON/CSV records in-page, with search and pagination. Source datasets remain separately downloadable. Map discovery and the feed catalogue must not be described as complete route or property inventories.

- **Maritime/ferry passenger movements:** Eurostat `mar_pa_aa` import stored at `data/eurostat/maritime-passengers.json`, with source metadata and an EU/EFTA/candidate-country commercial-reuse filter. It includes port/subnational and country reporting entities and separates total, non-cruise, cruise embark/disembark and cruise excursion units where reported. Movements are not unique passenger counts; this source is European, not worldwide.

- **Rail passenger statistics:** Eurostat `rail_pa_total` annual data stored at `data/eurostat/rail-passengers.json`, with both passenger counts and passenger-kilometres, filtered to eligible EU/EFTA/candidate reporting countries.
- **Bus and coach passenger statistics:** Eurostat `road_pa_buscoa` annual data stored at `data/eurostat/bus-passengers.json`. Collection is voluntary and cross-country comparability is limited. Source units are preserved.
