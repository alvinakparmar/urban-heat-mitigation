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
  const [creatingProfile, setCreatingProfile] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        setMessage('')

        // Step 1: Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          console.error('Auth error:', authError)
          router.push('/auth/login')
          return
        }

        console.log('✅ Session found for:', authUser.email)
        console.log('🆔 User ID:', authUser.id)

        // Step 2: Try to get profile from users table
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)

        if (profileError) {
          console.error('❌ Error checking profile:', profileError)
          setMessage('❌ Error checking profile: ' + JSON.stringify(profileError))
          setLoading(false)
          return
        }

        // Step 3: If no user found, create one
        if (!userData || userData.length === 0) {
          console.log('ℹ️ No profile found, creating one...')
          setCreatingProfile(true)
          setMessage('⏳ Creating your profile...')

          // Generate base username
          let baseUsername = authUser.email?.split('@')[0] || `user_${Date.now()}`
          let finalUsername = baseUsername
          let counter = 0

          // Check if username exists and add number if needed
          while (true) {
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('username', finalUsername)
              .maybeSingle()

            if (!existingUser) break
            counter++
            finalUsername = `${baseUsername}${counter}`
          }

          // Create new user profile WITHOUT email
          const newUser = {
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || 
                      authUser.email?.split('@')[0] || 
                      'User',
            username: finalUsername,
            user_type: 'student',
            department: '',
            year_of_study: null,
            bio: null,
            phone: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log('📝 Creating user with data:', JSON.stringify(newUser, null, 2))

          const { data: createdUser, error: insertError } = await supabase
            .from('users')
            .insert(newUser)
            .select()

          if (insertError) {
            console.error('❌ Error creating profile:', JSON.stringify(insertError, null, 2))
            console.error('❌ Error code:', insertError.code)
            console.error('❌ Error message:', insertError.message)
            
            // Check specific error types
            if (insertError.code === '23505') {
              // Try with alternative username
              const altUsername = `${finalUsername}_${Date.now().toString().slice(-4)}`
              console.log('🔄 Username taken, trying:', altUsername)
              
              const { data: retryUser, error: retryError } = await supabase
                .from('users')
                .insert([{ ...newUser, username: altUsername }])
                .select()

              if (retryError || !retryUser || retryUser.length === 0) {
                setMessage('❌ Failed to create profile. Please try again.')
                setCreatingProfile(false)
                setLoading(false)
                return
              }

              console.log('✅ Profile created with alternative username:', retryUser[0])
              setUser(retryUser[0])
              setFormData({
                full_name: retryUser[0].full_name || '',
                username: retryUser[0].username || '',
                department: retryUser[0].department || '',
                year_of_study: retryUser[0].year_of_study?.toString() || '',
                bio: retryUser[0].bio || '',
                phone: retryUser[0].phone || ''
              })
            } else if (insertError.code === '42501' || insertError.message?.includes('permission')) {
              setMessage('❌ Permission denied. Please check RLS policies.')
            } else if (insertError.message?.includes('violates row-level security')) {
              setMessage('❌ RLS policy violation. Please contact support.')
            } else {
              setMessage('❌ Failed to create profile: ' + (insertError.message || 'Unknown error'))
            }
            
            setCreatingProfile(false)
            setLoading(false)
            return
          }

          if (!createdUser || createdUser.length === 0) {
            console.error('❌ No user data returned after insert')
            setMessage('❌ Failed to create profile - no data returned')
            setCreatingProfile(false)
            setLoading(false)
            return
          }

          console.log('✅ Profile created successfully:', createdUser[0])
          setUser(createdUser[0])
          setFormData({
            full_name: createdUser[0].full_name || '',
            username: createdUser[0].username || '',
            department: createdUser[0].department || '',
            year_of_study: createdUser[0].year_of_study?.toString() || '',
            bio: createdUser[0].bio || '',
            phone: createdUser[0].phone || ''
          })
          setCreatingProfile(false)
          setMessage('✅ Profile created successfully! You can now edit your details.')
          
          setTimeout(() => setMessage(''), 5000)
        } else {
          // User exists - use the first record
          console.log('✅ Profile found:', userData[0])
          setUser(userData[0])
          setFormData({
            full_name: userData[0].full_name || '',
            username: userData[0].username || '',
            department: userData[0].department || '',
            year_of_study: userData[0].year_of_study?.toString() || '',
            bio: userData[0].bio || '',
            phone: userData[0].phone || ''
          })
        }

      } catch (error: any) {
        console.error('❌ Unexpected error:', error)
        console.error('❌ Error stack:', error?.stack)
        setMessage('❌ An unexpected error occurred: ' + (error?.message || 'Unknown error'))
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

      // Check if username is already taken by another user
      if (formData.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', formData.username.trim())
          .neq('id', userId)
          .maybeSingle()

        if (checkError) {
          console.error('Username check error:', checkError)
        }

        if (existingUser) {
          setMessage('❌ Username "' + formData.username + '" is already taken. Please choose another.')
          setSaving(false)
          return
        }
      }

      // Prepare update data
      const updateData = {
        full_name: formData.full_name?.trim() || null,
        username: formData.username?.trim() || null,
        department: formData.department?.trim() || null,
        year_of_study: parseInt(formData.year_of_study) || null,
        bio: formData.bio?.trim() || null,
        phone: formData.phone?.trim() || null,
        updated_at: new Date().toISOString()
      }

      console.log('📝 Updating profile with:', updateData)

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('❌ Update error:', error)
        
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
      const { data: updatedUser, error: refreshError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)

      if (refreshError) {
        console.error('Error refreshing user data:', refreshError)
      } else if (updatedUser && updatedUser.length > 0) {
        setUser(updatedUser[0])
        setFormData({
          full_name: updatedUser[0].full_name || '',
          username: updatedUser[0].username || '',
          department: updatedUser[0].department || '',
          year_of_study: updatedUser[0].year_of_study?.toString() || '',
          bio: updatedUser[0].bio || '',
          phone: updatedUser[0].phone || ''
        })
      }

      setTimeout(() => setMessage(''), 5000)

    } catch (error: any) {
      console.error('❌ Error updating profile:', error)
      setMessage('❌ Failed to update profile: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '300px',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {creatingProfile ? (
              <>
                <div className="spinner" style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid var(--border-color)',
                  borderTop: '4px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: 'var(--text-color)' }}>Creating your profile...</p>
              </>
            ) : (
              <>
                <div className="spinner" style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid var(--border-color)',
                  borderTop: '4px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: 'var(--text-color)' }}>Loading profile...</p>
              </>
            )}
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  // User not found
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '140px 24px 80px' }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <p style={{ color: 'var(--text-color)', fontSize: '1.1rem' }}>
              {message || 'Profile not found. Please try again.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '10px 24px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Retry
            </button>
          </div>
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

        <div className="profile-layout-grid">
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
                      fontWeight: '600',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
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
                  backgroundColor: message.includes('✅') ? '#d1fae5' : 
                                 message.includes('⏳') ? '#fef3c7' : '#fee2e2',
                  color: message.includes('✅') ? '#065f46' : 
                         message.includes('⏳') ? '#92400e' : '#dc2626',
                  border: '1px solid ' + (message.includes('✅') ? '#a7f3d0' : 
                                         message.includes('⏳') ? '#fcd34d' : '#fca5a5')
                }}>
                  {message}
                </div>
              )}

              {editing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="profile-info-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Username *</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="Choose a unique username"
                      />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science"
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
                        placeholder="1-5"
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
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: saving ? 0.6 : 1,
                        transition: 'opacity 0.2s'
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
                <div className="profile-info-grid">
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Full Name</label>
                    <p style={{ fontWeight: '600' }}>{user.full_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Username</label>
                    <p style={{ fontWeight: '600' }}>@{user.username || 'Not set'}</p>
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
                    <p style={{ fontWeight: '600' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Not available'}
                    </p>
                  </div>
                </div>
              )}
            </div>
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
        .form-group textarea {
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
        .form-group textarea:focus {
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