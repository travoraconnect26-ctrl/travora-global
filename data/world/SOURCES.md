# TRAVORA open-data provenance and reuse notes

This release uses a reproducible importer at scripts/import_open_data.py. The importer records retrieval dates, upstream URLs, source families and snapshot caveats in the manifest and entity records.

| Dataset | Fields used | Upstream source | Reuse / attribution |
|---|---|---|---|
| Countries | Names, ISO codes, capitals, region, currencies, languages, time zones, driving side | https://restcountries.com/v3.1/all | Confirm current API terms and field coverage at import time. |
| Cities | City name, GeoNames ID, country, admin region, population, coordinates | https://download.geonames.org/export/dump/cities15000.zip | CC BY 4.0; attribute GeoNames. |
| Airports | Scheduled-service large/medium airports, IATA/ICAO, coordinates, municipality | https://davidmegginson.github.io/ourairports-data/airports.csv | Public domain per https://ourairports.com/data/; accuracy is not guaranteed. |
| Airlines and routes | Airline codes and historical direct route observations | https://openflights.org/data.php | Open Database License (ODbL) 1.0; database derivatives must follow share-alike and attribution requirements. |

## Important limitations
- GeoNames cities15000 is filtered to the 1,200 highest-population candidate rows. The importer computes nearest IATA airport by great-circle distance; this is not a ground-transfer estimate.
- OurAirports does not provide terminal maps, live terminal transfers or baggage storage. Those fields are not fabricated; reader copy directs visitors to official airport information.
- OpenFlights route data is a community-maintained static snapshot. A route record does not prove that a flight currently operates, or provide current times, prices, carriers or booking availability.
- No airline baggage allowance or EU261/UK261 eligibility is inferred. Those depend on carrier, itinerary, disruption and applicable law.
- Country guidance links users to US State Department and UK FCDO resources. They are not individualized visa or entry decisions.
- REST Countries and all other upstream terms should be rechecked when refreshing datasets. The manifest stores exact source URLs and retrieval date.

## Refresh
The GitHub Actions workflow .github/workflows/import-open-data.yml refreshes JSON snapshots monthly and validates the data. A refresh can fail if an upstream changes its endpoint, schema, access policy or terms; failures should be reviewed rather than bypassed.