# TRAVORA website publishing

## Current status

The website is live and the latest version has been checked at:

- https://travoraconnect26-ctrl.github.io/travora-global/
- https://travoraconnect26-ctrl.github.io/travora-global/cities.html
- https://travoraconnect26-ctrl.github.io/travora-global/guides.html

The live site is serving the new map page, GeoNames city index, regional city data chunks and destination guides. The repository is updated on the `main` branch.

## If a future update does not appear

Open [Repository Settings → Pages](https://github.com/travoraconnect26-ctrl/travora-global/settings/pages) and check that the publishing source is configured to deploy the `main` branch from the repository root (`/(root)`). Save the setting if it needs correction.

GitHub Pages publishes changes after a short deployment delay. Check the repository's Actions tab or Pages section if a deployment fails.

## Site files

- `index.html`: home page and interactive world map
- `cities.html`: paginated global populated-place directory
- `guides.html`: 253 editorial destination guides
- `world-cities.json` and `cities/*.json`: regional GeoNames index and data chunks
- `country-data.json`: 195 country reference profiles
- `map-data.json`: country, featured city, island and attraction map pins
- `sitemap.xml` and `robots.txt`: search-engine discovery

See [DATA_SOURCES.md](DATA_SOURCES.md) for the data sources, attributions, licences and coverage limitations.
