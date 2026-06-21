'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)

  useEffect(() => {
    async function fetchEvents() {
      console.log('🔍 Fetching events...')
      
      try {
        // Get ALL events with no filters first
        const { data, error, status } = await supabase
          .from('events')
          .select('*')
        
        console.log('📊 Full response:', { data, error, status })
        
        if (error) {
          console.error('❌ Error:', error)
          setError(error.message)
        } else {
          console.log('✅ Events found:', data?.length || 0)
          setEvents(data || [])
          setRawResponse({ data, error, status })
        }
      } catch (err) {
        console.error('💥 Catch error:', err)
        setError(err.message)
      }
      setLoading(false)
    }

    fetchEvents()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="font-semibold">Raw Response:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(rawResponse, null, 2)}
        </pre>
      </div>
      
      <div>
        <h2 className="font-semibold">Events Found: {events.length}</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(events, null, 2)}
        </pre>
      </div>
    </div>
  )
}