import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimitAgent } from '@/lib/rate-limit'

export const maxDuration = 60

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)
}

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

    // 3. Fetch Product Spec
    const { data: spec } = await supabase
      .from('product_specs')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (!spec) {
      return NextResponse.json({ error: 'No product spec found. Generate spec first.' }, { status: 400 })
    }

    // 4. Fetch Project for metadata
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 5. Check for API Key / Demo Mode
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && 
                             !process.env.ANTHROPIC_API_KEY.includes('your-') &&
                             !process.env.ANTHROPIC_API_KEY.includes('here')

    // Generate slug
    const slug = generateSlug(project.name)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // --- DEMO MODE ---
    if (!hasAnthropicKey) {
      console.log('Missing Anthropic Key, running in DEMO MODE')
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${spec.hero_offer}</title>
  <meta name="description" content="${spec.tagline}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center; }
    .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.5rem; margin-bottom: 2rem; opacity: 0.9; }
    .cta-button { background: white; color: #667eea; padding: 15px 40px; border: none; border-radius: 50px; font-size: 1.2rem; font-weight: bold; cursor: pointer; }
    .features { padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
    .features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .feature { padding: 2rem; border: 1px solid #e0e0e0; border-radius: 10px; }
    .feature h3 { margin-bottom: 1rem; color: #667eea; }
    .pricing { background: #f7f7f7; padding: 80px 20px; text-align: center; }
    .pricing h2 { font-size: 2.5rem; margin-bottom: 1rem; }
    .price { font-size: 4rem; font-weight: bold; color: #667eea; margin: 2rem 0; }
    .lead-form { max-width: 500px; margin: 3rem auto; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .lead-form input { width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
    .lead-form button { width: 100%; padding: 15px; background: #667eea; color: white; border: none; border-radius: 5px; font-size: 1.1rem; font-weight: bold; cursor: pointer; }
    .lead-form button:hover { background: #5568d3; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>${spec.hero_offer}</h1>
    <p>${spec.tagline}</p>
    <button class="cta-button" onclick="document.getElementById('signup').scrollIntoView({behavior: 'smooth'})">${spec.cta_text || 'Get Started'}</button>
  </section>

  <section class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      ${spec.features?.map((feature: string) => `
        <div class="feature">
          <h3>✓ ${feature}</h3>
          <p>Transform your workflow with this powerful capability.</p>
        </div>
      `).join('') || ''}
    </div>
  </section>

  <section class="pricing">
    <h2>Simple Pricing</h2>
    <div class="price">${spec.pricing?.currency}${spec.pricing?.price}<span style="font-size: 1.5rem;">/${spec.pricing?.billing_cycle}</span></div>
    <p style="font-size: 1.2rem; margin-bottom: 2rem;">${spec.differentiation}</p>
    
    <div class="lead-form" id="signup">
      <h3 style="margin-bottom: 1rem;">Start Your Free Trial</h3>
      <form onsubmit="handleSubmit(event)">
        <input type="text" name="name" placeholder="Your Name" required />
        <input type="email" name="email" placeholder="Your Email" required />
        <input type="tel" name="phone" placeholder="Phone (optional)" />
        <button type="submit">${spec.cta_text || 'Get Started'}</button>
      </form>
      <div id="success-message" style="display: none; color: green; margin-top: 1rem; font-weight: bold;">Thanks! We'll be in touch soon.</div>
    </div>
  </section>

  <script>
    async function handleSubmit(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        project_id: '${projectId}',
        source: 'landing_page'
      };
      
      try {
        const response = await fetch('${siteUrl}/api/leads/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          e.target.style.display = 'none';
          document.getElementById('success-message').style.display = 'block';
          
          // Track conversion
          if (window.trackEvent) {
            window.trackEvent('conversion', { lead_id: data.email });
          }
        }
      } catch (error) {
        alert('Something went wrong. Please try again.');
      }
    }
  </script>
  <script src="${siteUrl}/analytics.js" data-project-id="${projectId}"></script>
</body>
</html>`

      const { error } = await supabase
        .from('landing_pages')
        .insert({
          project_id: projectId,
          slug,
          html_content: mockHtml,
          meta_description: spec.tagline,
          is_active: false,
          deployed_at: null
        })

      if (error) throw error

      return NextResponse.json({ 
        success: true, 
        mode: 'demo',
        slug,
        url: `${siteUrl}/l/${slug}`
      })
    }

    // --- REAL MODE ---
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `
Create a modern, high-converting landing page HTML for this product:

Product Spec:
- Hero Offer: ${spec.hero_offer}
- Tagline: ${spec.tagline}
- Features: ${JSON.stringify(spec.features)}
- Pricing: ${spec.pricing?.currency}${spec.pricing?.price}/${spec.pricing?.billing_cycle}
- Differentiation: ${spec.differentiation}
- CTA: ${spec.cta_text}
- Pain/Solution Map: ${JSON.stringify(spec.pain_solution_map)}

Requirements:
1. Complete HTML document with embedded CSS (no external files)
2. Modern, professional design with gradient hero section
3. Mobile-responsive (use CSS media queries)
4. Include these sections in order:
   - Hero with headline, tagline, and CTA button
   - Features section (grid layout)
   - Pricing section with price callout
   - Lead capture form (name, email, phone optional)
5. Form should POST to: ${siteUrl}/api/leads/capture with JSON body: {name, email, phone, project_id: "${projectId}", source: "landing_page"}
6. Include success message div (hidden by default, show after form submit)
7. Add this analytics script before </body>: <script src="${siteUrl}/analytics.js" data-project-id="${projectId}"></script>
8. Use professional color scheme (purple/blue gradient recommended)
9. Add smooth scroll behavior for CTA buttons
10. Include conversion tracking: call window.trackEvent('conversion', {lead_id: email}) after successful form submission

Return ONLY the complete HTML code, no explanations.
`

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: "You are an expert web designer. Return only valid, complete HTML code with embedded CSS.",
      messages: [{ role: "user", content: prompt }]
    })

    const contentBlock = msg.content[0]
    let htmlContent = ''
    if (contentBlock.type === 'text') {
      htmlContent = contentBlock.text
    }

    // Clean up any markdown formatting
    htmlContent = htmlContent.replace(/```html\n?|```/g, '').trim()

    const { error: dbError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: projectId,
        slug,
        html_content: htmlContent,
        meta_description: spec.tagline,
        is_active: false,
        deployed_at: null
      })

    if (dbError) throw dbError

    return NextResponse.json({ 
      success: true,
      slug,
      url: `${siteUrl}/l/${slug}`
    })

  } catch (error: any) {
    console.error('Landing Page Generation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

