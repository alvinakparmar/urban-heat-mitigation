// app/auth/callback/route.js
import { createClient } from '@supabase/supabase-js'
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
    // ✅ Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // ✅ Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Session exchange error:', error)
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }

    console.log('✅ Session set successfully for user:', data?.user?.email)

    // ✅ Create response with redirect
    const response = NextResponse.redirect(new URL('/events', requestUrl.origin))

    // ✅ Set the session cookies manually
    if (data?.session) {
      const { access_token, refresh_token } = data.session
      
      // Set access token cookie
      response.cookies.set('sb-access-token', access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      })
      
      // Set refresh token cookie
      response.cookies.set('sb-refresh-token', refresh_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      })
      
      console.log('✅ Cookies set successfully')
    }

    return response

  } catch (err) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
  }
}