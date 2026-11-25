# TRAVORA launch checklist — advertising-only model

## Chosen business model
- TRAVORA is free for travellers.
- Display advertising is the only planned revenue source.
- No affiliate commissions, supplier booking commissions, booking fees, subscriptions, paid AI or paid travel APIs.
- External provider links are optional research handoffs only; they do not currently generate revenue.
- No advertisements are active until an advertising network approves the site and the owner supplies the exact account details needed for integration.

## Built website
- Worldwide discovery homepage and interactive map.
- Searchable country reference directory (195 profiles).
- Worldwide populated-place directory and on-demand small-place lookup.
- Destination guides, islands and attractions.
- Hotel/stay search handoffs, trip ideas and local trip planner.
- Shared navigation, About, Contact, Privacy Policy and Terms pages.
- Sitemap and robots.txt.

## Advertising activation — owner action required later
1. Finish improving original travel content, page quality, source attribution, navigation and mobile usability. A large page count alone does not guarantee approval.
2. Review Google AdSense eligibility, programme policies and the requirements that apply to your country and account: https://adsense.google.com/start/
3. Apply using the real website URL and the owner's accurate legal/payment information. Do not invent a company, address, age, identity or bank details.
4. Wait for Google's account and site approval. No ads can be served before the site is approved.
5. When the account is created, obtain the exact publisher ID from AdSense Account → Settings → Account information. It looks like pub- followed by 16 digits.
6. Give the developer only the publisher ID and the exact ad code/snippet intended for the website. Never share your Google password, OTP, recovery code, bank details or identity documents in chat.
7. Only then add the approved AdSense script to the pages and the exact publisher record supplied by Google to /ads.txt. Never guess or use a sample publisher ID.
8. Confirm privacy disclosures and any legally required consent controls before serving personalized or non-personalized ads. Recheck the live website, ads.txt response and AdSense status.
9. Place ads conservatively so they do not obscure navigation, map controls, search forms or travel content. Do not click your own ads or encourage visitors to click ads.

Official Google guidance:
- Site connection and approval: https://support.google.com/adsense/answer/7584263
- Publisher ID: https://support.google.com/adsense/answer/105516
- ads.txt guide: https://support.google.com/adsense/answer/12171612
- Privacy and account setup: https://support.google.com/adsense/answer/7402256

## Current technical and coverage limits
- Static website hosted by GitHub Pages. Free hosting is subject to platform terms and limits; it is not an unlimited high-traffic hosting guarantee.
- GeoNames cities15000 is not a complete list of every town or village. Public OpenStreetMap Nominatim is rate-limited and is not a bulk/high-volume geocoding backend.
- Selected island and attraction pins are curated discovery references, sometimes approximate.
- Destination guides are a curated subset, not complete coverage of every settlement.
- No live flight, hotel, train, bus, cruise or tour inventory, real-time prices, reservations, payments or account cloud sync are currently connected.
- Country entry, safety, transport, weather, prices, opening hours and access information change. Visitors must confirm critical details with official sources.

## $0 operating rule
Do not add a paid domain, paid API, paid hosting, paid AI service, paid subscription or cloud service that requires a payment method. Do not enable billing. If a free-tier limit is reached, disable or replace that feature rather than incurring charges.

## Before public promotion
- Verify every navigation link and sitemap URL.
- Test mobile layout, keyboard navigation, map fallback and planner export/import.
- Review all content for accuracy, originality, source attribution and licensing.
- Review privacy/terms for applicable laws and the actual deployed technology.
- Check GitHub Pages publishing after each release.
- Add monitoring only if it can be done within the $0 rule and without exposing visitor data.
