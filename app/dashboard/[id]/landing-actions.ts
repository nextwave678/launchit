'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function generateLandingPage(projectId: string) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agents/landing-page`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({ projectId })
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to generate landing page' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true, ...data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function publishLandingPage(pageId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('landing_pages')
    .update({ 
      is_active: true,
      deployed_at: new Date().toISOString()
    })
    .eq('id', pageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${projectId}`)
  return { success: true }
}

export async function unpublishLandingPage(pageId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('landing_pages')
    .update({ is_active: false })
    .eq('id', pageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${projectId}`)
  return { success: true }
}

export async function deleteLandingPage(pageId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', pageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${projectId}`)
  return { success: true }
}

