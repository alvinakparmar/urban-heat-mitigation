'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface FormData {
  name: string
  email: string
  message: string
}

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  })
  const [sending, setSending] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)

  useEffect(() => {
    // Back to top button visibility
    const backTop = document.getElementById('back-top')
    const handleScrollVisibility = () => {
      if (window.scrollY > 400) {
        backTop?.classList.add('visible')
      } else {
        backTop?.classList.remove('visible')
      }
    }
    window.addEventListener('scroll', handleScrollVisibility)

    // Back to top click handler
    const scrollUp = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    backTop?.addEventListener('click', scrollUp)

    // Scroll progress bar
    const progressBar = document.getElementById('progress-bar')
    const handleProgressBar = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      if (progressBar) progressBar.style.width = progress + '%'
    }
    window.addEventListener('scroll', handleProgressBar)

    // Scroll reveal intersection observer
    const revealElements = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )
    revealElements.forEach((el) => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', handleScrollVisibility)
      backTop?.removeEventListener('click', scrollUp)
      window.removeEventListener('scroll', handleProgressBar)
      revealElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSubmitted(false)

    try {
      // Send message to Supabase
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', message: '' })
        alert(`🎉 Thank you ${formData.name}! Your message has been sent successfully.`)
      } else {
        alert(`❌ Failed to send message: ${result.error || 'Please try again.'}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('❌ Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <div id="progress-bar"></div>

      {/* Shared Sticky Navbar */}
      <Navbar />

      {/* Section 1: Hero Section */}
      <section 
        className="hero" 
        id="home"
        style={{
          color: '#ffffff',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)'
        }}
      >
        <div className="floating-shapes">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="hero-content">
          <h1 style={{ color: '#ffffff' }}>
            Xavier Institute of Engineering<br />
            <span className="highlight" style={{ color: '#f5e56b' }}>Evento: Registration Portal</span>
          </h1>
          <p style={{ color: '#ffffff', opacity: '0.95' }}>
            Discover, Register and Participate in Exciting Campus Events
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/events" className="btn-primary">
              <i className="fas fa-calendar-plus" style={{ fontSize: '1.1rem' }}></i> Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Events Section */}
      <section className="events-section section-padding" id="events">
        <div className="container">
          <div className="section-title-wrap reveal">
            <h2 className="section-title">Major Events at Xavier Institute of Engineering</h2>
            <p className="section-sub">
              Explore our flagship events that bring together innovation, culture, and learning.
            </p>
          </div>

          <div className="events-grid">
            {/* Event 1 - UNDER 25 SUMMIT */}
            <div className="glass-card event-card reveal">
              <div className="card-img-wrap">
                <div className="card-img" style={{ background: 'linear-gradient(135deg, #2E7D32, #81C784)' }}>
                  <i className="fas fa-crown"></i>
                </div>
              </div>
              <div className="highlight-tags">
                <span className="highlight-tag">Summit</span>
                <span className="highlight-tag" style={{ background: 'rgba(255,241,118,0.25)', color: '#f57f17' }}>
                  🌟 Featured
                </span>
              </div>
              <h3>UNDER 25 SUMMIT</h3>
              <p className="description">
                The Under 25 Summit brought together students, creators, innovators and leaders for a day filled with learning, networking and inspiration.
              </p>
              <div className="highlight-tags" style={{ marginBottom: '10px' }}>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Bhumi Pednekar Guest
                </span>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Interactive
                </span>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Workshops
                </span>
              </div>
              <Link href="/events" className="view-link" style={{ marginTop: 'auto' }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            {/* Event 2 - TRANSMISSION */}
            <div className="glass-card event-card reveal">
              <div className="card-img-wrap">
                <div className="card-img" style={{ background: 'linear-gradient(135deg, #1e3c72, #2a5298)' }}>
                  <i className="fas fa-microchip"></i>
                </div>
              </div>
              <div className="highlight-tags">
                <span className="highlight-tag">Technical</span>
                <span className="highlight-tag" style={{ background: 'rgba(129,199,132,0.25)', color: 'var(--primary-dark)' }}>
                  💻 Coding
                </span>
              </div>
              <h3>TRANSMISSION</h3>
              <p className="description">
                XIE's annual technical fest featuring coding competitions, robotics showcases, hackathons, and innovative project exhibitions that push the boundaries of engineering and technology.
              </p>
              <div className="highlight-tags" style={{ marginBottom: '10px' }}>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Robotics
                </span>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Hackathons
                </span>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Project Showcase
                </span>
              </div>
              <Link href="/events" className="view-link" style={{ marginTop: 'auto' }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            {/* Event 3 - SPANDAN */}
            <div className="glass-card event-card reveal">
              <div className="card-img-wrap">
                <div className="card-img" style={{ background: 'linear-gradient(135deg, #e65c00, #F9D423)' }}>
                  <i className="fas fa-masks-theater"></i>
                </div>
              </div>
              <div className="highlight-tags">
                <span className="highlight-tag">Cultural</span>
                <span className="highlight-tag" style={{ background: 'rgba(244,87,166,0.25)', color: '#c2185b' }}>
                  🎵 Arts
                </span>
              </div>
              <h3>SPANDAN</h3>
              <p className="description">
                XIE's premier cultural extravaganza featuring music, dance, fashion, theater, and creative performances that showcase the vibrant student talent and diversity.
              </p>
              <div className="highlight-tags" style={{ marginBottom: '10px' }}>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Dance & Music
                </span>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Fashion Show
                </span>
                <span className="highlight-tag" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--dark)' }}>
                  Theater
                </span>
              </div>
              <Link href="/events" className="view-link" style={{ marginTop: 'auto' }}>
                Learn More <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: About Section */}
      <section className="about-section section-padding" id="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-wrap reveal">
              <Image 
                src="/images/2.jpg" 
                alt="Xavier Institute of Engineering College Campus" 
                width={600}
                height={400}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </div>
            <div className="about-text reveal">
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '24px' }}>
                About Xavier Institute of Engineering
              </h2>
              <p>
                Xavier Institute of Engineering (XIE), located in Mahim, Mumbai, is one of the leading engineering institutes affiliated with the University of Mumbai.
              </p>
              <p>
                The institute focuses on academic excellence, innovation, research, and holistic student development. XIE regularly hosts technical events, cultural festivals, industry interactions, workshops, and seminars that help students gain practical exposure and leadership experience.
              </p>
              <p>
                Students from various disciplines actively participate in national and international competitions, making XIE a vibrant hub of learning, collaboration, and creativity.
              </p>

              <div className="stats-grid">
                <div className="stat-card">
                  <i className="fas fa-user-graduate"></i>
                  <div className="num">2,500+</div>
                  <div className="label">Students</div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-calendar-check"></i>
                  <div className="num">50+</div>
                  <div className="label">Events Conducted</div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-laptop-house"></i>
                  <div className="num">30+</div>
                  <div className="label">Workshops</div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-handshake"></i>
                  <div className="num">20+</div>
                  <div className="label">Industry Collabs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Contact Section */}
      <section className="contact-section section-padding" id="contact">
        <div className="container">
          <div className="section-title-wrap reveal">
            <h2 className="section-title">Contact Information</h2>
            <p className="section-sub">Get in touch with the student developer team or drop us a message</p>
          </div>

          <div className="contact-wrapper">
            {/* Developer Card */}
            <div className="glass-card contact-card reveal">
              <h3>Developer Information</h3>
              
              <div className="contact-item">
                <i className="fas fa-user-tie"></i>
                <div className="item-details">
                  <span className="item-label">Developed By</span>
                  <span className="item-val">Alvina Parmar</span>
                </div>
              </div>

              <div className="contact-item">
                <i className="fas fa-graduation-cap"></i>
                <div className="item-details">
                  <span className="item-label">Designation</span>
                  <span className="item-val">4th Year Computer Science &amp; Engineering Student</span>
                </div>
              </div>

              <div className="contact-item">
                <i className="fas fa-university"></i>
                <div className="item-details">
                  <span className="item-label">Institute</span>
                  <span className="item-val">Xavier Institute of Engineering, Mahim</span>
                </div>
              </div>

              
              <div className="social-icons">
                <a 
                  href="https://www.linkedin.com/in/alvina-parmar-281017391" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="LinkedIn Profile"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a 
                  href="https://github.com/alvinakparmar" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="GitHub Profile"
                >
                  <i className="fab fa-github"></i>
                </a>
                <a 
                  href="mailto:alvinaxie2415@gmail.com" 
                  aria-label="Send Email"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-envelope"></i>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card contact-card reveal">
              <h3>Send a Message</h3>
              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit" disabled={sending} style={{ marginTop: '8px' }}>
                  {sending ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <span 
                className="name" 
                onDoubleClick={() => router.push('/admin')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Double click for admin access"
              >
                Alvina Parmar
              </span>
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

      {/* Back to top button */}
      <button id="back-top" aria-label="Back to top">
        <i className="fas fa-arrow-up"></i>
      </button>
    </>
  )
}