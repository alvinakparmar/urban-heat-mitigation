'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'

export default function CreateEvent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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

  // Get current user ID
  const [userId, setUserId] = useState(null)
  
  useEffect(() => {
    async function getUserId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        // Fallback for testing/unauthenticated
        setUserId('fffdd61d-42ac-44d6-8850-e38294529bde')
      }
    }
    getUserId()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!userId) {
        throw new Error('User not authenticated. Please login first.')
      }

      // Input validation
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        throw new Error('End date must be after start date.')
      }

      const eventData = {
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
        host_id: userId,
        host_type: 'student',
        status: 'upcoming',
        is_approved: true,
        is_public: true,
        cover_image: coverImage  // ✅ Added image field
      }

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()

      if (insertError) throw insertError

      alert('🎉 Event created successfully!')
      router.push('/events')

    } catch (err) {
      console.error('❌ Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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
    console.log('✅ Image uploaded:', imageUrl)
  }

  return (
    <>
      <Navbar />

      <div 
        style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, rgba(245, 245, 220, 0.95), rgba(255, 255, 255, 0.95))',
          paddingTop: '130px',
          paddingBottom: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="form-container" style={{ margin: '0', width: '100%', maxWidth: '650px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
              <i className="fas fa-calendar-plus" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
              Host a New Event
            </h1>
            <p style={{ color: 'var(--gray-text)', marginTop: '6px' }}>
              Fill in the details to create your event
            </p>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '0.92rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ✅ Image Upload */}
            <ImageUpload onImageUpload={handleImageUpload} />

            {/* Title */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Event Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., CodeStorm Hackathon 2026"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Description *</label>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event agenda, rules, and outcomes..."
                disabled={loading}
              />
            </div>

            {/* Category & Event Type Row */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
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

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Event Type *</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="offline">Offline / In-Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Venue */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Venue (Location) *</label>
              <input
                type="text"
                name="venue"
                required={formData.event_type !== 'online'}
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Seminar Hall, 4th Floor (or Online URL)"
                disabled={loading}
              />
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Start Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  required
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>End Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  required
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Max Attendees & Contact */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Max Attendees</label>
                <input
                  type="number"
                  name="max_attendees"
                  value={formData.max_attendees}
                  onChange={handleChange}
                  placeholder="e.g., 120 (0 for unlimited)"
                  disabled={loading}
                  min="0"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Host Contact Info</label>
                <input
                  type="text"
                  name="host_contact"
                  value={formData.host_contact}
                  onChange={handleChange}
                  placeholder="Email or phone number"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Pricing details */}
            <div 
              style={{ 
                background: 'rgba(46, 125, 50, 0.05)', 
                padding: '20px', 
                borderRadius: '8px', 
                border: '1px solid rgba(46, 125, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_free"
                  checked={formData.is_free}
                  onChange={handleChange}
                  disabled={loading}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
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
                    disabled={loading}
                    min="1"
                    style={{ width: '120px', padding: '10px 14px' }}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
              style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Event...
                </>
              ) : (
                <>
                  <i className="fas fa-rocket"></i> Create Event 🎉
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer style={{ background: 'var(--dark)' }}>
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