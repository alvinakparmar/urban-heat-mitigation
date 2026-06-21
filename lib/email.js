// lib/email.js

// This file sends requests to our API route

export async function sendWelcomeEmail(email, name) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        type: 'welcome',
        name: name,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Email failed:', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Welcome email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    return { success: false, error }
  }
}

export async function sendEventConfirmationEmail(email, name, eventTitle, eventDate, eventVenue) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        type: 'event-confirmation',
        name: name,
        eventTitle: eventTitle,
        eventDate: eventDate,
        eventVenue: eventVenue,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Email failed:', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Confirmation email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error)
    return { success: false, error }
  }
}

export async function sendEventReminderEmail(email, name, eventTitle, eventDate, eventVenue) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        type: 'event-reminder',
        name: name,
        eventTitle: eventTitle,
        eventDate: eventDate,
        eventVenue: eventVenue,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Email failed:', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Reminder email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending reminder email:', error)
    return { success: false, error }
  }
}