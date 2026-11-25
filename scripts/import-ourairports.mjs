import fs from 'node:fs/promises';

const base = 'https://davidmegginson.github.io/ourairports-data';
const files = ['airports.csv', 'runways.csv', 'airport-frequencies.csv', 'navaids.csv', 'countries.csv', 'regions.csv'];
await fs.mkdir('data/ourairports', { recursive: true });\nconst rowCounts = {};
for (const name of files) {
  const response = await fetch(base + '/' + name, { headers: { 'user-agent': 'TRAVORA-open-data-import/1.0' } });
  if (!response.ok) throw new Error(`Download failed for ${name}: HTTP ${response.status}`);
  const body = await response.text();
  const header = (body.split(/\r?\n/, 1)[0] || '').replace(/^\uFEFF/, '').replaceAll('"', '').split(',');
  if (!header.includes('id') && !header.includes('code') && !header.includes('ident')) {
    throw new Error(`Unexpected CSV format for ${name}: ${header.slice(0, 5).join(',')}`);
  }
  rowCounts[name] = body.trimEnd().split(/\\r?\\n/).length - 1;\n  await fs.writeFile('data/ourairports/' + name, body, 'utf8');
  console.log(`Saved ${name}: ${body.split(/\r?\n/).length - 2} data rows, ${Buffer.byteLength(body)} bytes`);
}
const metadata = {
  dataset: 'OurAirports global airport reference data',
  source: 'https://ourairports.com/data/',
  documentation: 'https://ourairports.com/help/data-dictionary.html',
  downloadBase: base,
  retrievedAt: new Date().toISOString(),
  licence: 'Public domain, per OurAirports terms of use',
  files,
  caveat: 'Community-maintained reference data; no accuracy warranty. Facility classifications and scheduled_service are not proof of live operations. Not a source for live flights, passenger throughput, terminal inventories or current operational status.'
};
await fs.writeFile('data/ourairports/metadata.json', JSON.stringify(metadata, null, 2) + '\n');
