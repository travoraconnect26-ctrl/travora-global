(function(){
 const c=window.TRAVORA_CONFIG||{};
 const ready=!!(window.supabase&&c.supabaseUrl&&c.supabaseAnonKey&&!c.supabaseUrl.includes("YOUR-PROJECT")&&!c.supabaseAnonKey.includes("YOUR_"));
 const db=ready?window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
 async function session(){if(!db)return null;const r=await db.auth.getSession();if(r.error)throw r.error;return r.data.session;}
 async function signIn(email,password){if(!db)throw Error("Supabase is not configured.");const r=await db.auth.signInWithPassword({email,password});if(r.error)throw r.error;return r.data;}
 async function signUp(email,password){if(!db)throw Error("Supabase is not configured.");const r=await db.auth.signUp({email,password});if(r.error)throw r.error;return r.data;}
 async function signOut(){if(db){const r=await db.auth.signOut();if(r.error)throw r.error;}}
 async function syncTrips(trips){if(!db)throw Error("Cloud sync is not configured.");const s=await session();if(!s)throw Error("Sign in before syncing.");const rows=(trips||[]).map(t=>({owner:s.user.id,trip_id:String(t.id),trip_data:t,updated_at:new Date().toISOString()}));if(rows.length){const r=await db.from("user_trips").upsert(rows,{onConflict:"owner,trip_id"});if(r.error)throw r.error;}return {synced:rows.length,email:s.user.email};}
 async function loadTrips(){if(!db)throw Error("Cloud sync is not configured.");if(!(await session()))throw Error("Sign in before loading cloud trips.");const r=await db.from("user_trips").select("trip_data").order("updated_at",{ascending:false});if(r.error)throw r.error;return (r.data||[]).map(x=>x.trip_data);}
 window.TravoraCloud={configured:ready,getSession:session,signIn,signUp,signOut,syncTrips,loadTrips};
})();