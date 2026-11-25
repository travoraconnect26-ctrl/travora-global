import fs from 'node:fs/promises';

const base = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/';
const files = ['routes.dat', 'planes.dat'];
await fs.mkdir('data/openflights', { recursive: true });
const rowCounts = {};
for (const name of files) {
  const response = await fetch(base + name, { headers: { 'user-agent': 'TRAVORA-open-data-import/1.0' } });
  if (!response.ok) throw new Error(`Download failed for ${name}: HTTP ${response.status}`);
  const body = await response.text();
  if (!body.trim() || body.trimStart().startsWith('<')) throw new Error(`Invalid data response for ${name}`);
  rowCounts[name] = body.trimEnd().split(/\r?\n/).length;
  await fs.writeFile('data/openflights/' + name, body, 'utf8');
  console.log(`Saved ${name}: ${rowCounts[name]} rows, ${Buffer.byteLength(body)} bytes`);
}
const metadata = {
  dataset: 'OpenFlights airline route and aircraft type reference',
  source: 'https://openflights.org/data.php',
  repository: 'https://github.com/jpatokal/openflights',
  retrievedAt: new Date().toISOString(),
  licence: 'Open Database License (ODbL) for databases; Database Contents License for individual contents. Share-alike and attribution obligations apply.',
  files,
  rowCounts,
  caveat: 'OpenFlights states that the route supplier stopped updating in June 2014. Route records are historical only and must not be treated as currently operating services, schedules, or booking availability. planes.dat is a type-code reference, not airline-specific fleet ownership, fleet size, or aircraft assignment.'
};
await fs.writeFile('data/openflights/metadata.json', JSON.stringify(metadata, null, 2) + '\n');
