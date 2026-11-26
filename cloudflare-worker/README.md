# TRAVORA supplier API gateway (optional free-tier setup)

This is a small Cloudflare Worker gateway for the Amadeus Self-Service flight API. It keeps supplier credentials on the server. **Never put API secrets in GitHub Pages JavaScript or commit them to this repository.**

## What it supports

- `GET /health` — reports whether secrets are configured and whether the worker uses the test or production API.
- `GET /api/airports?keyword=London` — looks up city/airport codes.
- `GET /api/flights?origin=LHR&destination=JFK&departureDate=2027-02-10&adults=1` — searches flight offers; optional `returnDate=2027-02-20`.

The worker normalizes supplier flight offers and sorts them by total price. It does not book tickets or take payment.

## $0 setup

1. Create a free Cloudflare account and a Worker. Check Cloudflare's current free-plan limits before enabling public traffic.
2. Deploy `src/index.js` as the Worker entry point.
3. Set Worker secrets (not plain website variables):
   - `AMADEUS_CLIENT_ID`
   - `AMADEUS_CLIENT_SECRET`
4. Set Worker variable `ALLOWED_ORIGIN` to `https://travoraconnect26-ctrl.github.io`.
5. For initial development, leave `AMADEUS_BASE_URL` unset. It defaults to `https://test.api.amadeus.com`.
6. Test `/health`, then `/api/airports?keyword=London`, then a flight search with airport codes.

Get API credentials directly from Amadeus for Developers. Access, test data, production approval, quotas and commercial terms are controlled by Amadeus and can change. Do not assume the test environment contains live fares. Production should only be enabled after Amadeus approves the account and the owner understands any applicable fees/limits.

To switch to production after approval, set Worker variable `AMADEUS_BASE_URL` to `https://api.amadeus.com`. This is not a promise of unlimited free usage. Do not enable a paid plan or billing without the owner's explicit decision.

## Important limitations

- This first adapter only covers flight search. It does not connect hotels, buses, trains, ferries, car hire or activities.
- Amadeus airport lookup returns airport/city codes; choose the correct airport when a city has multiple airports.
- Sandbox responses are test data, not live bookable prices. The API response explicitly identifies its environment.
- Live supplier coverage and fares depend on account approval, market, route, airline participation and API limits.
- This gateway is not deployed automatically by GitHub Pages. It needs the owner's Cloudflare account and Amadeus credentials.


## Travelpayouts Partner Links API

The same Worker also provides a **private** link-generation endpoint:

- `POST /api/affiliate-links`
- Requires `Authorization: Bearer <TRAVELPAYOUTS_ADMIN_KEY>`
- Accepts JSON with 1–10 HTTPS destination links and optional `sub_id` values.
- Calls `https://api.travelpayouts.com/links/v1/create` server-side. The API token is never returned to the browser.
- Uses project values `trs=606683` and `marker=811232` from the existing TRAVORA Travelpayouts widget. Override them with Worker variables if Travelpayouts confirms different values.

Add these as **Worker secrets** in Cloudflare (Settings → Variables and Secrets):
- `TRAVELPAYOUTS_API_TOKEN` — the private API access token from Travelpayouts.
- `TRAVELPAYOUTS_ADMIN_KEY` — a separate, strong random key used to authorize link-generation requests.

Optional Worker variables:
- `TRAVELPAYOUTS_TRS` — defaults to `606683`.
- `TRAVELPAYOUTS_MARKER` — defaults to `811232`.

Do not call this endpoint from public website JavaScript or expose the admin key. Use it from a trusted admin terminal or protect a future admin page with Cloudflare Access. This endpoint is intentionally not wired into public TRAVORA pages. The API token and admin key must never be committed to GitHub.
