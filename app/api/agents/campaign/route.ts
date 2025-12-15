import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitAgent } from '@/lib/rate-limit'

export const maxDuration = 60

const PLATFORM_PROMPTS = {
  twitter: `Create a Twitter/X thread with 5-8 tweets.
  - First tweet: Hook with a bold statement or question
  - Middle tweets: Break down key benefits/features (one per tweet)
  - Include relevant emojis (not excessive)
  - Use line breaks for readability
  - Final tweet: Clear CTA with link
  - Each tweet under 280 characters`,
  
  email: `Create a cold outreach email.
  - Subject line: Curiosity-driven, not salesy
  - Opening: Personalized hook related to their pain point
  - Body: Brief value prop (2-3 sentences max)
  - Social proof if available
  - Clear CTA (demo/trial/call)
  - Keep total email under 150 words
  - P.S. line with urgency/benefit`,
  
  meta: `Create Meta (Facebook/Instagram) ad copy.
  - Headline: Benefit-focused (max 40 chars)
  - Body: Problem → Solution → Result (3 sentences)
  - Include emotional trigger
  - Clear CTA button text
  - Ad text under 125 characters for optimal performance`
}

export async function POST(request: Request) {
  try {
    const { projectId, type } = await request.json()
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

    // 3. Validate type
    if (!['twitter', 'email', 'meta'].includes(type)) {
      return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 })
    }

    // 4. Fetch Product Spec and Research
    const { data: spec } = await supabase
      .from('product_specs')
      .select('*')
      .eq('project_id', projectId)
      .single()

    const { data: research } = await supabase
      .from('research_reports')
      .select('*')
      .eq('project_id', projectId)
      .single()

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!spec || !project) {
      return NextResponse.json({ error: 'Product spec required. Generate spec first.' }, { status: 400 })
    }

    // 5. Check for API Key / Demo Mode
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && 
                             !process.env.ANTHROPIC_API_KEY.includes('your-') &&
                             !process.env.ANTHROPIC_API_KEY.includes('here')

    // --- DEMO MODE ---
    if (!hasAnthropicKey) {
      console.log('Missing Anthropic Key, running in DEMO MODE')
      await new Promise(resolve => setTimeout(resolve, 1500))

      const demoContent = {
        twitter: `Thread: Why most ${project.niche} tools fail (and what actually works) 🧵\n\n1/ The problem: ${research?.pain_points?.[0]?.pain || 'Complex workflows killing productivity'}\n\n2/ ${spec.hero_offer}\n${spec.tagline}\n\n3/ Key features:\n${spec.features?.slice(0, 2).map((f: string) => `• ${f}`).join('\n')}\n\n4/ Pricing: ${spec.pricing?.currency}${spec.pricing?.price}/${spec.pricing?.billing_cycle}\n\n5/ ${spec.cta_text} → [link]`,
        
        email: `Subject: ${spec.tagline}\n\nHi [Name],\n\nI noticed you're in the ${project.niche} space. Quick question: are you still dealing with ${research?.pain_points?.[0]?.pain || 'manual processes'}?\n\nWe built ${spec.hero_offer} specifically to solve this. ${spec.differentiation}\n\nHundreds of teams are already using it. Would you be open to a quick 15-min demo this week?\n\n${spec.cta_text}\n\nBest,\n[Your Name]\n\nP.S. First 50 signups get 30% off for life.`,
        
        meta: `Headline: ${spec.hero_offer}\n\nBody: Tired of ${research?.pain_points?.[0]?.pain || 'wasting time on manual work'}? ${spec.tagline} Starting at just ${spec.pricing?.currency}${spec.pricing?.price}/${spec.pricing?.billing_cycle}.\n\nCTA: ${spec.cta_text}`
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          project_id: projectId,
          type,
          content: demoContent[type as keyof typeof demoContent],
          platform: type,
          status: 'draft',
          approval_status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, campaign, mode: 'demo' })
    }

    // --- REAL MODE ---
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `
${PLATFORM_PROMPTS[type as keyof typeof PLATFORM_PROMPTS]}

Product Information:
- Name/Offer: ${spec.hero_offer}
- Tagline: ${spec.tagline}
- Key Features: ${JSON.stringify(spec.features)}
- Pricing: ${spec.pricing?.currency}${spec.pricing?.price}/${spec.pricing?.billing_cycle}
- Differentiation: ${spec.differentiation}
- CTA: ${spec.cta_text}
- Target Niche: ${project.niche}

${research ? `Market Research:
- Top Pain Points: ${JSON.stringify(research.pain_points)}
- Competitors: ${JSON.stringify(research.competitors)}
- Sentiment: ${research.social_sentiment}` : ''}

Generate the ${type} content following the guidelines above. Return ONLY the content, no explanations or meta-commentary.
`

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.8,
      system: "You are a growth marketer expert at writing high-converting campaign copy. Write authentic, non-salesy content.",
      messages: [{ role: "user", content: prompt }]
    })

    const contentBlock = msg.content[0]
    let content = ''
    if (contentBlock.type === 'text') {
      content = contentBlock.text
    }

    // Save campaign to database
    const { data: campaign, error: dbError } = await supabase
      .from('campaigns')
      .insert({
        project_id: projectId,
        type,
        content,
        platform: type,
        status: 'draft',
        approval_status: 'pending'
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ success: true, campaign })

  } catch (error: any) {
    console.error('Campaign Generation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

