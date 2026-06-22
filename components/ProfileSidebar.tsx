'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface User {
  id: string
  full_name: string
  username: string
  avatar_url?: string
  user_type?: string
}

interface ProfileSidebarProps {
  user: User | null
}

export default function ProfileSidebar({ user }: ProfileSidebarProps) {
  const pathname = usePathname()

  // Add null check
  if (!user) {
    return (
      <div className="profile-sidebar" style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)',
        height: 'fit-content',
        color: 'var(--text-color)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: 'var(--gray-text)',
          margin: '0 auto 12px'
        }}>
          ?
        </div>
        <h3 style={{ fontWeight: 'bold' }}>Loading Profile...</h3>
        <p style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>
          Please wait
        </p>
      </div>
    )
  }

  // Navigation items
  const navItems = [
    { href: '/profile', label: '👤 My Profile' },
    { href: '/my-events', label: '📅 My Events' },
    ...(user.user_type === 'host' ? [
      { href: '/hosted-events', label: '🎤 Hosted Events' },
      { href: '/events/create', label: '➕ Create Event' },
    ] : []),
    { href: '/settings', label: '⚙️ Settings' },
  ]

  return (
    <>
      <div className="profile-sidebar" style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)',
        height: 'fit-content',
        color: 'var(--text-color)'
      }}>
      {/* User Info Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '24px', 
        paddingBottom: '24px', 
        borderBottom: '1px solid var(--border-color)' 
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: 'white',
          margin: '0 auto 12px',
          overflow: 'hidden'
        }}>
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            user.full_name?.charAt(0) || 'U'
          )}
        </div>

        {/* User Name */}
        <h3 style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {user.full_name || 'User'}
        </h3>

        {/* Username */}
        <p style={{ color: 'var(--gray-text)', fontSize: '0.85rem', marginBottom: '8px' }}>
          @{user.username || 'username'}
        </p>

        {/* User Type Badge */}
        <span style={{
          display: 'inline-block',
          backgroundColor: user.user_type === 'host' ? 'var(--primary)' : '#3b82f6',
          color: 'white',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          {user.user_type === 'host' ? '🎤 Host' : '👤 User'}
        </span>
      </div>

      {/* Navigation Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-color)',
                fontWeight: isActive ? '600' : '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ width: '24px', fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      </div>
      <style jsx>{`
        .profile-sidebar {
          position: sticky;
          top: 120px;
          z-index: 10;
        }
        @media (max-width: 1024px) {
          .profile-sidebar {
            position: static;
          }
        }
      `}</style>
    </>
  )
}