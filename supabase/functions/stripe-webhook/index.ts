import Stripe from "https://esm.sh/stripe@14?target=deno";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async req=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 const key=Deno.env.get("STRIPE_SECRET_KEY"),secret=Deno.env.get("STRIPE_WEBHOOK_SECRET");
 if(!key||!secret)return new Response("Payments not configured",{status:503});
 const stripe=new Stripe(key,{httpClient:Stripe.createFetchHttpClient()}),sig=req.headers.get("stripe-signature");if(!sig)return new Response("Missing signature",{status:400});
 let event:Stripe.Event;try{event=await stripe.webhooks.constructEventAsync(await req.text(),sig,secret,undefined,Stripe.createSubtleCryptoProvider());}catch{return new Response("Invalid signature",{status:400});}
 if(event.type==="checkout.session.completed"){
  const s=event.data.object as Stripe.Checkout.Session,owner=s.metadata?.owner;
  if(owner&&s.metadata?.kind==="travora_service_fee"){
   const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
   const {error}=await db.from("payments").upsert({owner,stripe_session_id:s.id,amount_total:s.amount_total??0,currency:s.currency??"usd",payment_status:s.payment_status??"unknown"},{onConflict:"stripe_session_id"});
   if(error)return new Response("Receipt persistence failed",{status:500});
  }
 }
 return Response.json({received:true});
});