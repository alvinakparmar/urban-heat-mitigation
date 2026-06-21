// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import EventCard from '@/components/EventCard'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        
        const { data, error: fetchError } = await supabase
          .from('events')
          .select(`
            *,
            users (full_name, department)
          `)
          .order('start_date', { ascending: true })

        if (fetchError) throw fetchError

        // ✅ Auto-update status and filter out completed events
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
          
          // If status changed, update in database
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

        // ✅ Filter out completed events - ONLY SHOW UPCOMING, ONGOING, CANCELLED
        const activeEvents = updatedEvents?.filter(event => 
          event.status !== 'completed'
        ) || []

        console.log('📊 Active events (excluding completed):', activeEvents.length)
        console.log('📊 Total events:', updatedEvents?.length)

        setEvents(activeEvents)
        setFilteredEvents(activeEvents)
      } catch (err) {
        console.error('Error fetching events:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Progress bar
    const progressBar = document.getElementById('progress-bar')
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      if (progressBar) progressBar.style.width = progress + '%'
    }
    window.addEventListener('scroll', handleScroll)

    // Back to top
    const backTop = document.getElementById('back-top')
    const handleScrollVisibility = () => {
      if (window.scrollY > 400) {
        backTop?.classList.add('visible')
      } else {
        backTop?.classList.remove('visible')
      }
    }
    window.addEventListener('scroll', handleScrollVisibility)

    const scrollUp = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    backTop?.addEventListener('click', scrollUp)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScrollVisibility)
      backTop?.removeEventListener('click', scrollUp)
    }
  }, [])

  // Apply filters
  useEffect(() => {
    let result = events

    if (selectedCategory !== 'all') {
      result = result.filter(
        (event) => event.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase()
      result = result.filter(
        (event) =>
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.venue?.toLowerCase().includes(query)
      )
    }

    setFilteredEvents(result)
  }, [searchTerm, selectedCategory, events])

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'concert', label: 'Concerts' },
    { value: 'meetup', label: 'Meetups' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'seminar', label: 'Seminars' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'sports', label: 'Sports' }
  ]

  return (
    <>
      <div id="progress-bar"></div>
      <Navbar />

      <section 
        className="section-padding" 
        style={{ 
          minHeight: '100vh',
          background: 'var(--bg-color)',
          paddingTop: '140px' 
        }}
      >
        <div className="container">
          <div className="section-title-wrap" style={{ marginBottom: '40px' }}>
            <h1 className="section-title">Campus Events Directory</h1>
            <p className="section-sub">
              Explore and register for upcoming workshops, summits, hackathons, and cultural fests at XIE.
            </p>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              padding: '24px', 
              marginBottom: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search events by title, description or venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 20px 14px 46px',
                    borderRadius: '50px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.95rem',
                    background: 'var(--card-bg)',
                    color: 'var(--text-color)',
                    outline: 'none',
                    transition: 'var(--transition)'
                  }}
                />
                <i 
                  className="fas fa-search" 
                  style={{ 
                    position: 'absolute', 
                    left: '18px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--primary)',
                    fontSize: '1rem'
                  }}
                ></i>
              </div>

              <Link href="/events/create" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-plus"></i> Host New Event
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-color)' }}>
                Filter By:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={selectedCategory === cat.value ? 'btn-secondary' : 'btn-outline'}
                  style={{ 
                    padding: '6px 18px', 
                    fontSize: '0.85rem',
                    borderRadius: '30px',
                    borderWidth: selectedCategory === cat.value ? '0' : '2px'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
              <p style={{ color: 'var(--gray-text)', fontWeight: '500' }}>Fetching latest events from database...</p>
            </div>
          ) : error ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', borderColor: '#fee2e2', background: '#fffbeb' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#d97706', marginBottom: '16px' }}></i>
              <h3 style={{ color: '#92400e', marginBottom: '8px' }}>Failed to Load Events</h3>
              <p style={{ color: '#b45309', marginBottom: '20px' }}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div 
              className="glass-card" 
              style={{ 
                padding: '80px 40px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)'
              }}
            >
              <i className="fas fa-calendar-times" style={{ fontSize: '4rem', color: 'var(--primary-light)', opacity: '0.6' }}></i>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-color)' }}>No Events Found</h3>
              <p style={{ color: 'var(--gray-text)', maxWidth: '460px' }}>
                We couldn't find any events matching your search criteria. Try adjusting your filters or search terms.
              </p>
              <Link href="/events/create" className="btn-secondary" style={{ marginTop: '8px' }}>
                Host the First Event!
              </Link>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '8px', background: 'var(--card-bg)', borderRadius: '8px', color: 'var(--primary)', fontWeight: '600' }}>
                ✅ Showing {filteredEvents.length} active events
              </div>
              
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
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

      <button id="back-top" aria-label="Back to top">
        <i className="fas fa-arrow-up"></i>
      </button>
    </>
  )
}