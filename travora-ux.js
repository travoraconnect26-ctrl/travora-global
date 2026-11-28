/* TRAVORA UX layer — accessible booking tabs, responsive navigation and consistent grids */
(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function activateTabs(tabs, panels, selected, panelFor){
    if(!tabs.length||!panels.length)return;
    const activate=(tab,focus)=>{
      const id=panelFor(tab);
      tabs.forEach(t=>{
        const on=t===tab;
        t.setAttribute("aria-selected",String(on));
        t.classList.toggle("active",on);
        t.setAttribute("tabindex",on?"0":"-1");
      });
      panels.forEach(p=>{
        const on=p.id===id;
        p.hidden=!on;
        p.classList.toggle("active",on);
        p.setAttribute("aria-hidden",String(!on));
      });
      if(focus)tab.focus();
    };
    tabs.forEach((tab,i)=>{
      tab.addEventListener("click",()=>activate(tab,false));
      tab.addEventListener("keydown",e=>{
        if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
        e.preventDefault();
        let next=i;
        if(e.key==="ArrowRight")next=(i+1)%tabs.length;
        if(e.key==="ArrowLeft")next=(i-1+tabs.length)%tabs.length;
        if(e.key==="Home")next=0;
        if(e.key==="End")next=tabs.length-1;
        activate(tabs[next],true);
      });
    });
    const initial=tabs.find(t=>t.getAttribute("aria-selected")==="true")||
      tabs.find(t=>t.classList.contains("active"))||tabs[0];
    activate(initial,false);
  }

  const homeTabs=$$("#home-booking-tabs [role=tab]");
  const homePanels=$$("#home-booking-tools [role=tabpanel]");
  homeTabs.forEach(t=>{
    const id=t.dataset.panel;
    if(id)t.setAttribute("aria-controls",id);
  });
  homePanels.forEach(p=>{
    const tab=homeTabs.find(t=>t.dataset.panel===p.id);
    if(tab)p.setAttribute("aria-labelledby",tab.id||"");
  });
  activateTabs(homeTabs,homePanels,null,t=>t.dataset.panel);

  const bookingTabs=$$(".widget .tabs [role=tab]");
  const bookingPanels=$$(".widget [role=tabpanel]");
  activateTabs(bookingTabs,bookingPanels,null,t=>t.getAttribute("aria-controls"));

  // Responsive menu toggle for the shared site header; desktop navigation remains unchanged.
  $$(".travora-site-header").forEach((header,index)=>{
    const nav=$(".travora-main-nav",header);
    if(!nav||$(".travora-mobile-menu-toggle",header))return;
    if(!nav.id)nav.id="travora-main-nav-"+(index+1);
    const button=document.createElement("button");
    button.type="button";
    button.className="travora-mobile-menu-toggle";
    button.setAttribute("aria-controls",nav.id);
    button.setAttribute("aria-expanded","false");
    button.innerHTML='<span aria-hidden="true">☰</span><span class="travora-menu-label">Menu</span>';
    button.addEventListener("click",()=>{
      const open=header.classList.toggle("trv-nav-open");
      button.setAttribute("aria-expanded",String(open));
      button.innerHTML=open
        ?'<span aria-hidden="true">✕</span><span class="travora-menu-label">Close</span>'
        :'<span aria-hidden="true">☰</span><span class="travora-menu-label">Menu</span>';
    });
    header.insertBefore(button,nav);
  });

  // Mark the current internal destination without overriding explicit page states.
  const current=location.pathname.replace(/\/$/,"/index.html").split("/").pop()||"index.html";
  $$(".travora-main-nav a[href]").forEach(link=>{
    const href=link.getAttribute("href")||"";
    if(!href||/^(?:https?:|mailto:|tel:|#)/i.test(href))return;
    const target=href.split(/[?#]/)[0].replace(/\/$/,"/index.html").split("/").pop();
    if(target===current&&!link.hasAttribute("aria-current"))link.setAttribute("aria-current","page");
  });

  // Keep date fields usable on every booking panel without imposing a provider price/availability claim.
  const today=()=>{
    const d=new Date(),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,10);
  };
  $$('form[data-kind] input[type="date"],#home-booking-tools input[type="date"]').forEach(input=>{
    if(!input.min)input.min=today();
  });
})();
