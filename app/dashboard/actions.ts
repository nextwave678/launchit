'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  niche: z.string().min(1, "Niche is required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  geography: z.string().optional(),
  business_type: z.enum(['service', 'saas', 'info_product', 'creator_tool'], {
    errorMap: () => ({ message: "Please select a valid business type" }),
  }),
  goal_mrr: z.coerce.number().min(0, "Goal MRR must be positive"),
  risk_tolerance: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: "Please select a valid risk tolerance" }),
  }),
})

export async function createProject(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    name: formData.get('name'),
    niche: formData.get('niche'),
    budget: formData.get('budget'),
    geography: formData.get('geography'),
    business_type: formData.get('business_type'),
    goal_mrr: formData.get('goal_mrr'),
    risk_tolerance: formData.get('risk_tolerance'),
  }

  const validatedFields = projectSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Project.',
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      message: 'User not authenticated',
    }
  }

  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    ...validatedFields.data,
    status: 'researching'
  })

  if (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to create project.',
    }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateProject(projectId: string, data: Partial<z.infer<typeof projectSchema>>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('projects')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update project error:', error)
    return { error: 'Failed to update project' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${projectId}`)
  return { success: true }
}

export async function updateProjectStatus(projectId: string, status: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const validStatuses = ['researching', 'building', 'launched', 'iterating', 'paused']
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' }
  }

  const { error } = await supabase
    .from('projects')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update status error:', error)
    return { error: 'Failed to update status' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${projectId}`)
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Delete project error:', error)
    return { error: 'Failed to delete project' }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function getProjectWithStats(projectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return { error: 'Project not found' }
  }

  // Fetch lead count
  const { count: leadCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  // Fetch landing page views
  const { data: landingPages } = await supabase
    .from('landing_pages')
    .select('view_count')
    .eq('project_id', projectId)

  const totalViews = landingPages?.reduce((sum, page) => sum + (page.view_count || 0), 0) || 0

  return {
    success: true,
    project,
    stats: {
      leadCount: leadCount || 0,
      pageViews: totalViews
    }
  }
}


