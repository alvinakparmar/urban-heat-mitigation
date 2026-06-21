'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function AttendeesPage({ params }) {
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // ✅ UNWRAP params using React.use() at component level
  const { id: eventId } = React.use(params)

  useEffect(() => {
    if (!eventId) return

    async function fetchData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (eventError) throw eventError
        setEvent(eventData)

        // Check if user is the host
        if (eventData.host_id === user.id) {
          setIsHost(true)
        } else {
          alert('You are not authorized to view attendees for this event.')
          router.push(`/events/${eventId}`)
          return
        }

        // ✅ FIX: Removed 'email' from users select - it doesn't exist in public.users
        const { data: attendeesData, error: attendeesError } = await supabase
          .from('event_registrations')
          .select(`
            id,
            status,
            registration_date,
            checked_in,
            check_in_time,
            users (
              id,
              full_name,
              username,
              department,
              year_of_study
            )
          `)
          .eq('event_id', eventId)
          .order('registration_date', { ascending: false })

        if (attendeesError) throw attendeesError
        setAttendees(attendeesData || [])

      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId, router])

  const handleCheckIn = async (registrationId, userId) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq('id', registrationId)

      if (error) throw error

      setAttendees(attendees.map(a => 
        a.id === registrationId 
          ? { ...a, checked_in: true, check_in_time: new Date().toISOString() }
          : a
      ))

      alert('✅ Attendee checked in successfully!')

    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in attendee.')
    }
  }

  const handleCancelRegistration = async (registrationId) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      setAttendees(attendees.filter(a => a.id !== registrationId))
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ current_attendees: (event.current_attendees || 0) - 1 })
        .eq('id', event.id)

      if (updateError) {
        console.warn('Could not update attendee count:', updateError)
      }

      alert('✅ Registration cancelled successfully!')

    } catch (error) {
      console.error('Error cancelling registration:', error)
      alert('Failed to cancel registration.')
    }
  }

  const filteredAttendees = attendees.filter(reg => {
    const user = reg.users
    const matchesSearch = user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'checked-in' && reg.checked_in) ||
                         (filterStatus === 'pending' && !reg.checked_in)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px', textAlign: 'center' }}>
          <p>Loading attendees...</p>
        </div>
      </>
    )
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px', textAlign: 'center' }}>
          <p style={{ color: '#dc2626' }}>Error: {error || 'Event not found'}</p>
          <Link href="/events" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            ← Back to Events
          </Link>
        </div>
      </>
    )
  }

  if (!isHost) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px', textAlign: 'center' }}>
          <p>You don't have permission to view this page.</p>
          <Link href={`/events/${eventId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            ← Back to Event
          </Link>
        </div>
      </>
    )
  }

  const checkedInCount = attendees.filter(a => a.checked_in).length

  return (
    <>
      <Navbar />

      <div className="container" style={{ padding: '140px 24px 80px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
              Attendees: {event.title}
            </h1>
            <p style={{ color: 'var(--gray-text)' }}>
              {attendees.length} registered • {checkedInCount} checked in
            </p>
          </div>
          <Link
            href={`/events/${event.id}`}
            style={{
              padding: '8px 20px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            ← Back to Event
          </Link>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {attendees.length}
            </div>
            <div style={{ color: 'var(--gray-text)' }}>Total Registered</div>
          </div>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {checkedInCount}
            </div>
            <div style={{ color: 'var(--gray-text)' }}>Checked In</div>
          </div>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {attendees.length - checkedInCount}
            </div>
            <div style={{ color: 'var(--gray-text)' }}>Pending Check-in</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-color)'
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending Check-in</option>
            <option value="checked-in">Checked In</option>
          </select>
        </div>

        {filteredAttendees.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <p style={{ color: 'var(--gray-text)' }}>No attendees found</p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Department</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Registered</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((reg) => {
                  const user = reg.users
                  return (
                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-color)' }}>{user?.full_name || 'Unknown'}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)' }}>@{user?.username || ''}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-color)' }}>
                        {user?.department || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-text)', fontSize: '0.85rem' }}>
                        {new Date(reg.registration_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: reg.checked_in ? '#d1fae5' : '#fef3c7',
                          color: reg.checked_in ? '#065f46' : '#92400e'
                        }}>
                          {reg.checked_in ? '✅ Checked In' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {!reg.checked_in && (
                            <button
                              onClick={() => handleCheckIn(reg.id)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Check In
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelRegistration(reg.id)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer style={{ background: 'var(--footer-bg)' }}>
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <span className="name">Alvina Parmar</span>
              <span className="role">4th Year Computer Science &amp; Engineering Student</span>
              <span className="role">Developer | Xavier Institute of Engineering</span>
            </div>
            <div className="footer-right">
              <span className="role" style={{ fontSize: '1.05rem', fontWeight: '500' }}>
                <i className="fas fa-envelope" style={{ color: 'var(--primary-light)', marginRight: '8px' }}></i>
                <a href="mailto:202304042.alvinakml@student.xavier.ac.in" style={{ color: 'white', textDecoration: 'none' }}>
                  202304042.alvinakml@student.xavier.ac.in
                </a>
              </span>
              <span style={{ fontSize: '0.85rem', opacity: '0.7' }}>Mahim, Mumbai, Maharashtra 400016</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; 2026 Xavier Institute of Engineering Event Portal</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  )
}