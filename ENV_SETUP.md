# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# ============================================
# SUPABASE (REQUIRED)
# ============================================
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================
# AI & RESEARCH APIs (OPTIONAL - Demo mode without these)
# ============================================
# Anthropic API Key (for Claude AI - powers research, product specs, landing pages, campaigns)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key

# ============================================
# EMAIL SERVICE (OPTIONAL - Skips emails without this)
# ============================================
# Resend API Key (for email notifications)
# Get from: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=LaunchIt <notifications@yourdomain.com>

# ============================================
# APPLICATION
# ============================================
# Your application URL (for landing page links and callbacks)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How to Get API Keys

### 1. Supabase (Required)
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (⚠️ Keep this secret!)

### 2. Anthropic/Claude (Optional - For AI Features)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account and get an API key
3. Powers all AI features: market research, product specs, landing pages, and campaigns
4. Without this, the app runs in "demo mode" with mock data

### 3. Resend (Optional - For Email Notifications)
1. Go to [resend.com](https://resend.com)
2. Sign up and verify your sending domain
3. Get your API key from the dashboard
4. Without this, lead notifications are skipped

## Environment Variable Notes

- **NEXT_PUBLIC_*** variables are exposed to the browser (client-side)
- **SUPABASE_SERVICE_ROLE_KEY** should NEVER be exposed to the browser
- The app gracefully handles missing optional API keys:
  - Missing ANTHROPIC_API_KEY → Demo mode with mock AI responses (research, product specs, landing pages, campaigns)
  - Missing RESEND_API_KEY → Email notifications are skipped
- Default NEXT_PUBLIC_SITE_URL is `http://localhost:3000` for development

## Vercel Deployment

When deploying to Vercel:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables listed above
4. Make sure to add them for all environments (Production, Preview, Development)

## Testing Without API Keys

You can test the full app flow without any API keys! Just:

1. Set up Supabase variables only
2. The app will automatically use demo mode for:
   - Research agent (returns mock pain points and competitors)
   - Product spec generation (returns mock features and pricing)
   - Landing page generation (returns pre-built HTML template)
   - Campaign generation (returns mock campaign content)
3. Lead capture and analytics still work normally (no AI needed)


