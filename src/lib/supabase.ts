import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    experimental: {
      // Enable passkey support if the env flag is set
      passkey: process.env.NEXT_PUBLIC_ENABLE_PASSKEY === "true",
    },
  },
});
