'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProfileSidebar from '@/components/ProfileSidebar'

interface User {
  id: string
  full_name: string
  username: string
  email: string
  department: string
  year_of_study: number
  user_type: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    department: '',
    year_of_study: '',
    bio: '',
    phone: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push('/auth/login')
          return
        }

        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) throw profileError

        setUser(userData)
        setFormData({
          full_name: userData.full_name || '',
          username: userData.username || '',
          department: userData.department || '',
          year_of_study: userData.year_of_study?.toString() || '',
          bio: userData.bio || '',
          phone: userData.phone || ''
        })
      } catch (error) {
        console.error('Error loading profile:', error)
        setMessage('❌ Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const userId = user?.id
      if (!userId) {
        throw new Error('User ID not found')
      }

      // ✅ Check if username is already taken by another user
      if (formData.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', formData.username)
          .neq('id', userId)
          .maybeSingle()

        if (existingUser) {
          setMessage('❌ Username "' + formData.username + '" is already taken. Please choose another.')
          setSaving(false)
          return
        }
      }

      const updateData = {
        full_name: formData.full_name,
        username: formData.username,
        department: formData.department || null,
        year_of_study: parseInt(formData.year_of_study) || null,
        bio: formData.bio || null,
        phone: formData.phone || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        // ✅ Handle duplicate key error
        if (error.code === '23505') {
          setMessage('❌ Username "' + formData.username + '" is already taken. Please choose another.')
        } else {
          throw new Error(error.message)
        }
        setSaving(false)
        return
      }

      setMessage('✅ Profile updated successfully!')
      setEditing(false)
      
      // Refresh user data
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      setUser(updatedUser)
      setFormData({
        full_name: updatedUser.full_name || '',
        username: updatedUser.username || '',
        department: updatedUser.department || '',
        year_of_study: updatedUser.year_of_study?.toString() || '',
        bio: updatedUser.bio || '',
        phone: updatedUser.phone || ''
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage('❌ Failed to update profile: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px' }}>
          Loading...
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px' }}>
          <p>User not found</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="container" style={{ padding: '140px 24px 80px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '32px', color: 'var(--text-color)' }}>
          My Profile
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
          <ProfileSidebar user={user} />

          <div>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Profile Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

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

              {editing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Year of Study</label>
                      <input
                        type="number"
                        name="year_of_study"
                        value={formData.year_of_study}
                        onChange={handleChange}
                        min="1"
                        max="5"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          full_name: user.full_name || '',
                          username: user.username || '',
                          department: user.department || '',
                          year_of_study: user.year_of_study?.toString() || '',
                          bio: user.bio || '',
                          phone: user.phone || ''
                        })
                        setMessage('')
                      }}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: 'var(--border-color)',
                        color: 'var(--text-color)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Full Name</label>
                    <p style={{ fontWeight: '600' }}>{user.full_name}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Username</label>
                    <p style={{ fontWeight: '600' }}>@{user.username}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Email</label>
                    <p style={{ fontWeight: '600' }}>{user.email}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Department</label>
                    <p style={{ fontWeight: '600' }}>{user.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Year of Study</label>
                    <p style={{ fontWeight: '600' }}>{user.year_of_study || 'Not specified'}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Phone</label>
                    <p style={{ fontWeight: '600' }}>{user.phone || 'Not specified'}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Bio</label>
                    <p style={{ fontWeight: '600' }}>{user.bio || 'No bio yet'}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Member Since</label>
                    <p style={{ fontWeight: '600' }}>{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}