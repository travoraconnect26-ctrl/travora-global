# TRAVORA data sources and licensing

Last reviewed: 25 November 2026.

## Coverage currently in the repository

- 195 country reference profiles, following the common count of 193 UN members plus the Holy See and Palestine.
- 34,248 populated-place records: 34,244 GeoNames cities15000 entries plus four curated featured-place points absent from that extract. The current city index contains records under 245 country/territory labels; this is broader than the separate 195 country reference profiles and includes territories and special-status places.
- 15 island destination pins and 22 attraction pins.
- 253 editorial destination guides: 195 country profiles and 58 selected city, island and attraction profiles.
- 34,480 unique interactive map locations: 195 country reference points, 34,248 populated places, 15 island pins and 22 attraction pins.

This is not every settlement, island or attraction on Earth. GeoNames cities15000 includes populated places with population above 15,000 or administrative seats, not every town or village. The detailed editorial guide library is curated and does not yet contain a full guide for every populated place in the global index. The city directory supplements this static index with a user-initiated OpenStreetMap settlement lookup for additional smaller towns and villages.

## Data sources

### Country identity, names, capital, currency and language reference
- Source: [Annexare/Countries](https://github.com/annexare/Countries)
- Licence: MIT.
- Used for: ISO country identifiers, native names, capitals, currencies, languages and calling codes.

### Country population, area, subregion, demonym, timezone and centroid reference
- Source: [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database)
- Licence: Open Data Commons Open Database License (ODbL) 1.0.
- Used for: population reference, area, subregion, demonym, timezones, country centroid, flag emoji and top-level domain.
- The country reference database includes adapted ODbL material. The database and derivative database must comply with ODbL share-alike requirements. See the [ODbL text](https://opendatacommons.org/licenses/odbl/1-0/).

### Global populated-place directory
- Source: [GeoNames cities15000 extract](https://download.geonames.org/export/dump/cities15000.zip)
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0).
- Used for: place names, country codes, administrative areas, coordinates, population reference, feature type and timezone.
- The current index contains 34,244 GeoNames records plus four curated TRAVORA city points. GeoNames describes this extract as populated places above 15,000 inhabitants or administrative seats.
- Required attribution: “Contains GeoNames geographical data, used under Creative Commons Attribution 4.0. https://www.geonames.org/”
- The source is supplied “as is”; population and place data can be incomplete or out of date.

### Wider town and settlement lookup
- Search service: [Nominatim](https://nominatim.openstreetmap.org/) using OpenStreetMap data. The user-triggered lookup is available in both the Cities & towns directory and the interactive world map.
- Licence/attribution: OpenStreetMap data © OpenStreetMap contributors, available under the Open Database Licence (ODbL). Results link back to OpenStreetMap and Google Maps.
- Use: one explicit search after a visitor enters a place name and clicks the lookup button; no keystroke autocomplete or bulk geocoding. The page caches recent search results and enforces a minimum one-second interval between uncached requests in the current browser session.
- Public service: best-effort, rate-limited and not an SLA. The public Nominatim policy sets an absolute maximum of one request per second for the entire website/application, summed across all users; the browser-side interval and cache do not enforce that global limit. See the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/). This is suitable only as an early low-traffic, user-triggered fallback. If TRAVORA traffic grows, disable this endpoint or replace it with a compliant globally rate-limited/cache-backed service or self-hosted data source before scaling; do not assume the public endpoint can serve millions of visitors.

### Map tiles
- Tile service: [OpenStreetMap](https://www.openstreetmap.org/)
- Attribution: © OpenStreetMap contributors.
- The public tile server is best-effort and subject to the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Do not bulk-download tiles. For high-volume or commercial production use, review the policy and select a suitable tile provider or hosted service.

### City card photography
- Source: Wikimedia Commons geosearch API, using each populated place's GeoNames coordinates.
- The directory requests geotagged media within an approximate 10 km radius when a city card enters view. It does not reuse generic regional stock-photo pools.
- Each displayed image links to its Wikimedia Commons file page. The file page provides the individual creator credit and licence terms; licences vary by file.
- A nearby geotagged image may show a landmark or place close to the city rather than a representative city panorama. If no distinct nearby image is found, the card displays a no-photo placeholder instead of inventing a match.
- Image availability depends on Commons coverage and its public API; it is not guaranteed for every settlement.

### Featured island and attraction map pins
- Coordinates are editorial reference points compiled for discovery and may be approximate.
- They are not turn-by-turn navigation, official boundaries or a substitute for checking the exact entrance, trailhead, terminal or visitor access point.

### Worldwide comparison and map discovery page
- Page: [TRAVORA worldwide comparison](https://travora.eu.cc/global-compare.html).
- Map search uses the public [Nominatim](https://nominatim.openstreetmap.org/) geocoder to locate a user-entered place, then the public [Overpass API](https://overpass-api.de/) to retrieve nearby OpenStreetMap objects.
- Categories include bus stops, train stations, ferry terminals, cruise-port/harbour map features, airports, hotels/stays, attractions and car-rental locations. Cruise-port results are inferred from mapped harbour, port and ferry-terminal tags; they are not cruise schedules or cruise-line calls. Searches are user initiated, not background crawls.
- Displayed results are mapped places within an approximate 5 km radius, not verified operating services, route connections, departure times, cruise itineraries, ticket inventory or fares. Where OpenStreetMap contains them, TRAVORA displays mapped address, operator, phone, website, opening hours and other tags. It also offers a Google Maps search link so visitors can view Google's own public photos and reviews; TRAVORA does not use Google Maps API or copy Google's photos. A missing result does not prove a service does not exist.
- Data attribution: © OpenStreetMap contributors, available under ODbL. Users should review the [OpenStreetMap copyright and licence information](https://www.openstreetmap.org/copyright).
- Public geocoding and Overpass servers are community services with variable availability and rate limits. They are best-effort and are not a guaranteed commercial data service. Do not bulk query or assume capacity for high traffic; production-scale use requires a compliant hosted/self-hosted data strategy.
- The page includes a manual quote comparison table. Users enter prices they have independently obtained; TRAVORA sorts those entered amounts. This is not an automatic provider price feed.

## Travel-information limitations

- Country and city data are static reference snapshots, not live government or census feeds.
- Visa, passport, safety, health, weather, transport, prices, opening hours, local laws and border requirements change. The guides direct travelers to verify critical details with official sources.
- TRAVORA has no authorized live flight, hotel, rail, bus, ferry, tour inventory or fare API integration. Provider search links are handoffs only. The manual comparison tool ranks prices entered by the visitor; it does not retrieve or verify provider prices. TRAVORA does not provide booking or payment.
- A destination pin or editorial mention is not an endorsement of a particular operator or a guarantee of access or safety.

## Map and directory implementation

- Interactive map: Leaflet with marker clustering.
- Base map tiles: OpenStreetMap with visible attribution.
- Country and city data are stored as static JSON files in this repository.
- City directory: searchable and filterable by city, country and region.


## Supplier API connector scaffold (not yet active)

- A Cloudflare Worker adapter for Amadeus airport lookup and flight-offer search is included at `cloudflare-worker/src/index.js`.
- The static site can display normalized flight offers when an owner-deployed Worker URL is configured in `supplier-config.js`.
- This connector is **not deployed, not credentialed and not currently returning supplier offers**. The website continues to show external provider handoffs until setup is completed.
- Amadeus sandbox responses are test data, not live bookable fares. Production access requires provider approval and may be subject to quotas, eligibility and fees.
- No hotel, bus, rail, ferry, car-rental or activity supplier API is connected.
- Setup guide: [SUPPLIER_API_SETUP.md](SUPPLIER_API_SETUP.md).


### Stored airline directory
- Page: [TRAVORA airline directory](https://travora.eu.cc/airlines.html).
- Data: 6,162 records imported from the OpenFlights `airlines.dat` snapshot on 2026-11-25, stored at `data/airlines-openflights.json`.
- Search: client-side filtering by airline name, alias, country, IATA, ICAO and callsign, with pagination.
- Licence: Open Database License (ODbL) for the database and Database Contents License (DbCL) for individual contents. Public redistribution must comply with attribution and share-alike terms. Source: https://openflights.org/data.php.
- Limitation: source active flags are not verified current operating status; some records may be historical, duplicate, incomplete or non-passenger operators.


## Global Travel Database hub
- Public topic hub: `global-database.html` (https://travora.eu.cc/global-database.html).
- The hub groups airline/aviation, airports, hotels, cruises, rail, buses, ferries, car rental, settlements, attractions, passenger statistics and travel services into topics and subtopics. It links to existing directories and mapped discovery pages.
- The hub is an index and coverage guide, not evidence that all subtopic datasets have been imported. Each card states its current coverage status.

### Stored worldwide airport, runway, frequency and navigation-aid reference
- Page: [TRAVORA airport database](https://travora.eu.cc/airports.html).
- Source: [OurAirports daily open-data downloads](https://ourairports.com/data/) and [data dictionary](https://ourairports.com/help/data-dictionary.html).
- Imported files: `airports.csv`, `runways.csv`, `airport-frequencies.csv`, `navaids.csv`, `countries.csv` and `regions.csv`, stored under `data/ourairports/`.
- Terms: OurAirports states that its data is public domain, with no warranty of accuracy or fitness for use.
- Refresh: GitHub Actions workflow `.github/workflows/refresh-ourairports.yml`, scheduled weekly and manually runnable. The source publishes daily snapshots; TRAVORA's scheduled mirror is weekly.
- Fields and joins: use the OurAirports data dictionary; airport `id` is its persistent internal identifier, `ident` is the interoperability key, `iso_country` joins countries, and `iso_region` joins regions.
- Scope limitations: community-maintained airport/aerodrome records, runway geometry and declared radio frequencies/navigation aids. This is not a verified list of active commercial airports, not terminal-by-terminal facilities, not live operational status, not flight schedules, and not airport passenger throughput. The scheduled-service flag is a source classification, not a live service guarantee.

### Stored airline route archive and aircraft type codes
- Page: [TRAVORA airline routes and aircraft reference](https://travora.eu.cc/aviation-routes.html).
- Source: [OpenFlights data downloads](https://openflights.org/data.php), upstream snapshot at [jpatokal/openflights](https://github.com/jpatokal/openflights).
- Files: `data/openflights/routes.dat` and `data/openflights/planes.dat`; refreshed by `.github/workflows/refresh-openflights.yml`.
- Licence: Open Database License (ODbL) for databases and Database Contents License for individual contents. Attribution and share-alike requirements apply; review source terms before redistributing derivatives.
- Critical limitation: OpenFlights explicitly says the third-party route supplier stopped updating in June 2014. The route list is historical only, not a current route map or live timetable. Aircraft type codes do not contain airline-specific fleet ownership, fleet size or aircraft assignment.

### Country-level passenger and tourism statistics
- Page: [TRAVORA passenger statistics directory](https://travora.eu.cc/passenger-statistics.html).
- Source: [World Bank World Development Indicators](https://data.worldbank.org/) via the [Indicators API v2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392).
- Stored indicators: `IS.AIR.PSGR` (air passengers carried), `IS.AIR.DPRT` (registered carrier departures), `IS.RRS.PASG.KM` (rail passenger-kilometres), `ST.INT.ARVL` (international tourism arrivals) and `ST.INT.DPRT` (international tourism departures).
- Files: `data/worldbank/passenger-statistics.json` and `data/worldbank/metadata.json`; scheduled refresh is configured in `.github/workflows/refresh-worldbank.yml`.
- Licence: World Bank data catalogue states CC BY 4.0; retain attribution and licence information when reusing.
- Interpretation: annual national aggregates, not airport-level or airline-level data. Air passenger totals are attributed to the carrier's registration country. Tourism arrivals/departures count trips, not unique people. Data collection methods vary and missing values are not zero. No individual passenger records are collected.

### Global public transport feed catalog (bus, rail, ferry and other modes)
- Page: [TRAVORA global transit feed directory](https://travora.eu.cc/transit-feeds.html).
- Source: [MobilityData Mobility Database Catalogs](https://github.com/MobilityData/mobility-database-catalogs), published catalog CSV [feeds_v2.csv](https://files.mobilitydatabase.org/feeds_v2.csv).
- Stored file: `data/mobility-database/feeds_v2.csv`, with provenance in `data/mobility-database/metadata.json`; refresh workflow `.github/workflows/refresh-mobility-catalog.yml`.
- Catalog metadata licence: CC0, as stated by the MobilityData catalog repository.
- Individual feed terms: each provider's feed licence is separate. Authentication, status and latest URL must be checked per feed.
- Scope limitation: this is a catalogue of feed metadata and links, not a mirror of every GTFS/GTFS-Realtime schedule. It does not mean all routes, timetables or realtime data are stored in TRAVORA. Only feeds with suitable reuse rights should be downloaded and integrated.

### Wikidata travel reference datasets
- Stored outputs: `data/wikidata/hotels.json`, `cruise-ships.json`, `car-rental-companies.json`, `attractions.json`, and `metadata.json`.
- Importer: `scripts/import-wikidata-travel.mjs`; monthly refresh: `.github/workflows/refresh-wikidata-travel.yml`.
- Source and query service: [Wikidata](https://www.wikidata.org/) and [Wikidata Query Service](https://query.wikidata.org/).
- Licence: Wikidata structured data is released under CC0 1.0.
- Scope: selected direct instance-of classes only. These are reference records, not exhaustive inventories or verified operating status. Hotel rooms, live availability, prices, cruise itineraries and real-time ship status are not inferred. Optional room counts (Wikidata P8733), brand (P1716), recorded capacity (P1083), operator, shipping port (P504), registry port/country (P532/P8047), IMO (P458), MMSI (P587), call sign (P2317), gross tonnage (P1093), coordinates and website fields appear only when present in source records.
- Attribution/provenance: each stored record retains its Wikidata item URL and ID; import metadata records retrieval date, query service and row counts.

### Cruise passenger statistics (CLIA)
- Stored dataset: `data/cruise-statistics.json` (226 observations: CLIA 2022–2025 and SEC capacity estimates 2023–2026).
- Source: Cruise Lines International Association, [CLIA 2025 Global Market Report](https://cruising.org/sites/default/files/2026-04/CLIA%20001%20Overview%20Global.pdf), released in 2026.
- Includes global ocean-going passenger totals, source passenger regions, selected source markets, destination trade volumes, average cruise duration, average passenger age, and aggregate fleet berth-capacity estimates. Capacity estimates use two passengers per cabin; 2024–2026 exclude unannounced retirements.
- Units and definitions are retained per observation. Region/source-market/destination values are not additive independent totals; destination figures are passenger visits, not unique individuals.
- Copyright: the underlying factual observations are attributed to CLIA; the report itself remains CLIA copyrighted and is not copied into the repository. This is a manually transcribed, source-attributed statistical snapshot, not an automated licensed feed.

### Eurostat annual maritime passenger movements
- Stored output: `data/eurostat/maritime-passengers.json`; import metadata: `data/eurostat/metadata.json`.
- Source dataset: [Eurostat mar_pa_aa — Passengers embarked and disembarked in all ports by direction, annual data](https://ec.europa.eu/eurostat/databrowser/view/mar_pa_aa/default/table?lang=en).
- Importer: `scripts/import-eurostat-maritime.mjs`; quarterly refresh workflow: `.github/workflows/refresh-eurostat-maritime.yml`.
- Includes total passenger movements and the separately reported non-cruise, cruise embark/disembark and cruise-excursion measures, where available, by reporting country and port/subnational entity.
- Units are thousand passenger movements. Embarkations/disembarkations are movements, not unique persons. A passenger may be counted more than once.
- Reuse policy: [Eurostat commercial and non-commercial reuse notice](https://ec.europa.eu/eurostat/help/copyright-notice). The importer retains only reporting entities whose country prefix is in the EU, EFTA or official candidate-country allowlist to avoid commercial reuse of excluded-country records. Source attribution is retained.
- This is European coverage, not a worldwide port census.
