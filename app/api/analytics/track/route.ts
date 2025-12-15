import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimitAnalytics } from '@/lib/rate-limit'

// Use service role to bypass RLS for public analytics tracking
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

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = rateLimitAnalytics(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { projectId, event_type, metadata, session_id } = await request.json()

    // Validate required fields
    if (!projectId || !event_type) {
      return NextResponse.json(
        { error: 'projectId and event_type are required' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEventTypes = ['page_view', 'button_click', 'form_submit', 'form_abandon', 'conversion']
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type' },
        { status: 400 }
      )
    }

    // Insert analytics event
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        project_id: projectId,
        event_type,
        metadata: metadata || {},
        session_id: session_id || null
      })

    if (error) {
      console.error('Analytics tracking error:', error)
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      )
    }

    // Return minimal response for performance
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics track API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

