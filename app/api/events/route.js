import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('📡 API: Fetching events...')
    
    // Try with NO filters
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
    
    console.log('📊 API data:', data)
    console.log('❌ API error:', error)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        count: 0 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      events: data || [],
      message: data?.length > 0 ? 'Events found!' : 'No events in database'
    })
  } catch (err) {
    console.error('💥 API error:', err)
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 })
  }
}