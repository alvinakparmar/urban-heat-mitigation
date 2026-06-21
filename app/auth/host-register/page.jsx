'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import GoogleButton from '@/components/GoogleButton'

export default function HostRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    username: '',
    department: '',
    year_of_study: '',
    organization: '',
    host_type: 'student'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            username: formData.username,
            department: formData.department || null,
            year_of_study: parseInt(formData.year_of_study) || null,
            user_type: 'host',
            organization: formData.organization || null,
            host_type: formData.host_type,
            is_host_verified: true
          }
        }
      })

      if (signUpError) throw signUpError

      // Update users table directly (backup if trigger fails)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          user_type: 'host',
          host_type: formData.host_type,
          organization: formData.organization || null,
          is_host_verified: true
        })
        .eq('id', data.user.id)

      if (updateError) {
        console.warn('⚠️ Could not update user profile:', updateError)
      }

      setSuccess(true)
      alert('✅ Host registration successful! You can now create events.')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      console.error('❌ Host registration error:', err)
      
      if (err.message.includes('User already registered')) {
        setError('This email is already registered. Please login instead.')
      } else if (err.message.includes('Password should be at least 6 characters')) {
        setError('Password must be at least 6 characters long.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
        <div className="form-container" style={{ margin: '0', width: '100%', maxWidth: '560px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
              <i className="fas fa-user-tie" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
              Register as Host
            </h1>
            <p style={{ color: 'var(--gray-text)', marginTop: '6px' }}>
              Create and manage events for your college community
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

          {success && (
            <div style={{ 
              backgroundColor: '#d1fae5', 
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '0.92rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-check-circle"></i> Host registration successful! Redirecting to dashboard...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Full Name *</label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                disabled={loading || success}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Username *</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g., johndoe"
                disabled={loading || success}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., john.doe@xie.edu.in"
                disabled={loading || success}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                required
                minLength="6"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                disabled={loading || success}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Computer Science"
                disabled={loading || success}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Year of Study</label>
              <input
                type="number"
                name="year_of_study"
                value={formData.year_of_study}
                onChange={handleChange}
                placeholder="1"
                min="1"
                max="5"
                disabled={loading || success}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Host Type *</label>
              <select
                name="host_type"
                value={formData.host_type}
                onChange={handleChange}
                disabled={loading || success}
              >
                <option value="student">Individual Student</option>
                <option value="club">Student Club/Organization</option>
                <option value="department">Department</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>Organization/Club Name</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g., Tech Club, Cultural Committee"
                disabled={loading || success}
              />
            </div>

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading || success}
              style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Host Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-tie"></i> Register as Host
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            margin: '24px 0',
            color: '#94a3b8'
          }}>
            <hr style={{ flex: '1', border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <span style={{ fontSize: '0.85rem' }}>OR</span>
            <hr style={{ flex: '1', border: 'none', borderTop: '1px solid #e2e8f0' }} />
          </div>

          {/* GOOGLE BUTTON */}
          <GoogleButton redirectTo="/events" />

          <div 
            style={{ 
              marginTop: '24px', 
              paddingTop: '20px', 
              borderTop: '1px solid rgba(0,0,0,0.06)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.92rem'
            }}
          >
            <span style={{ color: 'var(--gray-text)' }}>
              Want to join as a user?{' '}
              <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                User Registration
              </Link>
            </span>
            <span style={{ color: 'var(--gray-text)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Login
              </Link>
            </span>
          </div>
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
                <i className="fas fa-phone-alt" style={{ color: 'var(--primary-light)', marginRight: '8px' }}></i> 
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