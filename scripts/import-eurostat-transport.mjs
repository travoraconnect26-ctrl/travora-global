import fs from 'node:fs/promises';

const base='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
const eligible=new Set('BE BG CZ DK DE EE IE EL ES FR HR IT CY LV LT LU HU MT NL AT PL PT RO SI SK FI SE IS LI NO CH AL BA ME MK RS TR UA MD GE'.split(' '));
function dimCodes(json,dim){
 const idx=json.dimension[dim]?.category?.index||{};
 const arr=Array(json.size[json.id.indexOf(dim)]);
 if(Array.isArray(idx))idx.forEach((v,i)=>arr[i]=v);
 else for(const [code,pos] of Object.entries(idx))arr[Number(pos)]=code;
 return arr;
}
function label(json,dim,code){return json.dimension[dim]?.category?.label?.[code]||code}
async function load(code,filters){
 const query=new URLSearchParams({lang:'en',...filters});
 const url=base+code+'?'+query.toString();
 const res=await fetch(url,{headers:{'user-agent':'TRAVORA-open-statistics-import/1.0 (https://travora.eu.cc)','accept':'application/json'},signal:AbortSignal.timeout(120000)});
 if(!res.ok)throw new Error(code+' Eurostat API HTTP '+res.status);
 const json=await res.json();
 if(!Array.isArray(json.id)||!Array.isArray(json.size)||!json.dimension||!json.value)throw new Error(code+' returned unexpected JSON-stat structure');
 const ids=json.id,sizes=json.size,maps=Object.fromEntries(ids.map(d=>[d,dimCodes(json,d)]));
 const geo=ids.find(x=>x.toLowerCase()==='geo'),unit=ids.find(x=>x.toLowerCase()==='unit'),time=ids.find(x=>x.toLowerCase()==='time');
 if(!geo||!unit||!time)throw new Error(code+' missing geo/unit/time dimensions: '+ids.join(','));
 const cov=ids.find(x=>x.toLowerCase()==='tra_cov');
 const index={};ids.forEach((d,i)=>index[d]=i);
 const values=Array.isArray(json.value)?json.value.map((v,i)=>[String(i),v]):Object.entries(json.value);
 const rows=[];
 for(const [flat,value] of values){
  if(value===null||value===undefined)continue;
  let n=Number(flat);const pos=Array(ids.length);
  for(let i=ids.length-1;i>=0;i--){pos[i]=n%sizes[i];n=Math.floor(n/sizes[i]);}
  const get=d=>maps[d][pos[index[d]]];
  const country=get(geo),unitCode=get(unit),year=get(time);
  if(!eligible.has(country))continue;
  if(cov&&!/total/i.test(label(json,cov,get(cov))))continue;
  const measure=label(json,unit,unitCode);
  if(!/passenger/i.test(measure))continue;
  rows.push({countryCode:country,country:label(json,geo,country),year:Number(year),measure,value:Number(value),source:'Eurostat '+code,sourceUrl:'https://ec.europa.eu/eurostat/databrowser/view/'+code.toLowerCase()+'/default/table?lang=en'});
 }
 return {rows,dimensionLabels:{units:[...new Set(rows.map(x=>x.measure))],countries:[...new Set(rows.map(x=>x.countryCode))]}};
}
const datasets=[
 {code:'rail_pa_total',file:'rail-passengers.json',title:'Rail passengers transported',filters:{freq:'A'}},
 {code:'road_pa_buscoa',file:'bus-passengers.json',title:'Bus and coach passenger transport performance',filters:{freq:'A',tra_cov:'TOTAL'}}
];
await fs.mkdir('data/eurostat',{recursive:true});
const metadata={source:'Eurostat',retrievedAt:new Date().toISOString(),licence:'Eurostat statistical data reuse policy; source attribution required. Commercial-use import restricted to EU, EFTA and official candidate-country reporting entities. Third-party/non-Eurostat data and other territories excluded.',licenceUrl:'https://ec.europa.eu/eurostat/help/copyright-notice',datasets:{}};
for(const d of datasets){
 const result=await load(d.code,d.filters);
 if(!result.rows.length)throw new Error(d.code+' returned no eligible passenger observations.');
 const unique=[...new Map(result.rows.map(x=>[x.countryCode+'|'+x.year+'|'+x.measure,x])).values()];
 await fs.writeFile('data/eurostat/'+d.file,JSON.stringify(unique));
 metadata.datasets[d.code]={title:d.title,file:'data/eurostat/'+d.file,recordCount:unique.length,countries:result.dimensionLabels.countries.sort(),measures:result.dimensionLabels.units,yearRange:[Math.min(...unique.map(x=>x.year)),Math.max(...unique.map(x=>x.year))],scope:'Annual national reporting-country aggregates. Only EU, EFTA and official candidate-country codes are retained for commercial-reuse safety. Passenger-kilometres and passenger counts are kept as separate units.'};
 console.log(d.code+': stored '+unique.length+' annual observations.');
}
metadata.retrievedAt=new Date().toISOString();
await fs.writeFile('data/eurostat/transport-passengers-metadata.json',JSON.stringify(metadata,null,2)+'\n');
