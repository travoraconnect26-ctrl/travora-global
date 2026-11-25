import fs from 'node:fs/promises';

const indicators = [
  { code: 'IS.AIR.PSGR', name: 'Air transport, passengers carried', unit: 'passengers', definition: 'Passengers carried by air carriers registered in the reporting country, including domestic and international traffic.' },
  { code: 'IS.AIR.DPRT', name: 'Air transport, registered carrier departures worldwide', unit: 'departures', definition: 'Domestic takeoffs and takeoffs abroad by air carriers registered in the reporting country.' },
  { code: 'ST.INT.ARVL', name: 'International tourism, number of arrivals', unit: 'arrivals', definition: 'Inbound international tourist arrivals; this is trips/arrivals, not unique people.' },
  { code: 'ST.INT.DPRT', name: 'International tourism, number of departures', unit: 'departures', definition: 'Outbound international tourist departures; this is trips/departures, not unique people.' }
];
const all = [];
const counts = {};
for (const indicator of indicators) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator.code}?format=json&per_page=20000`;
  const response = await fetch(url, { headers: { 'user-agent': 'TRAVORA-public-statistics-import/1.0', accept: 'application/json' } });
  if (!response.ok) throw new Error(`World Bank API failed for ${indicator.code}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) throw new Error(`Unexpected World Bank API response for ${indicator.code}`);
  const rows = payload[1].filter(x => x.value !== null && x.countryiso3code);
  counts[indicator.code] = rows.length;
  for (const row of rows) all.push({
    country: row.country.value,
    iso2: row.country.id,
    iso3: row.countryiso3code,
    year: Number(row.date),
    indicator: indicator.code,
    indicatorName: indicator.name,
    unit: indicator.unit,
    value: row.value,
    observationStatus: row.obs_status || '',
    sourceNote: row.note || ''
  });
  console.log(`${indicator.code}: stored ${rows.length} non-null observations`);
}
all.sort((a,b)=>a.iso3.localeCompare(b.iso3)||a.indicator.localeCompare(b.indicator)||a.year-b.year);
await fs.mkdir('data/worldbank', { recursive: true });
await fs.writeFile('data/worldbank/passenger-statistics.json', JSON.stringify(all));
const metadata = {
  dataset: 'World Bank World Development Indicators: transport passengers and tourism arrivals/departures',
  source: 'https://data.worldbank.org/',
  api: 'https://api.worldbank.org/v2/',
  licence: 'Creative Commons Attribution 4.0 International (CC BY 4.0), World Bank data catalogue licence',
  retrievedAt: new Date().toISOString(),
  indicators,
  nonNullObservationCounts: counts,
  totalNonNullObservations: all.length,
  caveat: 'Country-level annual aggregates only. Air passengers are attributed to the country where the carrier is registered, not necessarily the country where passengers boarded. Tourism arrivals/departures count trips, not unique individuals, and collection methods vary by country. Missing values are not zero. Not airport-specific, airline-specific, monthly or individual passenger data.'
};
await fs.writeFile('data/worldbank/metadata.json', JSON.stringify(metadata, null, 2) + '\n');
