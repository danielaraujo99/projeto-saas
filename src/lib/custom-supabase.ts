import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://tckhsajvekpnfqtsstlx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja2hzYWp2ZWtwbmZxdHNzdGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTI4NDgsImV4cCI6MjEwMDY4ODg0OH0.6NQgOsns3dPs55MeD-09k6KKJxJgpL19q5w6pHxD2qM";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
