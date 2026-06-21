'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface User {
  id: string
  full_name: string
  username: string
  email: string
  avatar_url?: string
  user_type?: string
}

interface ProfileSidebarProps {
  user: User
}

export default function ProfileSidebar({ user }: ProfileSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/profile', label: '👤 My Profile', icon: 'fas fa-user' },
    { href: '/my-events', label: '📅 My Events', icon: 'fas fa-calendar-check' },
    ...(user.user_type === 'host' ? [
      { href: '/hosted-events', label: '🎤 Hosted Events', icon: 'fas fa-microphone' },
      { href: '/events/create', label: '➕ Create Event', icon: 'fas fa-plus-circle' },
    ] : []),
    { href: '/settings', label: '⚙️ Settings', icon: 'fas fa-cog' },
  ]

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--border-color)',
      height: 'fit-content',
      position: 'sticky',
      top: '120px',
      color: 'var(--text-color)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
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
            <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user.full_name?.charAt(0) || 'U'
          )}
        </div>
        <h3 style={{ fontWeight: 'bold' }}>{user.full_name}</h3>
        <p style={{ color: 'var(--gray-text)', fontSize: '0.85rem' }}>
          @{user.username}
        </p>
        <span style={{
          display: 'inline-block',
          backgroundColor: user.user_type === 'host' ? 'var(--primary)' : '#3b82f6',
          color: 'white',
          padding: '2px 12px',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: '600',
          marginTop: '4px'
        }}>
          {user.user_type === 'host' ? '🎤 Host' : '👤 User'}
        </span>
      </div>

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
                backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-color)',
                fontWeight: isActive ? '600' : '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={item.icon} style={{ width: '20px' }}></i>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}