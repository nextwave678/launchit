import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitAgent } from '@/lib/rate-limit'

export const maxDuration = 60 // Allow longer timeout for AI research

export async function POST(request: Request) {
  try {
    const { projectId, niche } = await request.json()
    const supabase = await createClient()

    // 1. Check for Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Rate limiting
    const rateLimitResult = rateLimitAgent(user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString()
          }
        }
      )
    }

    // 3. Check for Anthropic API Key
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && 
                            !process.env.ANTHROPIC_API_KEY.includes('your-') &&
                            !process.env.ANTHROPIC_API_KEY.includes('here')

    // --- DEMO MODE (If Anthropic key is missing) ---
    if (!hasAnthropicKey) {
      console.log('Missing Anthropic API key, running in DEMO MODE')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Fake delay
      
      const mockData = {
        pain_points: [
          { pain: "Manual data entry is too slow", frequency: "High" },
          { pain: "Existing tools are too expensive ($500/mo+)", frequency: "Medium" },
          { pain: "No mobile app available", frequency: "High" }
        ],
        competitors: [
          { name: "BigCorp Inc", pricing: "$500/mo", url: "example.com" },
          { name: "OldSchool Soft", pricing: "$200/mo", url: "example.org" }
        ],
        opportunity_score: 85,
        social_sentiment: "Frustrated with current options",
        recommended_offers: ["Mobile-first alternative", "Pay-as-you-go model"]
      }

      // Save mock data
      const { error } = await supabase
        .from('research_reports')
        .insert({
          project_id: projectId,
          ...mockData,
          raw_data: { source: "demo_mode" }
        })

      if (error) throw error

      return NextResponse.json({ success: true, mode: 'demo' })
    }

    // --- REAL MODE: Use Claude for comprehensive market research ---

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const prompt = `
      Conduct comprehensive market research for the "${niche}" industry/niche.
      
      As a market research expert, analyze this market and provide insights based on:
      - Industry trends and current state
      - Common pain points and frustrations users face
      - Existing competitors and their pricing models
      - Market gaps and opportunities
      - Social sentiment and user needs
      
      Research the market thoroughly and provide real, actionable insights.
      
      Return JSON format:
      {
        "pain_points": [
          {"pain": "specific problem description", "frequency": "high/med/low"},
          {"pain": "another problem", "frequency": "high/med/low"},
          {"pain": "third problem", "frequency": "high/med/low"}
        ],
        "competitors": [
          {"name": "real competitor name", "pricing": "actual pricing if known (e.g., $29/mo, $99/year, free)", "url": "competitor website if known"},
          {"name": "another competitor", "pricing": "pricing", "url": "url"}
        ],
        "opportunity_score": 85,
        "social_sentiment": "summary of market sentiment and user frustrations",
        "recommended_offers": ["suggested value proposition 1", "suggested value proposition 2"]
      }
      
      Make sure to:
      - Provide real, specific pain points that are common in this niche
      - Identify actual competitors with realistic pricing
      - Calculate opportunity_score (0-100) based on market gaps and user frustration
      - Base recommendations on actual market needs
    `

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.3,
      system: "You are an expert market researcher with deep knowledge of various industries, competitors, pricing models, and user pain points. Provide accurate, actionable market research. Return only valid JSON.",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": prompt
            }
          ]
        }
      ]
    })

    const contentBlock = msg.content[0]
    let aiResponseString = ''
    
    if (contentBlock.type === 'text') {
      aiResponseString = contentBlock.text
    }

    // Parse JSON from AI (simple cleanup if markdown is used)
    const jsonString = aiResponseString.replace(/```json\n?|```/g, '').trim()
    const analysis = JSON.parse(jsonString)

    // Save to Database
    const { error: dbError } = await supabase
      .from('research_reports')
      .insert({
        project_id: projectId,
        pain_points: analysis.pain_points,
        competitors: analysis.competitors,
        opportunity_score: analysis.opportunity_score,
        social_sentiment: analysis.social_sentiment,
        raw_data: { 
          source: "claude_research",
          niche: niche,
          recommended_offers: analysis.recommended_offers || []
        }
      })

    if (dbError) throw dbError

    return NextResponse.json({ success: true, mode: 'claude' })

  } catch (error: any) {
    console.error('Research Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}





