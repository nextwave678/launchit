import { NextResponse } from 'next/server'
import { sendLeadNotification } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { to, leadData } = await request.json()

    if (!to || !leadData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendLeadNotification(to, leadData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email notification API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


