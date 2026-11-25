import fs from 'node:fs/promises';

const url = 'https://files.mobilitydatabase.org/feeds_v2.csv';
const response = await fetch(url, { headers: { 'user-agent': 'TRAVORA-open-mobility-catalog-import/1.0' } });
if (!response.ok) throw new Error(`Mobility Database catalog download failed: HTTP ${response.status}`);
const csv = await response.text();
if (csv.length < 1000 || !csv.toLowerCase().includes('provider')) throw new Error('Mobility Database CSV response did not look like a feed catalog.');
await fs.mkdir('data/mobility-database', { recursive: true });
await fs.writeFile('data/mobility-database/feeds_v2.csv', csv, 'utf8');
const lines = csv.trimEnd().split(/\r?\n/);
const metadata = {
  dataset: 'Mobility Database global open mobility feed catalog',
  source: 'https://github.com/MobilityData/mobility-database-catalogs',
  download: url,
  schema: 'https://github.com/MobilityData/mobility-feed-api/blob/main/docs/SpreadsheetSchemaV2.md',
  retrievedAt: new Date().toISOString(),
  catalogMetadataLicence: 'CC0 (per MobilityData catalog repository README)',
  individualFeedLicence: 'Varies by provider; check each feed license URL before downloading, storing, redistributing or using the feed.',
  rowCountIncludingHeader: lines.length,
  dataRows: lines.length - 1,
  caveat: 'This is a catalog of feed metadata and URLs, not the full GTFS/GTFS-Realtime datasets. Individual feeds have separate provider terms, may require authentication, may be inactive or deprecated, and may cover bus, rail, ferry or other transit. Do not assume every feed is open for unrestricted reuse.'
};
await fs.writeFile('data/mobility-database/metadata.json', JSON.stringify(metadata, null, 2) + '\n');
console.log(`Stored Mobility Database feed catalog: ${metadata.dataRows} feeds, ${Buffer.byteLength(csv)} bytes`);
