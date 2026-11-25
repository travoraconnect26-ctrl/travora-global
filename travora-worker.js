/* TRAVORA spatial catalog worker: region-sharded city data + IndexedDB cache. */
'use strict';
const DB='travora-spatial-v1', STORE='catalog';
const REGIONS=['africa','asia','europe','north-america','south-america','oceania','other'];
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function get(key){try{const d=await db();return await new Promise((res,rej)=>{const t=d.transaction(STORE,'readonly').objectStore(STORE).get(key);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error);});}catch{return null;}}
async function put(key,val){try{const d=await db();await new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(val,key);t.oncomplete=res;t.onerror=()=>rej(t.error);});}catch{}}
async function fetchJson(url){const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r.json();}
async function loadShard(path){const cached=await get(path);if(cached)return cached;const data=await fetchJson(path);await put(path,data);return data;}
async function catalog(){const shards=[];for(const region of REGIONS){let n=1;while(n<=10){const path='cities/'+region+'-'+n+'.json';try{const d=await loadShard(path);if(!Array.isArray(d.cities)||!d.cities.length)break;shards.push(...d.cities);n++;}catch{break;}}}
try{const attractionPath='data/wikidata/attractions.json';const attractionData=await loadShard(attractionPath);const candidates=Array.isArray(attractionData)?attractionData:(attractionData.attractions||attractionData.items||attractionData.results||[]);for(const a of candidates){const lat=+(a.lat??a.latitude),lng=+(a.lng??a.lon??a.longitude);if(Number.isFinite(lat)&&Number.isFinite(lng))shards.push({...a,lat,lng,region:a.region||'World',type:'Attraction',population:0});}}catch{}
const unique=new Map();for(const c of shards){if(Number.isFinite(+c.lat)&&Number.isFinite(+(c.lng??c.lon)))unique.set(String(c.id??c.name+':'+c.country),{id:c.id,name:c.name,country:c.country,region:c.region||'World',lat:+c.lat,lng:+(c.lng??c.lon),population:+c.population||0,type:c.type||'City'});}
return [...unique.values()];}
self.onmessage=async e=>{const {type,query,region}=e.data||{};try{if(type==='load'){const places=await catalog();self.postMessage({type:'catalog',count:places.length,places});}else if(type==='filter'){const all=await catalog();const q=(query||'').toLowerCase();const places=all.filter(p=>(!region||region==='World'||p.region===region)&&(!q||(p.name+' '+p.country).toLowerCase().includes(q))).slice(0,5000);self.postMessage({type:'filtered',places,count:places.length});}}catch(err){self.postMessage({type:'error',message:String(err)});}};
