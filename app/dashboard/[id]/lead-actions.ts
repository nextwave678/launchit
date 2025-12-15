'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: string, projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/leads`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, status })
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to update lead status' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addLeadNote(leadId: string, notes: string, projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/leads`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, notes })
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to add note' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteLead(leadId: string, projectId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/leads?leadId=${leadId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to delete lead' }
    }

    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function exportLeads(projectId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Convert to CSV
    const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Quality Score', 'Created At', 'Notes']
    const rows = leads?.map(lead => [
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.source || '',
      lead.status || '',
      lead.quality_score?.toString() || '',
      new Date(lead.created_at).toLocaleDateString(),
      lead.notes || ''
    ]) || []

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return { success: true, csv }
  } catch (error: any) {
    return { error: error.message }
  }
}


