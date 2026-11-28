# TRAVORA launch checklist — advertising + affiliate model

## Chosen business model

- TRAVORA is free for travellers.
- Revenue comes from two planned sources: Google AdSense display advertising and eligible affiliate commissions.
- No subscriptions, mandatory booking fees, paid AI or paid travel APIs.
- Travellers may use TRAVORA's discovery, destination information and planning features without paying TRAVORA.
- External partner links are optional booking/research handoffs. A partner may charge the traveller directly under its own terms; TRAVORA does not collect that booking payment.
- Affiliate commissions are not guaranteed. They depend on the partner programme, valid tracking, qualifying actions, attribution rules and programme terms.
- Google AdSense is TRAVORA's only planned display advertising network. No advertisements are active until Google approves the AdSense account and website and the owner supplies the exact account details needed for integration.
- Do not describe any partner as an active revenue source until its affiliate link, programme status and tracking have been checked.

## Revenue stream A — Google AdSense advertising

1. Google AdSense is the chosen and only planned advertising network for TRAVORA; do not integrate another ad network unless the owner changes this decision.
2. Finish improving original travel content, page quality, source attribution, navigation and mobile usability. A large page count alone does not guarantee approval.
3. Review Google AdSense eligibility, programme policies and the requirements that apply to the owner's country and account: https://adsense.google.com/start/
4. Apply using the real website URL and the owner's accurate legal/payment information. Do not invent a company, address, age, identity or bank details.
5. Wait for Google's account and site approval. No ads can be served before the site is approved.
6. When the account is created, obtain the exact publisher ID from AdSense Account → Settings → Account information. It looks like pub- followed by 16 digits.
7. Give the developer only the publisher ID and the exact ad code/snippet intended for the website. Never share a Google password, OTP, recovery code, bank details or identity documents in chat.
8. Only then add the approved AdSense script to the pages and the exact publisher record supplied by Google to /ads.txt. Never guess or use a sample publisher ID.
9. Confirm privacy disclosures and any legally required consent controls before serving personalized or non-personalized ads. Recheck the live website, ads.txt response and AdSense status.
10. Place ads conservatively so they do not obscure navigation, map controls, search forms or travel content. Do not click your own ads or encourage visitors to click ads.

Official Google guidance:
- Site connection and approval: https://support.google.com/adsense/answer/7584263
- Publisher ID: https://support.google.com/adsense/answer/105516
- ads.txt guide: https://support.google.com/adsense/answer/12171612
- Privacy and account setup: https://support.google.com/adsense/answer/7402256

## Revenue stream B — affiliate partnerships

1. Use the owner's existing Travelpayouts account and approved partner programmes where available. TRAVORA must not pretend to be the booking provider or duplicate a partner's booking/payment system.
2. Keep the traveller journey free on TRAVORA. When a traveller chooses a provider, clearly identify the external handoff and let the provider handle booking, payment, fulfilment, cancellations and customer service.
3. Use only the exact affiliate URLs supplied by the owner or generated in the approved affiliate account. Never invent, alter or replace tracking parameters.
4. Candidate partner links recorded for the project include:
   - Klook: https://klook.tp.st/KcAI5BCw
   - KKday: https://kkday.tp.st/3vFILIdb
   - Localrent: https://localrent.tp.st/RynrlIG5
   - Yesim: https://yesim.tp.st/YKu43bcn
   - Kiwitaxi: https://kiwitaxi.tp.st/tIHDvLp7
   - Welcome Pickups: https://tp.st/umiTVIvk
   - Tiqets: https://tiqets.tp.st/2qsphzEf
   - Kiwi.com: https://kiwi.tp.st/KNGUxCZl
   - GigSky: https://gigsky.tp.st/De7XrAnb
   - Airalo: https://airalo.tp.st/EhX7I5Ut
   - Intui.travel, Go City and Radical Storage: confirm the exact current affiliate URL in the owner's account before publishing or enabling.
5. Treat this list as a verification queue, not proof that every programme or link is currently approved, active or tracking. Confirm each partner's programme status, destination/traffic restrictions, allowed promotional methods, commission rules and link behaviour.
6. Test each link without completing a fake booking. Confirm that it opens the intended provider and preserves the affiliate tracking destination/parameters.
7. Disclose affiliate relationships clearly near relevant links and in the site's affiliate disclosure. Do not promise a commission, discount or booking outcome unless the partner confirms it.
8. Keep partner booking records and commission totals in the partner/Travelpayouts reporting system as the source of truth. Do not claim TRAVORA has confirmed transaction-level tracking until it has been tested.
9. TRAVORA may record outbound clicks for its own analytics, but click counts are not bookings or earned commissions. Keep advertising metrics, outbound clicks, partner bookings and approved commissions separate.
10. Do not collect partner booking payments or store partner payment-card details in TRAVORA. Do not use the Supabase payments table for partner transactions.

## Built website

- Worldwide discovery homepage and interactive map.
- Searchable country reference directory (195 profiles).
- Worldwide populated-place directory and on-demand small-place lookup.
- Destination guides, islands and attractions.
- Hotel/stay search handoffs, trip ideas and local trip planner.
- Shared navigation, About, Contact, Privacy Policy and Terms pages.
- Sitemap and robots.txt.

## Current technical and coverage limits

- Static website hosted by GitHub Pages. Free hosting is subject to platform terms and limits; it is not an unlimited high-traffic hosting guarantee.
- GeoNames cities15000 is not a complete list of every town or village. Public OpenStreetMap Nominatim is rate-limited and is not a bulk/high-volume geocoding backend.
- Selected island and attraction pins are curated discovery references, sometimes approximate.
- Destination guides are a curated subset, not complete coverage of every settlement.
- No live flight, hotel, train, bus, cruise or tour inventory, real-time prices, reservations, TRAVORA-owned payments or account cloud sync are currently connected.
- Partner handoff links do not mean TRAVORA controls availability, prices, booking, payment, cancellations or support.
- Country entry, safety, transport, weather, prices, opening hours and access information change. Visitors must confirm critical details with official sources.

## $0 operating rule

- Do not add a paid domain, paid API, paid hosting, paid AI service, paid subscription or cloud service that requires a payment method.
- Do not enable billing or incur charges without the owner's explicit approval.
- Prefer free tiers and existing partner programmes. Review programme terms for fees, thresholds and eligibility before joining or enabling anything.
- If a free-tier limit is reached, disable or replace that feature rather than incurring charges.
- No publishing, production deployment, paid signup or account activation without the owner's explicit approval.

## Before public promotion

- Verify every navigation link and sitemap URL.
- Verify each affiliate link and partner programme before treating it as active; test destination and tracking behaviour.
- Add and review a clear affiliate disclosure and advertising disclosure.
- Test mobile layout, keyboard navigation, map fallback and planner export/import.
- Review all content for accuracy, originality, source attribution and licensing.
- Review privacy/terms for applicable laws and the actual deployed technology, including advertising, analytics, cookies and affiliate links.
- Confirm advertising approval before adding ad scripts or publisher records to /ads.txt.
- Test any analytics reporting without exposing visitor data or treating clicks as confirmed bookings.
- Check GitHub Pages publishing after each approved release.
- Add monitoring only if it can be done within the $0 rule and without exposing visitor data.
