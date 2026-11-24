import Stripe from "https://esm.sh/stripe@14?target=deno";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"https://travoraconnect26-ctrl.github.io","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const out=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return out({error:"Method not allowed"},405);
 const key=Deno.env.get("STRIPE_SECRET_KEY"),price=Deno.env.get("TRAVORA_SERVICE_FEE_PRICE_ID"),site=Deno.env.get("SITE_URL");
 if(!key||!price||!site)return out({error:"Payments are not configured."},503);
 const auth=req.headers.get("Authorization");if(!auth)return out({error:"Sign in required."},401);
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return out({error:"Valid sign-in required."},401);
 // Client cannot set price, currency, product or quantity. Fixed server-owned fee only.
 const stripe=new Stripe(key,{httpClient:Stripe.createFetchHttpClient()});
 const session=await stripe.checkout.sessions.create({mode:"payment",line_items:[{price,quantity:1}],customer_email:user.email,client_reference_id:user.id,metadata:{owner:user.id,kind:"travora_service_fee"},success_url:site+"/account.html?payment=success",cancel_url:site+"/account.html?payment=cancelled"});
 return out({url:session.url});
});