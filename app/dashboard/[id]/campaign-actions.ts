'use server'

import { revalidatePath } from 'next/cache'

export async function createCampaign(projectId: string, type: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agents/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, type })
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to create campaign' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true, campaign: data.campaign }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function approveCampaign(campaignId: string, projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/campaigns`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, approval_status: 'approved' })
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to approve campaign' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function scheduleCampaign(campaignId: string, scheduledFor: string, projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/campaigns`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        campaignId, 
        scheduled_for: scheduledFor,
        status: 'scheduled'
      })
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to schedule campaign' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateCampaignContent(campaignId: string, content: string, projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/campaigns`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, content })
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to update campaign' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteCampaign(campaignId: string, projectId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/campaigns?campaignId=${campaignId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to delete campaign' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}


