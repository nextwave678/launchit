'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function regenerateResearch(projectId: string, niche: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Delete old research
    await supabase
      .from('research_reports')
      .delete()
      .eq('project_id', projectId)

    // Trigger new research
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agents/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, niche })
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to regenerate research' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function regenerateSpec(projectId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Delete old spec
    await supabase
      .from('product_specs')
      .delete()
      .eq('project_id', projectId)

    // Trigger new spec generation
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agents/product-spec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to regenerate spec' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}


