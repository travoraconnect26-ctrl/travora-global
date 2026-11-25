import fs from 'node:fs/promises';

const endpoint = 'https://query.wikidata.org/sparql';
const common = `
  OPTIONAL { ?item wdt:P17 ?country. }
  OPTIONAL { ?item wdt:P131 ?adminArea. }
  OPTIONAL { ?item wdt:P625 ?coordinates. }
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P137 ?operator. }
  OPTIONAL { ?item wdt:P1083 ?capacity. }
  OPTIONAL { ?item wdt:P1104 ?rooms. }
  OPTIONAL { ?item wdt:P969 ?address. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
`;
const datasets = [
  {
    key:'hotels',
    title:'Hotels and accommodation places',
    description:'Wikidata-listed hotels, resort hotels, hostels, guest houses and lodging entities. Not a complete hotel inventory.',
    limit:15000,
    where:`VALUES ?type { wd:Q27686 wd:Q2880255 wd:Q654772 wd:Q2460422 wd:Q875157 wd:Q5056668 }
      ?item wdt:P31 ?type.
      ${common}`
  },
  {
    key:'cruise-ships',
    title:'Cruise ships',
    description:'Wikidata-listed cruise ships. Capacity, operator and home port appear only when recorded in Wikidata.',
    limit:5000,
    where:`?item wdt:P31 wd:Q182473.
      OPTIONAL { ?item wdt:P504 ?homePort. }
      OPTIONAL { ?item wdt:P571 ?inception. }
      ${common}`
  },
  {
    key:'car-rental-companies',
    title:'Car rental companies',
    description:'Wikidata-listed car rental companies. This is a company reference list, not a directory of every rental branch.',
    limit:5000,
    where:`?item wdt:P31 wd:Q12283363.
      OPTIONAL { ?item wdt:P17 ?country. }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P571 ?inception. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`
  },
  {
    key:'attractions',
    title:'Tourist attractions and landmarks',
    description:'Wikidata-listed tourist attractions, landmarks, monuments and museums. Coverage depends on community-entered records.',
    limit:15000,
    where:`VALUES ?type { wd:Q570116 wd:Q2319498 wd:Q4989906 wd:Q33506 wd:Q839954 }
      ?item wdt:P31 ?type.
      ${common}`
  }
];
function val(bindings,key){return bindings[key]?.value ?? ''}
function entityId(uri){return uri.match(/entity\/(Q[0-9]+)/)?.[1]||''}
async function query(dataset){
  const sparql=`SELECT DISTINCT ?item ?itemLabel ?typeLabel ?countryLabel ?adminAreaLabel ?coordinates ?website ?operatorLabel ?capacity ?rooms ?address ?homePortLabel ?inception WHERE { ${dataset.where} } ORDER BY ?item LIMIT ${dataset.limit}`;
  const url=endpoint+'?query='+encodeURIComponent(sparql)+'&format=json';
  let last;
  for(let attempt=1;attempt<=4;attempt++){
    try{
      const response=await fetch(url,{headers:{'user-agent':'TRAVORA-open-data-import/1.0 (https://travora.eu.cc)','accept':'application/sparql-results+json'},signal:AbortSignal.timeout(110000)});
      if(!response.ok)throw new Error('Wikidata SPARQL HTTP '+response.status);
      const json=await response.json();
      return json.results.bindings.map(b=>({
        wikidataId:entityId(val(b,'item')),
        wikidataUrl:val(b,'item'),
        name:val(b,'itemLabel'),
        type:val(b,'typeLabel'),
        country:val(b,'countryLabel'),
        administrativeArea:val(b,'adminAreaLabel'),
        coordinates:val(b,'coordinates'),
        website:val(b,'website'),
        operator:val(b,'operatorLabel'),
        passengerOrGuestCapacity:val(b,'capacity'),
        rooms:val(b,'rooms'),
        address:val(b,'address'),
        homePort:val(b,'homePortLabel'),
        inception:val(b,'inception')
      })).filter(x=>x.wikidataId && x.name);
    }catch(error){last=error; if(attempt<4) await new Promise(r=>setTimeout(r,attempt*8000));}
  }
  throw last;
}
await fs.mkdir('data/wikidata',{recursive:true});
const metadata={source:'Wikidata',sourceUrl:'https://www.wikidata.org/',queryService:endpoint,licence:'CC0 1.0 (Wikidata structured data)',retrievedAt:new Date().toISOString(),datasets:{}};
for(const d of datasets){
  const records=await query(d);
  const unique=[...new Map(records.map(x=>[x.wikidataId,x])).values()];
  await fs.writeFile(`data/wikidata/${d.key}.json`,JSON.stringify(unique));
  metadata.datasets[d.key]={title:d.title,description:d.description,records:unique.length,limit:d.limit,file:`data/wikidata/${d.key}.json`,queryScope:'Direct instance-of classes listed in the importer; not an exhaustive global registry.'};
  console.log(`${d.key}: ${unique.length} Wikidata records`);
}
await fs.writeFile('data/wikidata/metadata.json',JSON.stringify(metadata,null,2)+'\n');
