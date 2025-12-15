import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  // Fetch landing page by slug (RLS policy allows public read for active pages)
  const { data: page, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !page) {
    notFound()
  }

  // Increment view count (fire and forget)
  supabase
    .from('landing_pages')
    .update({ view_count: (page.view_count || 0) + 1 })
    .eq('id', page.id)
    .then()

  // Return raw HTML
  return (
    <div dangerouslySetInnerHTML={{ __html: page.html_content }} />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: page } = await supabase
    .from('landing_pages')
    .select('meta_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return {
    title: page?.meta_description || 'Landing Page',
    description: page?.meta_description || ''
  }
}

