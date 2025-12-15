import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimitLeadCapture } from '@/lib/rate-limit'

// Use service role to bypass RLS for public lead insertion
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

function calculateQualityScore(email: string, name: string, phone?: string): number {
  let score = 50 // Base score

  // Email quality
  if (email.includes('@gmail.com') || email.includes('@yahoo.com') || email.includes('@hotmail.com')) {
    score += 10
  } else if (!email.includes('@')) {
    score -= 20
  } else {
    score += 20 // Business email
  }

  // Name completeness
  if (name && name.split(' ').length > 1) {
    score += 15
  }

  // Phone provided
  if (phone && phone.length >= 10) {
    score += 15
  }

  return Math.max(0, Math.min(100, score))
}

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = rateLimitLeadCapture(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const { name, email, phone, project_id, source } = await request.json()

    // Validate required fields
    if (!email || !project_id) {
      return NextResponse.json(
        { error: 'Email and project_id are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Calculate quality score
    const quality_score = calculateQualityScore(email, name, phone)

    // Insert lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        project_id,
        name: name || null,
        email,
        phone: phone || null,
        source: source || 'unknown',
        status: 'new',
        quality_score
      })
      .select()
      .single()

    if (leadError) {
      console.error('Lead insertion error:', leadError)
      return NextResponse.json(
        { error: 'Failed to capture lead' },
        { status: 500 }
      )
    }

    // Track analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        project_id,
        event_type: 'lead_captured',
        metadata: { lead_id: lead.id, source },
        session_id: null
      })

    // Send notification email (handled separately, don't block response)
    // This will be implemented in the email service integration
    if (process.env.RESEND_API_KEY) {
      try {
        // Fetch project owner's email
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select('user_id')
          .eq('id', project_id)
          .single()

        if (project) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(project.user_id)
          
          if (userData?.user?.email) {
            // Send email notification (fire and forget)
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/lead-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: userData.user.email,
                leadData: { name, email, phone, source }
              })
            }).catch(err => console.error('Email notification failed:', err))
          }
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError)
        // Don't fail the lead capture if email fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

