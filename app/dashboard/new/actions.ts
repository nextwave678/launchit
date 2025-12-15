'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  niche: z.string().min(2, "Niche must be at least 2 characters"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  website: z.string().optional().or(z.literal('')),
  budget: z.number().min(0),
  geography: z.string().optional(),
  business_type: z.enum(['service', 'saas', 'info_product', 'creator_tool']),
  goal_mrr: z.number().min(0),
  risk_tolerance: z.enum(['low', 'medium', 'high']),
})

export async function createProject(prevState: any, formData: FormData) {
  // Defensive check: handle both useActionState (2 args) and standard form action (1 arg)
  let form = formData;
  
  // If called directly as action={createProject}, prevState is the FormData
  if (!form && prevState instanceof FormData) {
    form = prevState;
  }

  // Ensure form is valid
  if (!form) {
    return { message: 'Invalid form data submission' }
  }

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { message: 'Unauthorized' }
  }

  const rawData = {
    name: form.get('name'),
    niche: form.get('niche'),
    summary: form.get('summary'),
    website: form.get('website'),
    budget: Number(form.get('budget')),
    geography: form.get('geography'),
    business_type: form.get('business_type'),
    goal_mrr: Number(form.get('goal_mrr')),
    risk_tolerance: form.get('risk_tolerance'),
  }

  const validatedFields = projectSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Project.',
    }
  }

  // Clean up website if empty string
  const cleanData = { ...validatedFields.data }
  if (cleanData.website === '') {
    cleanData.website = undefined
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        ...cleanData,
        user_id: user.id,
        status: 'researching'
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Database Error:', error)
    return { message: 'Database Error: Failed to Create Project.' }
  }

  redirect(`/dashboard/${data.id}`)
}
