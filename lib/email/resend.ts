import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface LeadData {
  name?: string
  email: string
  phone?: string
  source?: string
}

interface Campaign {
  type: string
  scheduled_for?: string
  content: string
}

export async function sendLeadNotification(to: string, leadData: LeadData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LaunchIt <notifications@launchit.app>',
      to: [to],
      subject: '🎉 New Lead Captured!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">New Lead Alert!</h2>
          <p>You've got a new lead from your landing page:</p>
          
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadData.name || 'Not provided'}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${leadData.email}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${leadData.phone || 'Not provided'}</p>
            <p style="margin: 5px 0;"><strong>Source:</strong> ${leadData.source || 'Unknown'}</p>
          </div>
          
          <p>Don't wait too long to follow up! The best time to contact a lead is within the first 5 minutes.</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Lead in Dashboard
          </a>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by LaunchIt. To manage your notification preferences, visit your dashboard settings.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendCampaignReminder(to: string, campaign: Campaign) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email')
      return { success: false, error: 'Email service not configured' }
    }

    const scheduledDate = campaign.scheduled_for 
      ? new Date(campaign.scheduled_for).toLocaleString() 
      : 'soon'

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LaunchIt <notifications@launchit.app>',
      to: [to],
      subject: `📅 Campaign Reminder: ${campaign.type} scheduled for ${scheduledDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Campaign Reminder</h2>
          <p>Your <strong>${campaign.type}</strong> campaign is scheduled to go out ${scheduledDate}.</p>
          
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Campaign Content Preview:</h3>
            <pre style="white-space: pre-wrap; font-size: 14px;">${campaign.content.substring(0, 300)}${campaign.content.length > 300 ? '...' : ''}</pre>
          </div>
          
          <p><strong>Action Required:</strong> Remember to manually post this content to ${campaign.type} as scheduled. Copy the content from your dashboard.</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Campaign in Dashboard
          </a>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated reminder from LaunchIt.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}


