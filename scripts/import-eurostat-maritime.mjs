import fs from 'node:fs/promises';

const endpoint='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/mar_pa_aa';
const eligibleCountries=new Set('BE BG CZ DK DE EE IE EL ES FR HR IT CY LV LT LU HU MT NL AT PL PT RO SI SK FI SE IS LI NO CH AL BA ME MK RS TR UA MD GE'.split(' '));
const url=endpoint+'?lang=en&freq=A';
const response=await fetch(url,{headers:{'user-agent':'TRAVORA-open-statistics-import/1.0 (https://travora.eu.cc)','accept':'application/json'},signal:AbortSignal.timeout(120000)});
if(!response.ok)throw new Error('Eurostat maritime API HTTP '+response.status);
const json=await response.json();
if(!Array.isArray(json.id)||!Array.isArray(json.size)||!json.dimension||!json.value)throw new Error('Unexpected Eurostat JSON-stat response');
const ids=json.id, sizes=json.size;
function codesFor(dim){
 const d=json.dimension[dim];
 const index=d?.category?.index||{};
 const out=Array(sizes[ids.indexOf(dim)]);
 if(Array.isArray(index)){index.forEach((code,i)=>out[i]=code)}
 else for(const [code,pos] of Object.entries(index))out[Number(pos)]=code;
 return out;
}
function labelsFor(dim,code){return json.dimension[dim]?.category?.label?.[code]||code}
const maps=Object.fromEntries(ids.map(id=>[id,codesFor(id)]));
const directDim=ids.find(x=>x.toLowerCase()==='direct');
const unitDim=ids.find(x=>x.toLowerCase()==='unit');
const repDim=ids.find(x=>x.toLowerCase()==='rep_mar');
const timeDim=ids.find(x=>x.toLowerCase()==='time');
if(!directDim||!unitDim||!repDim||!timeDim)throw new Error('Eurostat maritime dimensions changed: '+ids.join(','));
const directCodes=maps[directDim].filter(code=>/total/i.test(labelsFor(directDim,code)));
if(!directCodes.length)throw new Error('Could not identify total passenger movement direction in Eurostat metadata');
const allowedUnits=maps[unitDim].filter(code=>/thousand.*passengers/i.test(labelsFor(unitDim,code)));
if(!allowedUnits.length)throw new Error('Could not identify passenger units in Eurostat metadata');
const position={};ids.forEach((id,i)=>position[id]=i);
const entries=Array.isArray(json.value)?json.value.map((v,i)=>[String(i),v]):Object.entries(json.value);
const rows=[];
for(const [flat,value] of entries){
 if(value===null||value===undefined)continue;
 let n=Number(flat);const coordinates=Array(ids.length);
 for(let i=ids.length-1;i>=0;i--){coordinates[i]=n%sizes[i];n=Math.floor(n/sizes[i]);}
 const codeFor=id=>maps[id][coordinates[position[id]]];
 const rep=codeFor(repDim), countryCode=String(rep).slice(0,2);
 if(!eligibleCountries.has(countryCode))continue;
 const direct=codeFor(directDim),unit=codeFor(unitDim);
 if(!directCodes.includes(direct)||!allowedUnits.includes(unit))continue;
 const time=codeFor(timeDim), repLabel=labelsFor(repDim,rep);
 rows.push({
  countryCode,
  reportingEntityCode:rep,
  reportingEntity:repLabel,
  entityType:String(rep).includes('_')?'port-or-subnational-entity':'country',
  year:Number(time),
  direction:labelsFor(directDim,direct),
  measure:labelsFor(unitDim,unit),
  value:Number(value),
  unit:'thousand passenger movements',
  source:'Eurostat dataset mar_pa_aa',
  sourceUrl:'https://ec.europa.eu/eurostat/databrowser/view/mar_pa_aa/default/table?lang=en'
 });
}
const unique=[...new Map(rows.map(x=>[x.reportingEntityCode+'|'+x.year+'|'+x.measure,x])).values()];
const metadata={
 dataset:'Eurostat maritime passenger movements — annual',
 code:'mar_pa_aa',
 source:'Eurostat',
 sourceUrl:'https://ec.europa.eu/eurostat/databrowser/view/mar_pa_aa/default/table?lang=en',
 api:endpoint,
 retrievedAt:new Date().toISOString(),
 licence:'Eurostat statistical data reuse policy; source attribution required. Commercial-use import is restricted here to EU, EFTA and official candidate-country reporting entities. Third-party/non-Eurostat data and other territories are excluded.',
 licenceUrl:'https://ec.europa.eu/eurostat/help/copyright-notice',
 scope:'Annual total passenger movements by reporting country and port/subnational entity. Includes total, non-cruise, cruise embark/disembark and cruise excursion measures where reported. Only reporting entities with eligible country-code prefixes are retained.',
 definition:'Embarkations and disembarkations are movements, not unique persons. The same passenger may be counted more than once. Values are in thousands.',
 recordCount:unique.length,
 countries:[...new Set(unique.map(x=>x.countryCode))].sort(),
 reportingEntities:[...new Set(unique.map(x=>x.reportingEntityCode))].length,
 measures:[...new Set(unique.map(x=>x.measure))],
 yearRange:unique.length?[Math.min(...unique.map(x=>x.year)),Math.max(...unique.map(x=>x.year))]:[],
 excludedCountryCodes:'All reporting entities outside the EU, EFTA and official candidate-country allowlist are excluded for commercial-reuse safety.'
};
if(!unique.length)throw new Error('Eurostat import returned zero eligible records; no empty snapshot will be published.');
await fs.mkdir('data/eurostat',{recursive:true});
await fs.writeFile('data/eurostat/maritime-passengers.json',JSON.stringify(unique));
await fs.writeFile('data/eurostat/metadata.json',JSON.stringify(metadata,null,2)+'\n');
console.log('Stored '+unique.length+' Eurostat annual maritime passenger observations across '+metadata.reportingEntities+' reporting entities.');
