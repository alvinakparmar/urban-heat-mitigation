'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface Event {
  id: string
  title: string
  description: string
  category: string
  venue: string | null
  start_date: string
  status: string
  current_attendees: number
  max_attendees: number | null
}

export default function HostedEvents() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
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
          .select('id, full_name, username, user_type')
          .eq('id', authUser.id)
          .single()

        setUser(userData)

        if (userData?.user_type !== 'host') {
          router.push('/profile')
          return
        }

        // ✅ Auto-update status for hosted events
        const { data, error } = await supabase
          .from('events')
          .select('id, title, description, category, venue, start_date, status, current_attendees, max_attendees')
          .eq('host_id', authUser.id)
          .order('start_date', { ascending: true })

        if (error) throw error

        // ✅ Update statuses
        const now = new Date()
        const updatedEvents = data?.map(event => {
          if (event.status === 'cancelled') return event
          
          const startDate = new Date(event.start_date)
          const endDate = new Date(event.end_date)
          
          let newStatus = event.status
          if (endDate < now) {
            newStatus = 'completed'
          } else if (startDate <= now && endDate >= now) {
            newStatus = 'ongoing'
          } else {
            newStatus = 'upcoming'
          }
          
          if (newStatus !== event.status) {
            supabase
              .from('events')
              .update({ status: newStatus })
              .eq('id', event.id)
              .then(({ error }) => {
                if (error) console.warn('Could not update status:', error)
              })
          }
          
          return { ...event, status: newStatus }
        })

        setEvents(updatedEvents || [])
      } catch (error) {
        console.error('Error loading hosted events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // ✅ Get status color
  const getStatusInfo = (status) => {
    const colors = {
      upcoming: { bg: '#dbeafe', color: '#1e40af', label: '🟢 Upcoming' },
      ongoing: { bg: '#fef3c7', color: '#92400e', label: '🟡 Ongoing' },
      completed: { bg: '#d1fae5', color: '#065f46', label: '✅ Completed' },
      cancelled: { bg: '#fee2e2', color: '#dc2626', label: '❌ Cancelled' }
    }
    return colors[status] || colors.upcoming
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color)' }}>
              Hosted Events
            </h1>
            <p style={{ color: 'var(--gray-text)' }}>Events you have created</p>
          </div>
          <Link
            href="/events/create"
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            + Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎤</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-color)' }}>
              No Events Hosted Yet
            </h2>
            <p style={{ color: 'var(--gray-text)', marginBottom: '16px' }}>
              You haven't created any events yet.
            </p>
            <Link 
              href="/events/create" 
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Create Your First Event →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((event) => {
              const statusInfo = getStatusInfo(event.status)
              return (
                <div 
                  key={event.id} 
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-color)' }}>
                      {event.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>
                        📍 {event.venue || 'Online'}
                      </span>
                      <span style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>
                        📅 {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBA'}
                      </span>
                      <span style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>
                        👥 {event.current_attendees || 0} / {event.max_attendees || '∞'}
                      </span>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color
                      }}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Manage →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}