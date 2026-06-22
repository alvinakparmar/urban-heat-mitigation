'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function EventDetail({ params }) {
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [user, setUser] = useState(null)

  const { id: eventId } = React.use(params)

  // ✅ Auto-update event status based on date
  const getUpdatedStatus = (eventData) => {
    if (eventData.status === 'cancelled') return 'cancelled'
    
    const now = new Date()
    const startDate = new Date(eventData.start_date)
    const endDate = new Date(eventData.end_date)
    
    if (endDate < now) return 'completed'
    if (startDate <= now && endDate >= now) return 'ongoing'
    return 'upcoming'
  }

  useEffect(() => {
    async function fetchEventAndStatus() {
      try {
        setLoading(true)
        
        if (!eventId) {
          throw new Error('Event ID is required')
        }
        
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        
        const { data: eventData, error: fetchError } = await supabase
          .from('events')
          .select(`
            *,
            users (full_name, department)
          `)
          .eq('id', eventId)
          .single()

        if (fetchError) throw fetchError
        
        // ✅ Auto-update status
        const updatedStatus = getUpdatedStatus(eventData)
        if (updatedStatus !== eventData.status) {
          await supabase
            .from('events')
            .update({ status: updatedStatus })
            .eq('id', eventId)
          eventData.status = updatedStatus
        }
        
        setEvent(eventData)

        if (currentUser) {
          const { data: registrationData } = await supabase
            .from('event_registrations')
            .select('id, status')
            .eq('event_id', eventId)
            .eq('user_id', currentUser.id)
            .maybeSingle()
          
          console.log('🔍 Registration check:', registrationData)
          
          if (registrationData) {
            setIsRegistered(true)
            setRegistrationMessage('✅ You are registered for this event!')
          }
        }
      } catch (err) {
        console.error('Error fetching event:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEventAndStatus()
  }, [eventId])

  const handleRegister = async () => {
    if (!user) {
      alert('Please login to register for events.')
      router.push('/auth/login')
      return
    }

    if (isRegistered) {
      alert('You are already registered for this event!')
      return
    }

    if (event.status === 'cancelled') {
      alert('This event has been cancelled.')
      return
    }

    setIsRegistering(true)
    setRegistrationMessage('')

    try {
      console.log('📝 Attempting to register user:', user.id, 'for event:', event.id)

      const { data, error: registerError } = await supabase
        .from('event_registrations')
        .insert([
          {
            event_id: event.id,
            user_id: user.id,
            status: 'confirmed',
            registration_date: new Date().toISOString()
          }
        ])
        .select()

      console.log('📊 Insert result:', { data, registerError })

      if (registerError) {
        if (registerError.code === '23505') {
          setIsRegistered(true)
          setRegistrationMessage('✅ You are already registered!')
          alert('You are already registered for this event!')
          return
        }
        throw registerError
      }

      const { error: updateError } = await supabase
        .from('events')
        .update({ current_attendees: (event.current_attendees || 0) + 1 })
        .eq('id', event.id)

      if (updateError) {
        console.warn('Could not update attendee count:', updateError)
      }

      setIsRegistered(true)
      setRegistrationMessage('✅ Successfully registered! 🎉')
      
      setEvent({
        ...event,
        current_attendees: (event.current_attendees || 0) + 1
      })

      alert('🎉 Registration successful!')

    } catch (err) {
      console.error('❌ Registration error:', err)
      setRegistrationMessage(`❌ Failed to register: ${err.message}`)
      alert(`Failed to register: ${err.message}`)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!user || !isRegistered) return

    if (!confirm('Are you sure you want to cancel your registration?')) return

    setIsRegistering(true)

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id)

      if (error) throw error

      const { error: updateError } = await supabase
        .from('events')
        .update({ current_attendees: Math.max((event.current_attendees || 0) - 1, 0) })
        .eq('id', event.id)

      if (updateError) {
        console.warn('Could not update attendee count:', updateError)
      }

      setIsRegistered(false)
      setRegistrationMessage('❌ You have been unregistered from this event.')
      
      setEvent({
        ...event,
        current_attendees: Math.max((event.current_attendees || 0) - 1, 0)
      })

      alert('You have been unregistered from this event.')

    } catch (err) {
      console.error('Unregistration error:', err)
      alert(`Failed to cancel registration: ${err.message}`)
    } finally {
      setIsRegistering(false)
    }
  }

  // ✅ Handle Event Cancellation
  const handleCancelEvent = async () => {
    if (!confirm('Are you sure you want to cancel this event?\n\nRegistered users will be notified that the event is cancelled.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          is_approved: false,
          is_public: false
        })
        .eq('id', event.id)

      if (error) throw error

      setEvent({
        ...event,
        status: 'cancelled',
        is_approved: false,
        is_public: false
      })

      alert('✅ Event has been cancelled.')

    } catch (error) {
      console.error('Error cancelling event:', error)
      alert('Failed to cancel event. Please try again.')
    }
  }

  // ✅ Handle Event Deletion
  const handleDeleteEvent = async () => {
    if (!confirm('⚠️ Are you sure you want to permanently delete this event?\n\nThis action cannot be undone! All registrations will be lost.')) {
      return
    }

    try {
      const { error: regError } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', event.id)

      if (regError) throw regError

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (error) throw error

      alert('✅ Event deleted successfully!')
      router.push('/events')

    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event. Please try again.')
    }
  }

  const categoryStyles = {
    concert: 'linear-gradient(135deg, #FF512F, #DD2476)',
    meetup: 'linear-gradient(135deg, #4776E6, #8E54E9)',
    workshop: 'linear-gradient(135deg, #1D976C, #93F9B9)',
    seminar: 'linear-gradient(135deg, #396afc, #2948ff)',
    cultural: 'linear-gradient(135deg, #e65c00, #F9D423)',
    sports: 'linear-gradient(135deg, #f857a6, #ff5858)',
    other: 'linear-gradient(135deg, #2E7D32, #81C784)'
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '160px 24px 80px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
          <p style={{ color: 'var(--gray-text)', marginTop: '16px' }}>Loading event details...</p>
        </div>
      </>
    )
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '120px 24px 80px', textAlign: 'center' }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '16px' }}></i>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-color)' }}>Event Not Found</h1>
          <p style={{ color: 'var(--gray-text)', marginBottom: '24px' }}>
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/events" className="btn-primary" style={{ display: 'inline-block' }}>
            ← Back to Events
          </Link>
        </div>
      </>
    )
  }

  const categoryLower = event.category?.toLowerCase() || 'other'
  const bannerBackground = categoryStyles[categoryLower] || categoryStyles.other
  const isFull = event.max_attendees && event.current_attendees >= event.max_attendees

  const hasImage = event.cover_image && event.cover_image !== 'null' && event.cover_image !== ''
  const isHost = user && event.host_id === user.id

  // ✅ Get status color
  const getStatusColor = (status) => {
    const colors = {
      upcoming: { bg: '#dbeafe', color: '#1e40af', label: '🟢 Upcoming' },
      ongoing: { bg: '#fef3c7', color: '#92400e', label: '🟡 Ongoing' },
      completed: { bg: '#d1fae5', color: '#065f46', label: '✅ Completed' },
      cancelled: { bg: '#fee2e2', color: '#dc2626', label: '❌ Cancelled' }
    }
    return colors[status] || colors.upcoming
  }

  const statusInfo = getStatusColor(event.status)

  return (
    <>
      <Navbar />
      
      <section 
        style={{ 
          minHeight: '100vh',
          background: 'var(--bg-color)',
          paddingTop: '140px',
          paddingBottom: '60px'
        }}
      >
        <div className="container" style={{ maxWidth: '960px' }}>
          <Link href="/events" style={{ 
            display: 'inline-block', 
            marginBottom: '24px',
            color: 'var(--primary)',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            ← Back to Events
          </Link>
          
          <div style={{
            background: 'var(--card-bg)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '0',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{
              background: bannerBackground,
              padding: '48px 40px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(5px)',
                    padding: '6px 16px',
                    borderRadius: '30px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'inline-block',
                    marginBottom: '16px'
                  }}>
                    {event.category || 'Event'}
                  </span>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    {event.title}
                  </h1>
                </div>
                {/* ✅ Status Badge */}
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.color,
                  whiteSpace: 'nowrap'
                }}>
                  {statusInfo.label}
                </span>
              </div>

              {hasImage && (
                <div style={{
                  width: '100%',
                  height: '300px',
                  overflow: 'hidden',
                  marginTop: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <img 
                    src={event.cover_image} 
                    alt={event.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem'
                }}>
                  👥 {event.current_attendees || 0} / {event.max_attendees || '∞'} attendees
                </span>
                {isFull && (
                  <span style={{
                    background: 'rgba(255,0,0,0.3)',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    🚫 FULL
                  </span>
                )}
                {event.status === 'cancelled' && (
                  <span style={{
                    background: 'rgba(255,0,0,0.3)',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    ❌ CANCELLED
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '40px' }}>
              <div className="event-info-grid">
                <div>
                  <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '1.1rem', color: 'var(--text-color)' }}>
                    📝 Description
                  </h3>
                  <p style={{ color: 'var(--gray-text)', lineHeight: '1.7' }}>
                    {event.description || 'No description available.'}
                  </p>
                </div>
                <div style={{
                  background: 'var(--bg-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  color: 'var(--text-color)'
                }}>
                  <h4 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>
                    Event Information
                  </h4>
                  <div><strong>📍 Location:</strong> {event.venue || 'Online'}</div>
                  <div><strong>📅 Start:</strong> {event.start_date ? new Date(event.start_date).toLocaleString() : 'TBA'}</div>
                  <div><strong>📅 End:</strong> {event.end_date ? new Date(event.end_date).toLocaleString() : 'TBA'}</div>
                  <div><strong>👤 Host:</strong> {event.users?.full_name || 'Unknown'}</div>
                  <div><strong>🏷️ Type:</strong> {event.event_type || 'N/A'}</div>
                  <div><strong>💰 Price:</strong> {event.is_free ? 'Free' : `₹${event.price || '0'}`}</div>
                  <div><strong>📊 Status:</strong> {event.status || 'Upcoming'}</div>
                  <div><strong>👥 Spots:</strong> {event.current_attendees || 0} / {event.max_attendees || '∞'} available</div>
                </div>
              </div>

              {registrationMessage && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: registrationMessage.includes('✅') ? '#d1fae5' : '#fee2e2',
                  border: `1px solid ${registrationMessage.includes('✅') ? '#a7f3d0' : '#fecaca'}`,
                  color: registrationMessage.includes('✅') ? '#065f46' : '#dc2626'
                }}>
                  {registrationMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                {isHost && (
                  <Link
                    href={`/events/${event.id}/attendees`}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}
                  >
                    👥 View Attendees
                  </Link>
                )}

                {isHost && (
                  <Link
                    href={`/events/${event.id}/edit`}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}
                  >
                    ✏️ Edit Event
                  </Link>
                )}

                {/* ✅ Cancel Event - Only for Host */}
                {isHost && event.status !== 'cancelled' && (
                  <button
                    onClick={handleCancelEvent}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                  >
                    ❌ Cancel Event
                  </button>
                )}

                {/* ✅ Delete Event - Only for Host */}
                {isHost && (
                  <button
                    onClick={handleDeleteEvent}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    🗑️ Delete Event
                  </button>
                )}

                {!isRegistered ? (
                  <button 
                    style={{
                      background: isFull || event.status === 'cancelled' ? '#94a3b8' : 'var(--primary)',
                      color: 'white',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: '50px',
                      fontWeight: '600',
                      cursor: isFull || isRegistering || event.status === 'cancelled' ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s ease',
                      opacity: isFull || event.status === 'cancelled' ? 0.6 : 1
                    }}
                    onClick={handleRegister}
                    disabled={isFull || isRegistering || event.status === 'cancelled'}
                  >
                    {isRegistering ? (
                      <>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                        Registering...
                      </>
                    ) : isFull ? (
                      '🚫 Event Full'
                    ) : event.status === 'cancelled' ? (
                      '❌ Cancelled'
                    ) : (
                      <>
                        <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                        Register for Event
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '12px 32px',
                      border: 'none',
                      borderRadius: '50px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onClick={handleUnregister}
                    disabled={isRegistering}
                  >
                    <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                    Cancel Registration
                  </button>
                )}
                
                {!user && (
                  <Link href="/auth/login" style={{
                    background: 'transparent',
                    color: 'var(--primary)',
                    padding: '12px 32px',
                    border: '2px solid var(--primary)',
                    borderRadius: '50px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}>
                    Login to Register
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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