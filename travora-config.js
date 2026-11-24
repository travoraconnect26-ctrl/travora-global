window.TRAVORA_CONFIG=Object.freeze({
  supabaseUrl:"https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey:"YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
  backendUrl:"https://YOUR-PROJECT.supabase.co/functions/v1",
  cloudSyncEnabled:false,affiliateLinksEnabled:false,paymentsEnabled:false
});
// Only the public Supabase anon/publishable key belongs here.
// Never expose service-role, Stripe secret, or travel-provider credentials.