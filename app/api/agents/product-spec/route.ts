import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitAgent } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json()
    const supabase = await createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    // 3. Fetch Research Report
    const { data: research } = await supabase
      .from('research_reports')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (!research) {
      return NextResponse.json({ error: 'No research found. Run research agent first.' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    // 4. Check Keys / Demo Mode
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && 
                             !process.env.ANTHROPIC_API_KEY.includes('your-') &&
                             !process.env.ANTHROPIC_API_KEY.includes('here')

    // --- DEMO MODE ---
    if (!hasAnthropicKey) {
      console.log('Missing Anthropic Key, running in DEMO MODE')
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockSpec = {
        hero_offer: `The All-in-One ${project.niche} Management Platform`,
        tagline: "Stop wasting time on admin. Start growing your business.",
        pain_solution_map: [
          { pain: "Manual data entry", solution: "One-click automation" },
          { pain: "Expensive enterprise tools", solution: "Affordable pay-as-you-go pricing" }
        ],
        pricing: {
          price: 29,
          currency: "$",
          billing_cycle: "month"
        },
        features: [
          "Mobile App for on-the-go access",
          "Automated invoicing",
          "Client portal"
        ],
        differentiation: "We are the only mobile-first solution built specifically for this niche.",
        cta_text: "Start Free Trial"
      }

      const { error } = await supabase
        .from('product_specs')
        .insert({
          project_id: projectId,
          ...mockSpec
        })
      
      if (error) throw error

      return NextResponse.json({ success: true, mode: 'demo' })
    }

    // --- REAL MODE ---
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `
      Act as a product strategist. Based on this research for a "${project.niche}" product:
      
      Research: ${JSON.stringify(research)}
      Project Context: ${JSON.stringify(project)}

      Create a high-converting product specification.
      
      Return JSON:
      {
        "hero_offer": "One sentence value prop",
        "tagline": "Punchy 5-7 word slogan",
        "pain_solution_map": [{"pain": "X", "solution": "Y"}],
        "pricing": {"price": 29, "currency": "$", "billing_cycle": "month"},
        "features": ["Feature 1", "Feature 2", "Feature 3"],
        "differentiation": "Why we win",
        "cta_text": "Button text"
      }
    `

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are a product expert. Return only valid JSON.",
      messages: [{ role: "user", content: prompt }]
    })

    const contentBlock = msg.content[0]
    let aiResponseString = ''
    if (contentBlock.type === 'text') {
      aiResponseString = contentBlock.text
    }
    
    const spec = JSON.parse(aiResponseString.replace(/```json\n?|```/g, ''))

    const { error: dbError } = await supabase
      .from('product_specs')
      .insert({
        project_id: projectId,
        ...spec
      })

    if (dbError) throw dbError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Product Spec Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




