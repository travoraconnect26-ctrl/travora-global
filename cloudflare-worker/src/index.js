/**
 * TRAVORA supplier API gateway
 * Cloudflare Worker + Amadeus Self-Service API.
 * Credentials are Worker secrets; never place them in website JavaScript.
 */
const DEFAULT_ORIGIN = "https://travoraconnect26-ctrl.github.io";

function json(data, status = 200, origin = DEFAULT_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type"
    }
  });
}

function cleanCode(value) {
  const v = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(v) ? v : "";
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
    const origin = requestOrigin === allowed ? allowed : allowed;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      }});
    }
    if (request.method !== "GET") return json({ error: "Method not allowed." }, 405, origin);

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, service: "TRAVORA supplier gateway", provider: "Amadeus", configured: Boolean(env.AMADEUS_CLIENT_ID && env.AMADEUS_CLIENT_SECRET), environment: env.AMADEUS_BASE_URL === "https://api.amadeus.com" ? "production" : "test", liveData: env.AMADEUS_BASE_URL === "https://api.amadeus.com" }, 200, origin);
    }

    if (!env.AMADEUS_CLIENT_ID || !env.AMADEUS_CLIENT_SECRET) {
      return json({ error: "Flight supplier is not configured. The site has no supplier credentials yet.", code: "SUPPLIER_NOT_CONFIGURED" }, 503, origin);
    }

    const base = (env.AMADEUS_BASE_URL || "https://test.api.amadeus.com").replace(/\/$/, "");
    try {
      const token = await getToken(env, base);
      if (url.pathname === "/api/airports") {
        const keyword = String(url.searchParams.get("keyword") || "").trim();
        if (keyword.length < 2 || keyword.length > 80) return json({ error: "Enter at least two letters for an airport or city search." }, 400, origin);
        const endpoint = new URL(base + "/v1/reference-data/locations");
        endpoint.searchParams.set("subType", "AIRPORT,CITY");
        endpoint.searchParams.set("keyword", keyword);
        endpoint.searchParams.set("page[limit]", "10");
        const response = await fetch(endpoint, { headers: { Authorization: "Bearer " + token } });
        const body = await response.json();
        if (!response.ok) return json({ error: providerError(body), code: "AIRPORT_LOOKUP_FAILED" }, response.status, origin);
        const airports = (body.data || []).map(x => ({
          iataCode: x.iataCode || "",
          name: x.name || "",
          city: x.address?.cityName || x.name || "",
          country: x.address?.countryName || "",
          type: x.subType || ""
        })).filter(x => x.iataCode);
        return json({ source: "Amadeus", environment: base.includes("test.") ? "test" : "production", liveData: !base.includes("test."), airports }, 200, origin);
      }

      if (url.pathname === "/api/flights") {
        const originCode = cleanCode(url.searchParams.get("origin"));
        const destinationCode = cleanCode(url.searchParams.get("destination"));
        const departureDate = url.searchParams.get("departureDate") || "";
        const returnDate = url.searchParams.get("returnDate") || "";
        const adults = Number(url.searchParams.get("adults") || 1);
        if (!originCode || !destinationCode) return json({ error: "Use valid three-letter airport codes for origin and destination." }, 400, origin);
        if (!validDate(departureDate) || (returnDate && (!validDate(returnDate) || returnDate <= departureDate))) return json({ error: "Enter a valid departure date and an optional return date after departure." }, 400, origin);
        if (!Number.isInteger(adults) || adults < 1 || adults > 9) return json({ error: "Passenger count must be between 1 and 9." }, 400, origin);
        const endpoint = new URL(base + "/v2/shopping/flight-offers");
        endpoint.searchParams.set("originLocationCode", originCode);
        endpoint.searchParams.set("destinationLocationCode", destinationCode);
        endpoint.searchParams.set("departureDate", departureDate);
        endpoint.searchParams.set("adults", String(adults));
        endpoint.searchParams.set("currencyCode", "USD");
        endpoint.searchParams.set("max", "30");
        if (returnDate) endpoint.searchParams.set("returnDate", returnDate);
        const response = await fetch(endpoint, { headers: { Authorization: "Bearer " + token } });
        const body = await response.json();
        if (!response.ok) return json({ error: providerError(body), code: "FLIGHT_SEARCH_FAILED" }, response.status, origin);
        const offers = (body.data || []).map((offer, index) => {
          const legs = (offer.itineraries || []).map(itinerary => ({
            duration: itinerary.duration || "",
            segments: (itinerary.segments || []).map(segment => ({
              from: segment.departure?.iataCode || "",
              to: segment.arrival?.iataCode || "",
              departure: segment.departure?.at || "",
              arrival: segment.arrival?.at || "",
              carrier: segment.carrierCode || "",
              flightNumber: segment.number || "",
              stops: Math.max(0, (itinerary.segments || []).length - 1)
            }))
          }));
          return {
            id: offer.id || String(index + 1),
            price: Number(offer.price?.grandTotal || offer.price?.total || 0),
            currency: offer.price?.currency || "USD",
            validatingAirlineCodes: offer.validatingAirlineCodes || [],
            bookableSeats: offer.numberOfBookableSeats ?? null,
            lastTicketingDate: offer.lastTicketingDate || "",
            itineraries: legs
          };
        }).filter(x => x.price > 0).sort((a, b) => a.price - b.price);
        return json({
          source: "Amadeus Self-Service Flight Offers",
          environment: base.includes("test.") ? "test" : "production",
          liveData: !base.includes("test."),
          route: { origin: originCode, destination: destinationCode, departureDate, returnDate: returnDate || null, adults },
          count: offers.length,
          offers,
          notice: base.includes("test.") ? "Sandbox results are test data and are not live bookable prices." : "Supplier offers can change; confirm final price, baggage and availability with the airline or seller."
        }, 200, origin);
      }

      return json({ error: "Endpoint not found." }, 404, origin);
    } catch (error) {
      return json({ error: error?.name === "AbortError" ? "Supplier request timed out. Try again." : "Supplier connection failed. Please try again later.", detail: env.DEBUG_ERRORS === "true" ? String(error) : undefined }, 502, origin);
    }
  }
};

let cachedToken = null;
let tokenExpiresAt = 0;
async function getToken(env, base) {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;
  const response = await fetch(base + "/v1/security/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.AMADEUS_CLIENT_ID,
      client_secret: env.AMADEUS_CLIENT_SECRET
    })
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error(providerError(body));
  cachedToken = body.access_token;
  tokenExpiresAt = Date.now() + Number(body.expires_in || 1800) * 1000;
  return cachedToken;
}
function providerError(body) {
  return body?.errors?.[0]?.detail || body?.errors?.[0]?.title || body?.error_description || "The supplier could not complete this request.";
}
