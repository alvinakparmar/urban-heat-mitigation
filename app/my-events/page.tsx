'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProfileSidebar from '@/components/ProfileSidebar'

interface Event {
  id: string
  title: string
  description: string
  category: string
  venue: string | null
  start_date: string
  status: string
}

export default function MyEvents() {
  const router = useRouter()
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([])
  const [hostedEvents, setHostedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)

        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', authUser.id)
          .eq('status', 'confirmed')

        if (registrations && registrations.length > 0) {
          const eventIds = registrations.map(r => r.event_id)
          const { data: regEvents } = await supabase
            .from('events')
            .select('id, title, description, category, venue, start_date, status')
            .in('id', eventIds)
            .order('start_date', { ascending: true })
          setRegisteredEvents(regEvents || [])
        }

        const { data: hostEvents } = await supabase
          .from('events')
          .select('id, title, description, category, venue, start_date, status')
          .eq('host_id', authUser.id)
          .order('start_date', { ascending: true })

        setHostedEvents(hostEvents || [])

      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-color)' }}>Loading your events...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container" style={{ padding: '140px 24px 80px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '32px', color: 'var(--text-color)' }}>
          My Events
        </h1>

        <div className="profile-layout-grid">
          <ProfileSidebar user={user} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '16px' }}>
                📅 Registered Events ({registeredEvents.length})
              </h2>

              {registeredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-text)' }}>
                  <p>You haven't registered for any events yet.</p>
                  <Link href="/events" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                    Browse Events →
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {registeredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '16px' }}>
                🎤 Hosted Events ({hostedEvents.length})
              </h2>

              {hostedEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-text)' }}>
                  <p>You haven't hosted any events yet.</p>
                  <Link href="/events/create" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                    Create Your First Event →
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hostedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function EventCard({ event }: { event: Event }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: 'var(--bg-color)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      flexWrap: 'wrap',
      gap: '10px'
    }}>
      <div>
        <h4 style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-color)' }}>{event.title}</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span style={{ color: 'var(--gray-text)', fontSize: '0.8rem' }}>
            📍 {event.venue || 'Online'}
          </span>
          <span style={{ color: 'var(--gray-text)', fontSize: '0.8rem' }}>
            📅 {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBA'}
          </span>
          <span style={{
            display: 'inline-block',
            padding: '1px 10px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '600',
            backgroundColor: event.status === 'upcoming' ? '#d1fae5' : '#fef3c7',
            color: event.status === 'upcoming' ? '#065f46' : '#92400e'
          }}>
            {event.status || 'Upcoming'}
          </span>
        </div>
      </div>
      <Link
        href={`/events/${event.id}`}
        style={{
          padding: '4px 14px',
          backgroundColor: 'var(--primary)',
          color: 'white',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '0.8rem',
          fontWeight: '500',
          whiteSpace: 'nowrap'
        }}
      >
        View →
      </Link>
    </div>
  )
}