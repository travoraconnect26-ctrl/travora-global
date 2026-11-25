import fs from 'node:fs/promises';

const endpoint = 'https://query.wikidata.org/sparql';
const common = `
  ?item rdfs:label ?itemLabel. FILTER(LANG(?itemLabel)="en")
  OPTIONAL { ?item wdt:P17 ?country. OPTIONAL { ?country rdfs:label ?countryLabel. FILTER(LANG(?countryLabel)="en") } }
  OPTIONAL { ?item wdt:P131 ?adminArea. OPTIONAL { ?adminArea rdfs:label ?adminAreaLabel. FILTER(LANG(?adminAreaLabel)="en") } }
  OPTIONAL { ?item wdt:P625 ?coordinates. }
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P137 ?operator. OPTIONAL { ?operator rdfs:label ?operatorLabel. FILTER(LANG(?operatorLabel)="en") } }
  OPTIONAL { ?item wdt:P1083 ?capacity. }
  OPTIONAL { ?item wdt:P8733 ?rooms. }
  OPTIONAL { ?item wdt:P969 ?address. }
  OPTIONAL { ?item wdt:P176 ?manufacturer. OPTIONAL { ?manufacturer rdfs:label ?manufacturerLabel. FILTER(LANG(?manufacturerLabel)="en") } }
  OPTIONAL { ?item wdt:P426 ?registration. }
  OPTIONAL { ?item wdt:P606 ?firstFlight. }
`;
const datasets = [
  {
    key:'hotels',
    title:'Hotels and accommodation places',
    description:'Wikidata-listed hotels, resort hotels, hostels, guest houses and lodging entities. Not a complete hotel inventory.',
    limit:8000,
    where:`VALUES ?type { wd:Q27686 wd:Q2880255 wd:Q654772 wd:Q2460422 wd:Q875157 wd:Q5056668 }
      ?item wdt:P31 ?type.
      ${common}`
  },
  {
    key:'cruise-ships',
    title:'Cruise ships',
    description:'Wikidata-listed cruise ships. Capacity, operator and home port appear only when recorded in Wikidata.',
    limit:3000,
    where:`?item wdt:P31/wdt:P279* wd:Q39804.
      OPTIONAL { ?item wdt:P504 ?homePort. }
      OPTIONAL { ?item wdt:P571 ?inception. }
      ${common}`
  },
  {
    key:'car-rental-companies',
    title:'Car rental companies',
    description:'Wikidata-listed car rental companies. This is a company reference list, not a directory of every rental branch.',
    limit:2000,
    where:`?item wdt:P31 wd:Q291240.
      OPTIONAL { ?item wdt:P17 ?country. }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P571 ?inception. }
`
  },
  {
    key:'aircraft-registrations',
    title:'Registered aircraft records',
    description:'Wikidata-listed aircraft with a civil registration identifier. Historical and current status are not inferred.',
    limit:4000,
    where:`?item wdt:P426 ?registration.
      ?item wdt:P31 ?type.
      OPTIONAL { ?type rdfs:label ?typeLabel. FILTER(LANG(?typeLabel)="en") }
      ${common}`
  },
  {
    key:'attractions',
    title:'Tourist attractions and landmarks',
    description:'Wikidata-listed tourist attractions, landmarks, monuments and museums. Coverage depends on community-entered records.',
    limit:8000,
    where:`VALUES ?type { wd:Q570116 wd:Q2319498 wd:Q4989906 wd:Q33506 wd:Q839954 }
      ?item wdt:P31 ?type.
      ${common}`
  }
];
function val(bindings,key){return bindings[key]?.value ?? ''}
function entityId(uri){return uri.match(/entity\/(Q[0-9]+)/)?.[1]||''}
async function query(dataset){
  const sparql=`SELECT DISTINCT ?item ?itemLabel ?typeLabel ?countryLabel ?adminAreaLabel ?coordinates ?website ?operatorLabel ?capacity ?rooms ?address ?homePortLabel ?inception ?manufacturerLabel ?registration ?firstFlight WHERE { ${dataset.where} } ORDER BY ?item LIMIT ${dataset.limit}`;
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
        recordedCapacity:val(b,'capacity'),
        rooms:val(b,'rooms'),
        address:val(b,'address'),
        shippingPort:val(b,'homePortLabel'),
        inception:val(b,'inception'),
        manufacturer:val(b,'manufacturerLabel'),
        registration:val(b,'registration'),
        firstFlight:val(b,'firstFlight')
      })).filter(x=>x.wikidataId && x.name);
    }catch(error){last=error; if(attempt<4) await new Promise(r=>setTimeout(r,attempt*8000));}
  }
  throw last;
}
await fs.mkdir('data/wikidata',{recursive:true});
const metadata={source:'Wikidata',sourceUrl:'https://www.wikidata.org/',queryService:endpoint,licence:'CC0 1.0 (Wikidata structured data)',retrievedAt:new Date().toISOString(),datasets:{}};
await fs.writeFile('data/wikidata/metadata.json',JSON.stringify(metadata,null,2)+'\\n');
for(const d of datasets){
  const records=await query(d);
  const unique=[...new Map(records.map(x=>[x.wikidataId,x])).values()];
  await fs.writeFile(`data/wikidata/${d.key}.json`,JSON.stringify(unique));
  metadata.datasets[d.key]={title:d.title,description:d.description,records:unique.length,limit:d.limit,file:`data/wikidata/${d.key}.json`,queryScope:'Direct instance-of classes listed in the importer; not an exhaustive global registry.'};
  console.log(`${d.key}: ${unique.length} Wikidata records`);
}
await fs.writeFile('data/wikidata/metadata.json',JSON.stringify(metadata,null,2)+'\n');
