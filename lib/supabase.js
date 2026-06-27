// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ Add validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/'
  
  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}