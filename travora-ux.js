/* TRAVORA UX layer — accessible booking tabs, responsive navigation and consistent grids */
(function(){
  "use strict";
  document.documentElement.classList.add("trv-ux-ready");
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
    if(!t.id&&id)t.id="home-tab-"+id;
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
  $$("header").forEach((header,index)=>{
    const nav=$(".travora-main-nav",header);
    if(!nav||$(".travora-mobile-menu-toggle",header))return;
    header.classList.add("trv-has-mobile-nav");
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

  // Shared Trip.com-inspired navigation: desktop collapsible rail and mobile slide-out drawer.
  const navItems=[
    {group:"Core Booking",items:[["Stays","stays.html","▣"],["Flights","booking.html#flights","✈"],["Flight + Hotel","booking.html#flight-hotel","▤"],["Trains","booking.html#trains","🚆"],["Cars","booking.html#cars","🚗"],["Transfers","transfers.html","⇄"],["Attractions","attractions.html","☆"],["eSIM & Data","booking.html#esim","▤"]]},
    {group:"Explore & Plan",items:[["Countries","countries.html","◎"],["Cities","cities.html","⌖"],["Islands","islands.html","◒"],["World Map","world-map.html","🌐"],["Destination Guides","guides.html","▤"],["Trip Planner","planner.html","✎"],["Travel Articles","articles.html","▧"]]}
  ];
  const siteHeader=$("body>header")||$(".travora-site-header")||$(".site-header")||$(".main-header");
  if(siteHeader&&!$(".trv-sidebar")){
    document.body.classList.add("trv-layout-ready");
    const aside=document.createElement("aside");aside.className="trv-sidebar";aside.setAttribute("aria-label","TRAVORA main navigation");
    aside.innerHTML='<a class="trv-sidebar-brand" href="/index.html"><img src="/assets/travora-mark.svg" alt=""><span>TRAVORA</span></a>';
    navItems.forEach(group=>{
      const section=document.createElement("div");section.className="trv-sidebar-section";
      const heading=document.createElement("span");heading.className="trv-sidebar-heading";heading.textContent=group.group;section.appendChild(heading);
      group.items.forEach(([label,href,icon])=>{
        const a=document.createElement("a");a.className="trv-side-link";a.href=href;
        a.innerHTML='<span class="trv-side-icon" aria-hidden="true">' + icon + '</span><span class="trv-side-label"></span>';
        $(".trv-side-label",a).textContent=label;
        const current=location.pathname.replace(/\\/$/,"/index.html").split("/").pop();
        const target=href.split(/[?#]/)[0].split("/").pop();
        if(target===current)a.setAttribute("aria-current","page");
        section.appendChild(a);
      });aside.appendChild(section);
    });document.body.appendChild(aside);
    const backdrop=document.createElement("div");backdrop.className="trv-sidebar-backdrop";backdrop.setAttribute("aria-hidden","true");document.body.appendChild(backdrop);
    const controls=document.createElement("div");controls.className="trv-utility-links";
    const toggle=document.createElement("button");toggle.type="button";toggle.className="trv-sidebar-toggle";toggle.setAttribute("aria-label","Toggle navigation");toggle.setAttribute("aria-expanded","false");toggle.innerHTML='<span aria-hidden="true">☰</span><span class="trv-toggle-text">Menu</span>';controls.appendChild(toggle);
    [["Booking Hub","/booking.html"],["Compare Travel","/global-compare.html"],["About","/about.html"],["Account","/account.html"]].forEach(([label,href])=>{const a=document.createElement("a");a.href=href;a.textContent=label;controls.appendChild(a);});
    siteHeader.appendChild(controls);
    const closeDrawer=()=>{document.body.classList.remove("trv-drawer-open");toggle.setAttribute("aria-expanded","false");};
    toggle.addEventListener("click",()=>{
      if(window.matchMedia("(min-width: 1024px)").matches){document.body.classList.toggle("trv-sidebar-collapsed");toggle.setAttribute("aria-expanded",String(document.body.classList.contains("trv-sidebar-collapsed")));}
      else{const open=document.body.classList.toggle("trv-drawer-open");toggle.setAttribute("aria-expanded",String(open));}
    });
    backdrop.addEventListener("click",closeDrawer);aside.addEventListener("click",e=>{if(e.target.closest("a"))closeDrawer();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();});
  }
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
