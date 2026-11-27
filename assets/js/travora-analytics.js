/* TRAVORA GA4 interaction measurement. Requires the site's TRAVORA GA4 tag (G-HL59SJE1TW). */
(function(){
  'use strict';
  function send(name,params){
    if(typeof window.gtag==='function') window.gtag('event',name,params||{});
  }
  function clean(value){return String(value||'').trim().slice(0,120);}
  function pageContext(){return {page_title:document.title,page_path:location.pathname};}
  // Lightweight field-performance signals for diagnosing slow pages and layout shifts.
  if('PerformanceObserver' in window){
    const report=(metric,value)=>{
      if(typeof window.gtag==='function'&&Number.isFinite(value))window.gtag('event','travora_web_vital',{metric_name:metric,value:Math.round(value*100)/100,page_path:location.pathname});
    };
    try{
      let lcp=0;new PerformanceObserver(list=>{for(const entry of list.getEntries())lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&lcp)report('LCP_ms',lcp);},{once:true});
    }catch(e){}
    try{
      let cls=0;new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)cls+=entry.value;}).observe({type:'layout-shift',buffered:true});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&cls)report('CLS_x1000',cls*1000);},{once:true});
    }catch(e){}
  }
  document.addEventListener('submit',function(e){
    const form=e.target;
    if(!(form instanceof HTMLFormElement))return;
    const field=form.querySelector('input[type="search"],input[name="q"],input[id="q"],input[id="search"],input[id="databaseSearch"],input[name="destination"],input[placeholder*="Search" i]');
    if(!field)return;
    const query=clean(field.value);
    if(!query)return;
    send('travora_search',Object.assign(pageContext(),{search_term:query,search_area:clean(form.dataset.searchArea||form.id||'site_search')}));
    if(/compare|discover|provider/i.test(form.id+' '+form.className))send('comparison_search',Object.assign(pageContext(),{search_term:query}));
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!e.target.matches('input[type="search"],input[name="q"]'))return;
    const query=clean(e.target.value);if(!query)return;
    send('travora_search',Object.assign(pageContext(),{search_term:query,search_area:clean(e.target.id||'search_input')}));
  },true);
  document.addEventListener('change',function(e){
    const el=e.target;
    if(el.matches('#mapType,#mapRegion,#region,#category,[data-search-filter]')){
      send('discovery_filter_change',Object.assign(pageContext(),{filter_name:clean(el.id||el.name),filter_value:clean(el.value)}));
    }
  },true);
  document.addEventListener('click',function(e){
    const link=e.target.closest('a[href]');
    if(link){
      const href=link.href;
      const label=clean(link.innerText||link.getAttribute('aria-label')||link.href);
      const external=link.hostname&&link.hostname!==location.hostname;
      if(external){
        const host=String(link.hostname||'').toLowerCase();
        const partnerDomains=['tp.st','klook.com','yesim.app','booking.com','agoda.com','trip.com','skyscanner.com','getyourguide.com','viator.com','rentalcars.com','thetrainline.com','omio.com','busbud.com','flixbus.com','directferries.com'];
        const isPartner=link.relList.contains('sponsored')||Boolean(link.dataset.affiliatePartner)||partnerDomains.some(domain=>host===domain||host.endsWith('.'+domain));
        const supplier=isPartner||['cruisecritic.com','royalcaribbean.com','msccruises.com','google.com'].some(domain=>host===domain||host.endsWith('.'+domain));
        const partnerName=clean(link.dataset.affiliatePartner||(host.endsWith('.tp.st')?host.split('.')[0]:host));
        send(supplier?'supplier_outbound_click':'external_link_click',Object.assign(pageContext(),{link_url:href,link_text:label,link_domain:host,link_id:clean(link.id)}));
        if(isPartner)send('affiliate_click',Object.assign(pageContext(),{affiliate_partner:partnerName,affiliate_placement:clean(link.dataset.affiliatePlacement||location.pathname),link_url:href,link_text:label,link_domain:host}));
      }else if(/cities|countries|attractions|islands|guides|stays|global-database|airlines|planner/i.test(link.pathname+' '+link.hash)){
        send('destination_click',Object.assign(pageContext(),{link_url:href,link_text:label,destination_target:link.pathname+link.search+link.hash}));
      }
    }
    if(e.target.matches('#mapSearchWide'))send('map_search_interaction',Object.assign(pageContext(),{search_term:clean(document.querySelector('#mapSearch')?.value)}));
    const button=e.target.closest('button');
    if(button&&['discover','providerSearch','compareQuotes','mapSearchWide'].includes(button.id)){
      send('comparison_search',Object.assign(pageContext(),{search_action:button.id,search_term:clean(document.querySelector('#origin')?.value+' '+document.querySelector('#destination')?.value)}));
    }
  },true);
  document.addEventListener('click',function(e){
    const item=e.target.closest('[data-travora-destination]');
    if(item)send('destination_click',Object.assign(pageContext(),{destination_name:clean(item.dataset.travoraDestination)}));
  },true);
})();
