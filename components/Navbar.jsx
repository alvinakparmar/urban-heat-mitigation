'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      try {
        console.log('🔍 Getting user...')
        
        // ✅ Check for existing session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('👤 Session found for:', session.user.email)
          setUser(session.user)
          setLoading(false)
          return
        }
        
        // ✅ Only call getUser if we have a session
        // If no session, just set user to null
        console.log('👤 No session found, user is not logged in')
        setUser(null)
        
      } catch (err) {
        console.error('❌ Error getting user:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    getUser()

    // ✅ Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed - Event:', event)
      console.log('🔄 Session user:', session?.user?.email)
      
      if (session?.user) {
        setUser(session.user)
        setLoading(false)
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.refresh()
      }
    })

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  const isLandingPage = pathname === '/'

  // ✅ Show loading state
  if (loading) {
    return (
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link href="/" className="logo" onClick={closeMenu}>
          XIE<span>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <button className="hamburger" onClick={toggleMenu}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </nav>
    )
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link href="/" className="logo" onClick={closeMenu}>
        XIE<span>.</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ThemeToggle />
        <button 
          className="hamburger" 
          onClick={toggleMenu} 
          aria-label="Toggle Navigation Menu"
          aria-expanded={menuOpen}
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <li>
          <Link href={isLandingPage ? '#home' : '/#home'} onClick={closeMenu}>
            Home
          </Link>
        </li>
        <li>
          <Link href={isLandingPage ? '#events' : '/#events'} onClick={closeMenu}>
            Events
          </Link>
        </li>
        <li>
          <Link href="/events" onClick={closeMenu}>
            All Events
          </Link>
        </li>
        <li>
          <Link href={isLandingPage ? '#about' : '/#about'} onClick={closeMenu}>
            About
          </Link>
        </li>
        <li>
          <Link href={isLandingPage ? '#contact' : '/#contact'} onClick={closeMenu}>
            Contact
          </Link>
        </li>

        {user && (
          <>
            <li>
              <Link href="/profile" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-user-circle"></i> Profile
              </Link>
            </li>
            <li>
              <Link href="/my-events" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-calendar-check"></i> My Events
              </Link>
            </li>
          </>
        )}

        <li className="nav-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
          {user ? (
            <>
              <Link href="/events/create" className="btn-secondary" onClick={closeMenu} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                <i className="fas fa-plus-circle" style={{ marginRight: '6px' }}></i>Host Event
              </Link>

              <button 
                onClick={() => { handleLogout(); closeMenu(); }}
                className="btn-outline"
                style={{ padding: '8px 20px', fontSize: '0.85rem', background: 'none', border: '2px solid var(--primary)', borderRadius: '50px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
              >
                <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }}></i>Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-outline" onClick={closeMenu} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                Login
              </Link>
              <Link href="/auth/register" className="btn-secondary" onClick={closeMenu} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                Register
              </Link>
            </>
          )}
        </li>
      </ul>
    </nav>
  )
}