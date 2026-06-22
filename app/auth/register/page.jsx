'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import GoogleButton from '@/components/GoogleButton'

export default function RegisterPage() {
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
    year_of_study: ''
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
            user_type: 'user'
          }
        }
      })

      if (signUpError) throw signUpError

      console.log('✅ User created:', data.user.id)

      // ✅ MANUAL FALLBACK: Create profile in public.users
      // This ensures profile exists even if trigger fails
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            full_name: formData.full_name,
            username: formData.username,
            department: formData.department || null,
            year_of_study: parseInt(formData.year_of_study) || null,
            user_type: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.error('⚠️ Manual profile creation failed:', insertError)
        } else {
          console.log('✅ Profile created manually in users table')
        }
      }

      setSuccess(true)
      alert('✅ Registration successful! You can now login.')
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (err) {
      console.error('❌ Registration error:', err)
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
          background: 'var(--bg-color)',
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
              <i className="fas fa-user-plus" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
              Create Account
            </h1>
            <p style={{ color: 'var(--gray-text)', marginTop: '6px' }}>
              Join our XIE college event community
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
              <i className="fas fa-check-circle"></i> Registration successful! Redirecting to login...
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

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading || success}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics &amp; Telecom">Electronics &amp; Telecom</option>
                  <option value="General Science">General Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Year of Study</label>
                <select
                  name="year_of_study"
                  value={formData.year_of_study}
                  onChange={handleChange}
                  disabled={loading || success}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year (FE)</option>
                  <option value="2">2nd Year (SE)</option>
                  <option value="3">3rd Year (TE)</option>
                  <option value="4">4th Year (BE)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading || success}
              style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Sign Up
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
            color: 'var(--gray-text)'
          }}>
            <hr style={{ flex: '1', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <span style={{ fontSize: '0.85rem' }}>OR</span>
            <hr style={{ flex: '1', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          </div>

          {/* GOOGLE BUTTON */}
          <GoogleButton redirectTo="/events" />

          <div 
            style={{ 
              marginTop: '24px', 
              paddingTop: '20px', 
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.92rem'
            }}
          >
            <span style={{ color: 'var(--gray-text)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Login
              </Link>
            </span>
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