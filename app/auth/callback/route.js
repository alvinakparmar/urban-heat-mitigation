// app/auth/callback/route.js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('🔍 Callback URL:', requestUrl.toString())
  console.log('🔍 Code:', code)

  if (!code) {
    console.log('❌ No code provided')
    return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
  }

  try {
    const cookieStore = await cookies()
    
    // ✅ Use createServerClient for proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({
              name,
              value,
              ...options,
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7, // 7 days
            })
          },
          remove(name, options) {
            cookieStore.set({
              name,
              value: '',
              ...options,
              path: '/',
              maxAge: 0,
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Session exchange error:', error)
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }

    console.log('✅ Session set successfully for user:', data?.user?.email)

    // ✅ Redirect to events page
    return NextResponse.redirect(new URL('/events', requestUrl.origin))

  } catch (err) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
  }
}