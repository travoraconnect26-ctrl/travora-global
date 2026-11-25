# TRAVORA supplier API setup

## First connector: Amadeus flights

A Cloudflare Worker adapter is included in `cloudflare-worker/src/index.js`.

- It keeps the Amadeus client ID and secret server-side.
- It supports airport/city lookup and flight-offer search.
- It returns normalized price, currency, airline codes, flight segments, dates and available seats when supplied.
- It labels test vs production responses. Test responses must never be presented as live bookable prices.

## What is still required from the owner

1. Create an Amadeus for Developers account and obtain credentials.
2. Deploy the Worker using a free Cloudflare account (subject to current free-tier limits).
3. Add the credentials as Worker secrets, not to this GitHub repository.
4. Set the allowed website origin to `https://travoraconnect26-ctrl.github.io`.
5. Test in Amadeus sandbox mode. Production access and terms must be confirmed with Amadeus.
6. After the Worker is tested, set `window.TRAVORA_API_BASE` in `supplier-config.js` to the Worker URL.

The static GitHub Pages site cannot securely store private supplier credentials or run a backend. The API connection cannot return supplier results until the Worker is deployed and valid credentials are supplied.

## $0 and honest-data policy

No paid plan, credit card trial, billing activation, or automatic upgrade is required by this repository change. Cloudflare and Amadeus quotas, account eligibility, terms and future pricing are controlled by those providers. Do not enable paid billing without an explicit owner decision.

No live flight price is available from this code until the supplier account and gateway are configured. No hotel, bus, rail, ferry, car-rental or activity API is connected yet. Those need separate provider agreements and adapters. OpenStreetMap results remain mapped-place discovery, not inventory or fares.
