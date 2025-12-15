import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('event_type')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('project_id', projectId)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data: events, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Analytics fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Calculate metrics
    const totalViews = events?.filter(e => e.event_type === 'page_view').length || 0
    const uniqueSessions = new Set(events?.map(e => e.session_id).filter(Boolean)).size
    const formSubmits = events?.filter(e => e.event_type === 'form_submit').length || 0
    const conversions = events?.filter(e => e.event_type === 'conversion').length || 0
    const conversionRate = totalViews > 0 ? ((conversions / totalViews) * 100).toFixed(2) : '0.00'

    // Group by event type
    const eventsByType = events?.reduce((acc: any, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {})

    // Top sources (from metadata)
    const sources: { [key: string]: number } = {}
    events?.forEach(event => {
      if (event.metadata?.source) {
        sources[event.metadata.source] = (sources[event.metadata.source] || 0) + 1
      }
    })

    return NextResponse.json({
      metrics: {
        totalViews,
        uniqueSessions,
        formSubmits,
        conversions,
        conversionRate: parseFloat(conversionRate)
      },
      eventsByType,
      topSources: Object.entries(sources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([source, count]) => ({ source, count })),
      recentEvents: events?.slice(0, 50) || []
    })
  } catch (error: any) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


