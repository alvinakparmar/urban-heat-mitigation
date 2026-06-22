'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProfileSidebar from '@/components/ProfileSidebar'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    department: '',
    year_of_study: '',
    bio: '',
    phone: ''
  })

  useEffect(() => {
    async function loadSettings() {
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
        setFormData({
          full_name: userData.full_name || '',
          username: userData.username || '',
          email: authUser.email || '',
          department: userData.department || '',
          year_of_study: userData.year_of_study?.toString() || '',
          bio: userData.bio || '',
          phone: userData.phone || ''
        })
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // Check if username is already taken
      if (formData.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', formData.username)
          .neq('id', user?.id)
          .maybeSingle()

        if (existingUser) {
          setMessage('❌ Username "' + formData.username + '" is already taken. Please choose another.')
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          department: formData.department,
          year_of_study: parseInt(formData.year_of_study) || null,
          bio: formData.bio,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) {
        if (error.code === '23505') {
          setMessage('❌ Username "' + formData.username + '" is already taken. Please choose another.')
        } else {
          throw error
        }
        setSaving(false)
        return
      }

      setMessage('✅ Settings saved successfully!')
      setUser({ ...user, ...formData })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('❌ Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px' }}>
          <p style={{ color: 'var(--text-color)' }}>Loading...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container" style={{ padding: '140px 24px 80px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '32px', color: 'var(--text-color)' }}>
          Settings
        </h1>

        <div className="profile-layout-grid">
          <ProfileSidebar user={user} />

          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-color)' }}>
              Account Settings
            </h2>
            <p style={{ color: 'var(--gray-text)', marginBottom: '24px' }}>
              Update your profile information and preferences
            </p>

            {message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
                color: message.includes('✅') ? '#065f46' : '#dc2626'
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="profile-info-grid">
                <div className="form-group">
                  <label style={{ color: 'var(--text-color)' }}>Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-color)' }}>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-color)' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--gray-text)',
                      border: '1px solid var(--border-color)',
                      cursor: 'not-allowed'
                    }}
                  />
                  <small style={{ color: 'var(--gray-text)' }}>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-color)' }}>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics &amp; Telecom">Electronics &amp; Telecom</option>
                    <option value="General Science">General Science</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-color)' }}>Year of Study</label>
                  <select
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleChange}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year (FE)</option>
                    <option value="2">2nd Year (SE)</option>
                    <option value="3">3rd Year (TE)</option>
                    <option value="4">4th Year (BE)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-color)' }}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ color: 'var(--text-color)' }}>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 32px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-layout-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 32px;
        }

        .profile-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-color);
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          background-color: var(--input-bg);
          color: var(--text-color);
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: var(--gray-text);
          opacity: 0.7;
        }

        @media (max-width: 1024px) {
          .profile-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .profile-info-grid {
            grid-template-columns: 1fr;
          }
          
          .profile-layout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}