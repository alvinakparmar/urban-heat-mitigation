import Link from 'next/link'

export default function EventCard({ event }) {
  // Map categories to modern gradient backgrounds and Font Awesome icons
  const categoryStyles = {
    concert: {
      gradient: 'linear-gradient(135deg, #FF512F, #DD2476)',
      icon: 'fa-music'
    },
    meetup: {
      gradient: 'linear-gradient(135deg, #4776E6, #8E54E9)',
      icon: 'fa-users'
    },
    workshop: {
      gradient: 'linear-gradient(135deg, #1D976C, #93F9B9)',
      icon: 'fa-laptop-code'
    },
    seminar: {
      gradient: 'linear-gradient(135deg, #396afc, #2948ff)',
      icon: 'fa-chalkboard-teacher'
    },
    cultural: {
      gradient: 'linear-gradient(135deg, #e65c00, #F9D423)',
      icon: 'fa-masks-theater'
    },
    sports: {
      gradient: 'linear-gradient(135deg, #f857a6, #ff5858)',
      icon: 'fa-running'
    },
    other: {
      gradient: 'linear-gradient(135deg, #2E7D32, #81C784)',
      icon: 'fa-calendar-alt'
    }
  }

  const categoryLower = event.category?.toLowerCase() || 'other'
  const styleConfig = categoryStyles[categoryLower] || categoryStyles.other

  // Safe access for users
  const hostName = event.users?.full_name || 'Organized By XIE'

  // ✅ Check if cover_image exists
  const hasImage = event.cover_image && event.cover_image !== 'null' && event.cover_image !== ''

  // ✅ Get status color
  const getStatusColor = (status) => {
    const colors = {
      upcoming: { bg: '#dbeafe', color: '#1e40af', label: 'Upcoming' },
      ongoing: { bg: '#fef3c7', color: '#92400e', label: 'Ongoing' },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
      cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' }
    }
    return colors[status] || colors.upcoming
  }

  const statusInfo = getStatusColor(event.status)

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
      transition: 'all 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)'
      e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)'
      e.currentTarget.style.boxShadow = 'var(--shadow)'
    }}
    >
      {/* ✅ Event Image */}
      <div style={{
        width: '100%',
        height: '200px',
        backgroundColor: '#e2e8f0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {hasImage ? (
          <img 
            src={event.cover_image} 
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              const parent = e.target.parentElement
              parent.style.background = styleConfig.gradient
              parent.innerHTML = `<i class="fas ${styleConfig.icon}" style="font-size:3rem;color:white;"></i>`
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: styleConfig.gradient,
            color: 'white',
            fontSize: '3rem'
          }}>
            <i className={`fas ${styleConfig.icon}`}></i>
          </div>
        )}
        {/* Category Badge on Image */}
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'capitalize'
        }}>
          {event.category || 'Event'}
        </span>
        {/* ✅ Status Badge on Image */}
        {event.status && event.status !== 'upcoming' && (
          <span style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '600',
            backgroundColor: statusInfo.bg,
            color: statusInfo.color
          }}>
            {statusInfo.label}
          </span>
        )}
      </div>
      
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{
            background: '#81C784',
            color: '#1e2a2e',
            padding: '4px 14px',
            borderRadius: '30px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {event.category || 'Event'}
          </span>
          {event.event_type && (
            <span style={{
              background: 'rgba(0,0,0,0.05)',
              color: '#1e2a2e',
              padding: '4px 14px',
              borderRadius: '30px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {event.event_type}
            </span>
          )}
          {/* ✅ Status Tag as badge */}
          {event.status && (
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: '600',
              backgroundColor: statusInfo.bg,
              color: statusInfo.color
            }}>
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: '700',
          marginBottom: '6px',
          color: 'var(--text-color)'
        }}>{event.title}</h3>

        {/* Description */}
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--gray-text)',
          marginBottom: '12px',
          flex: '1',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {event.description?.length > 120 
            ? `${event.description.substring(0, 117)}...` 
            : event.description || 'No description provided.'}
        </p>

        {/* Meta Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: 'var(--gray-text)',
          marginBottom: '12px'
        }}>
          <span>
            <i className="fas fa-user" style={{ marginRight: '4px' }}></i>
            {hostName}
          </span>
          <span>
            <i className="fas fa-users" style={{ marginRight: '4px' }}></i>
            {event.current_attendees || 0}
          </span>
          <span>
            <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>
            {event.venue || 'Online'}
          </span>
        </div>

        {/* Bottom Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto'
        }}>
          <span style={{
            fontWeight: '700',
            color: 'var(--primary)',
            fontSize: '0.85rem'
          }}>
            {event.start_date ? new Date(event.start_date).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'Date TBA'}
          </span>
          <Link 
            href={`/events/${event.id}`} 
            style={{
              color: 'var(--primary)',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary)'}
          >
            Details <i className="fas fa-arrow-right" style={{ marginLeft: '4px' }}></i>
          </Link>
        </div>
      </div>
    </div>
  )
}