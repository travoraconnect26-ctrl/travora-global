import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type"};
const out=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="GET")return out({error:"Method not allowed"},405);
 const u=new URL(req.url),type=u.searchParams.get("type")||"",destination=(u.searchParams.get("destination")||"").slice(0,120);
 const keys:Record<string,string>={flight:"TRAVORA_FLIGHT_AFFILIATE_URL",stay:"TRAVORA_STAY_AFFILIATE_URL",car:"TRAVORA_CAR_AFFILIATE_URL",activity:"TRAVORA_ACTIVITY_AFFILIATE_URL"};
 if(!keys[type])return out({error:"Unsupported partner category"},400);
 const base=Deno.env.get(keys[type]);if(!base)return out({error:"Partner account and approved affiliate URL are not configured."},503);
 let target:URL;try{target=new URL(base);}catch{return out({error:"Invalid partner configuration"},500);}
 if(target.protocol!=="https:")return out({error:"Partner URL must use HTTPS"},500);
 if(destination)target.searchParams.set("ss",destination);
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 await db.from("affiliate_clicks").insert({category:type,destination:destination||null,source_page:(u.searchParams.get("source")||"website").slice(0,80)});
 return Response.redirect(target.toString(),302);
});