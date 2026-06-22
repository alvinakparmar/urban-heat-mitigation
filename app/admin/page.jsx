'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    messages: 0
  })
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [messages, setMessages] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showLogin, setShowLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')

  // ✅ Check admin login
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn')
    if (adminLoggedIn === 'true') {
      setIsAdmin(true)
      setShowLogin(false)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

  // ✅ Handle admin login
  const handleLogin = (e) => {
    e.preventDefault()
    if (username === 'admin' && password === 'alvinaistheadmin') {
      localStorage.setItem('adminLoggedIn', 'true')
      setIsAdmin(true)
      setShowLogin(false)
      setLoginError('')
      fetchData()
    } else {
      setLoginError('❌ Invalid username or password')
    }
  }

  // ✅ Fetch all data with admin API key
  const fetchData = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('📊 Fetching admin data...')

      // ✅ Get users - try different approaches
      let usersData = []
      let usersError = null
      let usersCount = 0

      // Approach 1: Simple select
      const result = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (result.error) {
        console.error('❌ Error fetching users:', result.error)
        usersError = result.error
        setError(`Error: ${result.error.message}`)
      } else {
        usersData = result.data || []
        usersCount = result.count || 0
        console.log(`✅ Found ${usersData.length} users`)
        console.log('📋 Users:', usersData)
      }

      setUsers(usersData)
      setStats(prev => ({ ...prev, users: usersCount }))

      // Get events
      const { data: eventsData, error: eventsError, count: eventsCount } = await supabase
        .from('events')
        .select(`
          *,
          users (full_name, username)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (!eventsError) {
        setEvents(eventsData || [])
        setStats(prev => ({ ...prev, events: eventsCount || 0 }))
      }

      // Get messages
      const { data: messagesData, error: messagesError, count: messagesCount } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (!messagesError) {
        setMessages(messagesData || [])
        setStats(prev => ({ ...prev, messages: messagesCount || 0 }))
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('⚠️ Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(users.filter(u => u.id !== userId))
      setStats({ ...stats, users: stats.users - 1 })
      alert('✅ User deleted successfully!')

    } catch (error) {
      console.error('Error deleting user:', error)
      alert('❌ Failed to delete user')
    }
  }

  // ✅ Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('⚠️ Are you sure you want to delete this event?')) return

    try {
      await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      setEvents(events.filter(e => e.id !== eventId))
      setStats({ ...stats, events: stats.events - 1 })
      alert('✅ Event deleted successfully!')

    } catch (error) {
      console.error('Error deleting event:', error)
      alert('❌ Failed to delete event')
    }
  }

  // ✅ Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.filter(m => m.id !== messageId))
      setStats({ ...stats, messages: stats.messages - 1 })
      alert('✅ Message deleted successfully!')

    } catch (error) {
      console.error('Error deleting message:', error)
      alert('❌ Failed to delete message')
    }
  }

  // ✅ Mark message as read
  const handleMarkRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ))

    } catch (error) {
      console.error('Error marking message:', error)
    }
  }

  // ✅ Admin logout
  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn')
    setIsAdmin(false)
    setShowLogin(true)
    router.push('/')
  }

  // ✅ Filtered lists
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEvents = events.filter(e =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMessages = messages.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ✅ Render login screen
  if (showLogin) {
    return (
      <>
        <Navbar />
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-color)',
          paddingTop: '160px',
          paddingBottom: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow)',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔐</div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>Admin Login</h1>
              <p style={{ color: 'var(--gray-text)', fontSize: '0.9rem' }}>Enter your admin credentials</p>
            </div>

            {loginError && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.9rem'
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-color)', fontWeight: '600' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ color: 'var(--text-color)', fontWeight: '600' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </>
    )
  }

  // ✅ Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '140px 24px 80px', textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTop: '4px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'var(--text-color)' }}>Loading admin dashboard...</p>
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

  // ✅ Admin Dashboard
  return (
    <>
      <Navbar />

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-color)',
        paddingTop: '140px',
        paddingBottom: '80px'
      }}>
        <div className="container" style={{ maxWidth: '1200px' }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>⚙️ Admin Dashboard</h1>
              <p style={{ color: 'var(--gray-text)' }}>Manage users, events, and messages</p>
              {error && (
                <p style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '4px' }}>
                  ⚠️ {error}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={fetchData}
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
                🔄 Refresh
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem' }}>👥</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{stats.users}</div>
              <div style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Total Users</div>
            </div>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem' }}>📅</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{stats.events}</div>
              <div style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Total Events</div>
            </div>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem' }}>📨</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{stats.messages}</div>
              <div style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>Total Messages</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="🔍 Search users, events, or messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
                outline: 'none'
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--border-color)',
                color: activeTab === 'dashboard' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'users' ? 'var(--primary)' : 'var(--border-color)',
                color: activeTab === 'users' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              👥 Users ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'events' ? 'var(--primary)' : 'var(--border-color)',
                color: activeTab === 'events' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📅 Events ({filteredEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: activeTab === 'messages' ? 'var(--primary)' : 'var(--border-color)',
                color: activeTab === 'messages' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📨 Messages ({filteredMessages.length})
            </button>
          </div>

          {/* ============================================ */}
          {/* TAB: DASHBOARD */}
          {/* ============================================ */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{
                backgroundColor: 'var(--card-bg)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <h2 style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '16px' }}>📊 Quick Overview</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {stats.users}
                    </div>
                    <div style={{ color: 'var(--gray-text)' }}>Total Users</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {stats.events}
                    </div>
                    <div style={{ color: 'var(--gray-text)' }}>Total Events</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {stats.messages}
                    </div>
                    <div style={{ color: 'var(--gray-text)' }}>Messages</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: USERS */}
          {/* ============================================ */}
          {activeTab === 'users' && (
            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-color)', fontSize: '1.1rem', marginBottom: '8px' }}>
                    👥 No users found
                  </p>
                  <p style={{ color: 'var(--gray-text)', fontSize: '0.9rem' }}>
                    {error || 'Try refreshing the page or check RLS policies.'}
                  </p>
                  <button
                    onClick={fetchData}
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
                    🔄 Refresh Data
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                    <thead style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>#</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Username</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Type</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Joined</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-color)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-text)' }}>{index + 1}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-color)', fontWeight: '500' }}>
                            {user.full_name || 'Unknown'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-color)' }}>
                            @{user.username || 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: user.user_type === 'host' ? '#d1fae5' : '#dbeafe',
                              color: user.user_type === 'host' ? '#065f46' : '#1e40af'
                            }}>
                              {user.user_type || 'user'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-text)', fontSize: '0.85rem' }}>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
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
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: EVENTS */}
          {/* ============================================ */}
          {activeTab === 'events' && (
            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-text)' }}>
                  No events found
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Event</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Category</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Host</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-color)' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-color)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div>
                              <strong style={{ color: 'var(--text-color)' }}>{event.title}</strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)' }}>
                                {new Date(event.start_date).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: '#e8f5e9',
                              color: '#2E7D32'
                            }}>
                              {event.category || 'General'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-color)' }}>
                            {event.users?.full_name || 'Unknown'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: event.status === 'cancelled' ? '#fee2e2' :
                                             event.status === 'completed' ? '#d1fae5' :
                                             event.status === 'ongoing' ? '#fef3c7' : '#dbeafe',
                              color: event.status === 'cancelled' ? '#dc2626' :
                                     event.status === 'completed' ? '#065f46' :
                                     event.status === 'ongoing' ? '#92400e' : '#1e40af'
                            }}>
                              {event.status || 'Upcoming'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
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
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: MESSAGES */}
          {/* ============================================ */}
          {activeTab === 'messages' && (
            <div style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              {filteredMessages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-text)' }}>
                  No messages found
                </div>
              ) : (
                <div>
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: message.is_read ? 'var(--card-bg)' : 'var(--bg-color)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <strong style={{ color: 'var(--text-color)' }}>{message.name}</strong>
                            <span style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>{message.email}</span>
                            {!message.is_read && (
                              <span style={{
                                backgroundColor: '#dc2626',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.65rem',
                                fontWeight: '600'
                              }}>
                                NEW
                              </span>
                            )}
                            <span style={{ color: 'var(--gray-text)', fontSize: '0.75rem' }}>
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ marginTop: '8px', color: 'var(--text-color)' }}>{message.message}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          {!message.is_read && (
                            <button
                              onClick={() => handleMarkRead(message.id)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}