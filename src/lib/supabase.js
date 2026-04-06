import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
export const db = supabase.schema('daktari')
