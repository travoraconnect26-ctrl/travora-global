/* TRAVORA spatial catalog worker.
 * Loads only verified repository datasets, caches them in IndexedDB, and
 * returns bounded location sets so the main thread never receives the entire
 * global catalog for every redraw.
 */
'use strict';

const CACHE_DB = 'travora-spatial-cache-v3';
const CACHE_STORE = 'json';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_SHARD_CONCURRENCY = 3;
const REGIONS = [
  'africa', 'asia', 'europe', 'north-america',
  'south-america', 'oceania', 'other'
];
const SHARD_COUNTS = {
  africa: 2,
  asia: 6,
  europe: 3,
  'north-america': 3,
  'south-america': 2,
  oceania: 1,
  other: 1
};
const MAX_RESULTS_BY_ZOOM = [400, 650, 1000, 1600, 2400, 3400, 4800];
const QUERY_RESULT_LIMIT = 700;

let memoryCatalog = null;
let catalogPromise = null;
let requestSequence = 0;

function safeNumber(value, fallback = NaN) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeRegion(value) {
  return cleanText(value).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
}

function normalizeType(value) {
  const type = cleanText(value).toLowerCase();
  if (/^(country|countries)$/.test(type)) return 'country';
  if (/^(city|cities)$/.test(type)) return 'city';
  if (/^(island|islands)$/.test(type)) return 'island';
  if (/^(attraction|attractions)$/.test(type)) return 'attraction';
  return type;
}

function isValidPoint(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function makeId(value) {
  return String(value == null ? '' : value);
}

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function openCache() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
  });
}

async function cacheGet(key) {
  let database;
  try {
    database = await openCache();
    const record = await new Promise((resolve, reject) => {
      const transaction = database.transaction(CACHE_STORE, 'readonly');
      const request = transaction.objectStore(CACHE_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Cache read failed'));
    });
    if (!record || !record.savedAt || Date.now() - record.savedAt > CACHE_TTL_MS) {
      if (record) cacheDelete(key).catch(() => {});
      return null;
    }
    return record.value;
  } catch (_) {
    return null;
  } finally {
    if (database) database.close();
  }
}

async function cachePut(key, value) {
  let database;
  try {
    database = await openCache();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(CACHE_STORE, 'readwrite');
      transaction.objectStore(CACHE_STORE).put({ key, savedAt: Date.now(), value });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Cache write failed'));
      transaction.onabort = () => reject(transaction.error || new Error('Cache write aborted'));
    });
  } catch (_) {
    // The catalog remains usable when browser storage is disabled or full.
  } finally {
    if (database) database.close();
  }
}

async function cacheDelete(key) {
  let database;
  try {
    database = await openCache();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(CACHE_STORE, 'readwrite');
      transaction.objectStore(CACHE_STORE).delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Cache delete failed'));
    });
  } finally {
    if (database) database.close();
  }
}

