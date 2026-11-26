/* Local-only destination history. No account or server-side profile is created. */
(function(){
 'use strict';
 const KEY='travora_recent_destinations_v1';
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(v=>v&&typeof v.name==='string').slice(0,5):[]}catch(e){return[]}}
 function save(items){try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,5)))}catch(e){}}
 if(location.pathname.endsWith('/guides.html')||location.pathname.endsWith('guides.html')){
  const name=(new URLSearchParams(location.search).get('place')||'').trim();
  if(name){const items=read().filter(x=>x.name.toLowerCase()!==name.toLowerCase());items.unshift({name:name,visitedAt:new Date().toISOString()});save(items);}
 }
 const host=document.getElementById('travoraRecentDestinations');
 if(!host)return;
 const items=read();if(!items.length)return;
 host.hidden=false;
 const list=host.querySelector('[data-recent-list]');
 if(!list)return;
 items.forEach(item=>{
  const a=document.createElement('a');a.href='guides.html?place='+encodeURIComponent(item.name);a.className='travora-recent-link';a.textContent=item.name;
  a.addEventListener('click',()=>{if(typeof window.gtag==='function')window.gtag('event','destination_click',{destination_name:item.name,interaction_location:'recent_destinations'});});
  list.appendChild(a);
 });
 const clear=host.querySelector('[data-recent-clear]');
 if(clear)clear.addEventListener('click',()=>{try{localStorage.removeItem(KEY)}catch(e){}host.hidden=true;});
})();
