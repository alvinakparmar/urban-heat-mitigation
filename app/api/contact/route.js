// app/api/contact/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('📨 Received:', body)

    const { name, email, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // ✅ Use the regular Supabase client (it works better for simple inserts)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: name,
          email: email,
          message: message,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Message saved:', data)
    return NextResponse.json(
      { success: true, data: data },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}