async function fetchJson(path) {
  const response = await fetch(new URL(path, self.location.href).href, {
    cache: 'no-cache',
    credentials: 'same-origin'
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' loading ' + path);
  return response.json();
}

async function loadJson(path) {
  const cacheKey = 'catalog-v3:' + path;
  const cached = await cacheGet(cacheKey);
  if (cached !== null) return cached;

  const value = await fetchJson(path);
  await cachePut(cacheKey, value);
  return value;
}

function normalizePlace(record, defaults = {}) {
  if (!record || typeof record !== 'object') return null;
  const lat = safeNumber(record.lat ?? record.latitude);
  const lng = safeNumber(record.lng ?? record.lon ?? record.longitude);
  if (!isValidPoint(lat, lng)) return null;

  const name = cleanText(record.name);
  if (!name) return null;

  const country = cleanText(record.country || defaults.country);
  const region = cleanText(record.region || defaults.region || 'World');
  const type = cleanText(record.type || defaults.type || 'City');
  const id = makeId(record.id || record.iso2 || name + ':' + country);
  return {
    id,
    name,
    country,
    region,
    lat,
    lng,
    population: Math.max(0, safeNumber(record.population, 0)),
    type,
    countryCode: cleanText(record.countryCode || record.iso2 || defaults.countryCode),
    guide: cleanText(record.guide || defaults.guide || country || name)
  };
}

function placeKey(place) {
  const type = normalizeType(place.type);
  const name = place.name.toLocaleLowerCase();
  const country = (type === 'country' ? (place.country || place.name) : place.country).toLocaleLowerCase();
  return type + '|' + name + '|' + country;
}

async function mapConcurrent(items, concurrency, task) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function getShardPaths() {
  const paths = [];
  for (const region of REGIONS) {
    for (let index = 1; index <= SHARD_COUNTS[region]; index += 1) {
      paths.push('cities/' + region + '-' + index + '.json');
    }
  }
  return paths;
}

async function buildCatalog() {
  const paths = getShardPaths();
  const shardResults = await mapConcurrent(paths, MAX_SHARD_CONCURRENCY, async path => {
    try {
      const data = await loadJson(path);
      return Array.isArray(data && data.cities) ? data.cities : [];
    } catch (error) {
      // One missing or temporarily unavailable shard should not blank the map.
      return [];
    }
  });

  const placesByKey = new Map();
  for (const shard of shardResults) {
    for (const record of shard) {
      const place = normalizePlace(record, { type: 'City' });
      if (!place) continue;
      const key = placeKey(place);
      const previous = placesByKey.get(key);
      if (!previous || place.population > previous.population) placesByKey.set(key, place);
    }
  }

  try {
    const countriesData = await loadJson('country-data.json');
    const countries = countriesData && countriesData.countries;
    if (countries && typeof countries === 'object') {
      for (const [countryName, record] of Object.entries(countries)) {
        const centroid = record && record.centroid;
        const place = normalizePlace({
          id: 'country-' + cleanText(record && record.iso2),
          name: countryName,
          country: countryName,
          region: record && record.region,
          lat: centroid && centroid.lat,
          lng: centroid && centroid.lng,
          population: record && record.populationReference,
          type: 'Country',
          iso2: record && record.iso2
        }, { type: 'Country' });
        if (place) placesByKey.set(placeKey(place), place);
      }
    }
  } catch (_) {
    // Country data is supplemental; city shards remain available.
  }

  try {
    const mapData = await loadJson('map-data.json');
    const locations = Array.isArray(mapData && mapData.locations) ? mapData.locations : [];
    for (const record of locations) {
      const place = normalizePlace(record, { type: 'Featured' });
      if (!place) continue;
      const key = placeKey(place);
      if (!placesByKey.has(key)) placesByKey.set(key, place);
    }
  } catch (_) {
    // The map's curated points are supplemental.
  }

  const catalog = Array.from(placesByKey.values());
  catalog.sort((a, b) => a.name.localeCompare(b.name) || a.country.localeCompare(b.country));
  return catalog;
}

async function getCatalog() {
  if (memoryCatalog) return memoryCatalog;
  if (!catalogPromise) {
    catalogPromise = buildCatalog().then(catalog => {
      memoryCatalog = catalog;
      return catalog;
    }).catch(error => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

function inBounds(place, bounds) {
  if (!bounds) return true;
  const west = safeNumber(bounds.west, -180);
  const east = safeNumber(bounds.east, 180);
  const south = safeNumber(bounds.south, -90);
  const north = safeNumber(bounds.north, 90);
  if (place.lat < south || place.lat > north) return false;
  return west <= east
    ? place.lng >= west && place.lng <= east
    : place.lng >= west || place.lng <= east;
}

function matchesQuery(place, query, requestedType, requestedRegion) {
  if (requestedRegion && requestedRegion !== 'world') {
    if (normalizeRegion(place.region) !== requestedRegion) return false;
  }
  if (requestedType && normalizeType(place.type) !== requestedType) return false;
  if (!query) return true;
  const searchable = (place.name + ' ' + place.country + ' ' + place.countryCode).toLocaleLowerCase();
  return searchable.includes(query);
}

function resultLimit(zoom, query, requestedType) {
  if (query) return QUERY_RESULT_LIMIT;
  if (requestedType === 'country') return 350;
  const z = Number.isFinite(zoom) ? Math.max(0, Math.min(6, Math.floor(zoom))) : 3;
  return MAX_RESULTS_BY_ZOOM[z];
}

function lodSelect(places, limit, zoom) {
  if (places.length <= limit) return places;
  const z = Number.isFinite(zoom) ? Math.max(0, zoom) : 3;
  const cellSize = Math.max(0.65, 42 / Math.pow(2, Math.max(0, z - 1)));
  const ranked = places.slice().sort((a, b) => {
    const scoreA = a.population + (stableHash(a.id) % 1000);
    const scoreB = b.population + (stableHash(b.id) % 1000);
    return scoreB - scoreA;
  });

  const chosen = [];
  const selected = new Set();
  const cells = new Set();
  for (const place of ranked) {
    const cell = Math.floor((place.lat + 90) / cellSize) + ':' +
      Math.floor((place.lng + 180) / cellSize);
    if (cells.has(cell)) continue;
    cells.add(cell);
    selected.add(place.id);
    chosen.push(place);
    if (chosen.length >= limit) return chosen;
  }

  for (const place of ranked) {
    if (selected.has(place.id)) continue;
    chosen.push(place);
    if (chosen.length >= limit) break;
  }
  return chosen;
}

function processRequest(catalog, message) {
  let query = cleanText(message.query).toLocaleLowerCase();
  let requestedType = normalizeType(message.typeFilter || '');
  const queryIsType = ['country', 'countries', 'city', 'cities', 'island', 'islands', 'attraction', 'attractions'].includes(query);
  if (!requestedType && queryIsType) {
    requestedType = normalizeType(query);
    query = '';
  }
  const requestedRegion = normalizeRegion(message.region);
  const zoom = safeNumber(message.zoom, 3);
  const bounds = message.bounds && typeof message.bounds === 'object' ? message.bounds : null;

  const matches = catalog.filter(place =>
    matchesQuery(place, query, requestedType, requestedRegion) &&
    inBounds(place, bounds)
  );
  const limit = resultLimit(zoom, query, requestedType);
  const places = lodSelect(matches, limit, zoom);
  return { places, total: matches.length, limit };
}

self.onmessage = async event => {
  const message = event && event.data && typeof event.data === 'object' ? event.data : {};
  const type = cleanText(message.type);
  const requestId = message.requestId == null ? ++requestSequence : message.requestId;

  try {
    if (type === 'clear-cache') {
      memoryCatalog = null;
      catalogPromise = null;
      let database;
      try {
        database = await openCache();
        await new Promise((resolve, reject) => {
          const transaction = database.transaction(CACHE_STORE, 'readwrite');
          transaction.objectStore(CACHE_STORE).clear();
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error || new Error('Cache clear failed'));
        });
      } finally {
        if (database) database.close();
      }
      self.postMessage({ type: 'cache-cleared', requestId });
      return;
    }

    if (type !== 'load' && type !== 'filter' && type !== 'viewport') {
      self.postMessage({ type: 'error', requestId, message: 'Unsupported worker message type: ' + type });
      return;
    }

    const catalog = await getCatalog();
    const result = processRequest(catalog, message);
    self.postMessage({
      type: type === 'load' ? 'catalog' : 'filtered',
      requestId,
      count: result.places.length,
      total: result.total,
      catalogCount: catalog.length,
      places: result.places
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId,
      message: error && error.message ? error.message : String(error)
    });
  }
};
