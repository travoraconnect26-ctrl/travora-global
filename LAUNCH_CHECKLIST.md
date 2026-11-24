# TRAVORA production launch checklist

## Built into this repository
- Global discovery, map, country/city directory and destination guides.
- Local trip planner, plus optional Supabase account and cloud-trip-sync client.
- Supabase SQL schema with owner-only row-level security.
- Server-side templates for affiliate click redirects and Stripe checkout/webhook.
- Live provider inventory and paid features remain disabled until approved credentials are configured. No fabricated prices or bookings.

## Cloud accounts and trip sync
1. Create a Supabase project; run supabase/schema.sql in its SQL Editor.
2. Enable email/password authentication, email verification, recovery, email delivery and rate limits.
3. Add the production website URL to Auth allowed URLs.
4. Put only the project URL and public anon/publishable key in travora-config.js. Never put a service-role key in browser files.
5. Deploy the account page and planner cloud controls; test two separate accounts to verify users cannot read or change each other's trips.
6. Turn cloudSyncEnabled on only after RLS and auth tests pass.

## Flight and hotel provider applications
Apply and receive written approval:
- KAYAK Affiliate Network APIs: https://affiliates.kayak.com/apis
- Travelport TripServices: https://developer.travelport.com/docs/getting-started
- Booking.com Demand API: https://developers.booking.com/demand/docs/getting-started/prerequisites
- Expedia Rapid: https://developers.expediagroup.com/rapid/setup
- Wink Partner API: https://wink.travel/developers/quickstart/
Provider access is not automatic. Keep API credentials in trusted Edge Function secrets, never in public JavaScript. Complete sandbox tests, provider display rules, cancellation/refund requirements, rate limits and production certification. Revalidate price and availability before purchase. Do not claim live inventory until a real adapter is deployed and tested.

## Affiliate tracking
After network approval, set the relevant HTTPS partner URL secrets: TRAVORA_FLIGHT_AFFILIATE_URL, TRAVORA_STAY_AFFILIATE_URL, TRAVORA_CAR_AFFILIATE_URL, TRAVORA_ACTIVITY_AFFILIATE_URL. Deploy affiliate-redirect, verify click attribution and disclose affiliate relationships beside links. No commission is active until the network confirms the account.

## Payments
Do not collect supplier booking money unless TRAVORA is legally and contractually approved for that payment role. The Stripe template is limited to one fixed TRAVORA-owned service fee; it cannot accept arbitrary browser amounts.
Before enabling: verify the Stripe business, define the real service/refund/tax terms, create a fixed Stripe Price, deploy both Stripe functions, register the webhook and set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TRAVORA_SERVICE_FEE_PRICE_ID and SITE_URL. Test in Stripe test mode. Keep paymentsEnabled false until receipts, refunds, disputes and webhook retries pass.

## Required server secrets
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server only). For payment: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TRAVORA_SERVICE_FEE_PRICE_ID, SITE_URL. For affiliates: only the approved partner HTTPS URLs and any provider-required credentials.

## Production release gates
- Admin MFA, least-privilege access, secret rotation, backups and retention/deletion process.
- RLS tests for every table; affiliate and payment writes server-only.
- Abuse protection, rate limits, monitoring, error alerts and webhook signature/duplicate-event tests.
- Test XSS, auth enumeration, session expiry, privacy disclosures, mobile/accessibility and browser compatibility.
- Review privacy policy, terms, travel-seller licensing, tax, cancellation/refund and consumer-protection obligations in target markets.
- Beta rollout before public launch; monitor errors and external map tile usage policy.

## Current status
TRAVORA is not yet a live booking or payment agency. Supabase project setup, partner approvals, API credentials, Stripe verification, legal documents and production QA require owner action. Keep paid/live flags disabled until each gate passes.
