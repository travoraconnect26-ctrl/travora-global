# TRAVORA data sources and licensing

Last reviewed: 24 November 2026.

## Coverage currently in the repository

- 195 country reference profiles, following the common count of 193 UN members plus the Holy See and Palestine.
- 34,248 populated-place records: 34,244 GeoNames cities15000 entries plus four curated featured-city points absent from that extract.
- 15 island destination pins and 22 attraction pins.
- 253 editorial destination guides: 195 country profiles and 58 selected city, island and attraction profiles.
- 34,480 unique interactive map locations: 195 country reference points, 34,248 populated places, 15 island pins and 22 attraction pins.

This is not every settlement, island or attraction on Earth. GeoNames cities15000 includes populated places with population above 15,000 or administrative seats, not every town or village. The detailed editorial guide library is curated and does not yet contain a full guide for every populated place in the global index.

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

### Map tiles
- Tile service: [OpenStreetMap](https://www.openstreetmap.org/)
- Attribution: © OpenStreetMap contributors.
- The public tile server is best-effort and subject to the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Do not bulk-download tiles. For high-volume or commercial production use, review the policy and select a suitable tile provider or hosted service.

### Featured island and attraction map pins
- Coordinates are editorial reference points compiled for discovery and may be approximate.
- They are not turn-by-turn navigation, official boundaries or a substitute for checking the exact entrance, trailhead, terminal or visitor access point.

## Travel-information limitations

- Country and city data are static reference snapshots, not live government or census feeds.
- Visa, passport, safety, health, weather, transport, prices, opening hours, local laws and border requirements change. The guides direct travelers to verify critical details with official sources.
- TRAVORA currently has no live flight, hotel, rail, bus, ferry, tour inventory, booking, payment or affiliate tracking integration.
- A destination pin or editorial mention is not an endorsement of a particular operator or a guarantee of access or safety.

## Map and directory implementation

- Interactive map: Leaflet with marker clustering.
- Base map tiles: OpenStreetMap with visible attribution.
- Country and city data are stored as static JSON files in this repository.
- City directory: searchable and filterable by city, country and region.
