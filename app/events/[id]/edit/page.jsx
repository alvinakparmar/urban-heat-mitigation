'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'

export default function EditEvent({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [event, setEvent] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'meetup',
    event_type: 'offline',
    venue: '',
    start_date: '',
    end_date: '',
    max_attendees: '',
    is_free: true,
    price: '',
    host_contact: ''
  })

  // ✅ UNWRAP params using React.use()
  const { id: eventId } = React.use(params)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (error) throw error

        // Check if user is the host
        if (data.host_id !== user.id) {
          alert('You are not authorized to edit this event.')
          router.push('/events')
          return
        }

        setEvent(data)
        setCoverImage(data.cover_image || null)
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'meetup',
          event_type: data.event_type || 'offline',
          venue: data.venue || '',
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          max_attendees: data.max_attendees?.toString() || '',
          is_free: data.is_free ?? true,
          price: data.price?.toString() || '',
          host_contact: data.host_contact || ''
        })
      } catch (error) {
        console.error('Error fetching event:', error)
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        event_type: formData.event_type,
        venue: formData.venue || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_attendees: parseInt(formData.max_attendees) || 0,
        is_free: formData.is_free,
        price: formData.is_free ? null : parseFloat(formData.price) || 0,
        host_contact: formData.host_contact || null,
        cover_image: coverImage,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id)

      if (error) throw error

      alert('✅ Event updated successfully!')
      router.push(`/events/${event.id}`)

    } catch (error) {
      console.error('Error updating event:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleImageUpload = (imageUrl) => {
    setCoverImage(imageUrl)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px', textAlign: 'center' }}>
          <p>Loading event details...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-color)',
        paddingTop: '140px',
        paddingBottom: '60px'
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link href={`/events/${eventId}`} style={{ 
            display: 'inline-block', 
            marginBottom: '24px',
            color: 'var(--primary)',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            ← Back to Event
          </Link>

          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border-color)'
          }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-color)' }}>
              Edit Event
            </h1>
            <p style={{ color: 'var(--gray-text)', marginBottom: '24px' }}>
              Update your event details
            </p>

            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <ImageUpload onImageUpload={handleImageUpload} existingImage={coverImage} />

              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="meetup">Meetup</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="concert">Concert</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Event Type *</label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Venue</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g., Main Auditorium"
                  disabled={saving}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    required
                    value={formData.end_date}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Attendees</label>
                  <input
                    type="number"
                    name="max_attendees"
                    value={formData.max_attendees}
                    onChange={handleChange}
                    placeholder="e.g., 100"
                    disabled={saving}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Info</label>
                  <input
                    type="text"
                    name="host_contact"
                    value={formData.host_contact}
                    onChange={handleChange}
                    placeholder="Email or phone number"
                    disabled={saving}
                  />
                </div>
              </div>

              <div style={{ 
                background: 'rgba(46, 125, 50, 0.05)', 
                padding: '20px', 
                borderRadius: '8px', 
                border: '1px solid rgba(46, 125, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_free"
                    checked={formData.is_free}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  This is a FREE Event
                </label>

                {!formData.is_free && (
                  <div className="form-group" style={{ marginBottom: '0', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <label style={{ margin: '0', whiteSpace: 'nowrap' }}>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      required
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Ticket Price"
                      disabled={saving}
                      min="1"
                      style={{ width: '120px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? 'Saving...' : '💾 Update Event'}
                </button>
                <Link
                  href={`/events/${eventId}`}
                  style={{ 
                    padding: '12px 24px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-color)',
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
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