'use client'

import { useActionState } from 'react'
import { createProject } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = {
  message: '',
  errors: {},
}

export function CreateProjectForm() {
  const [state, action, isPending] = useActionState(createProject, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input id="name" name="name" placeholder="My Awesome Startup" required />
            {state.errors?.name && <p className="text-red-500 text-sm">{state.errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="niche">Niche</Label>
            <Input id="niche" name="niche" placeholder="e.g. Productivity tools for remote workers" required />
            {state.errors?.niche && <p className="text-red-500 text-sm">{state.errors.niche}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input id="budget" name="budget" type="number" placeholder="1000" min="0" required />
              {state.errors?.budget && <p className="text-red-500 text-sm">{state.errors.budget}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal_mrr">Goal MRR ($)</Label>
              <Input id="goal_mrr" name="goal_mrr" type="number" placeholder="5000" min="0" required />
              {state.errors?.goal_mrr && <p className="text-red-500 text-sm">{state.errors.goal_mrr}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="geography">Geography (Optional)</Label>
            <Input id="geography" name="geography" placeholder="e.g. North America, Global" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="business_type">Business Type</Label>
              <select
                id="business_type"
                name="business_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select type</option>
                <option value="saas">SaaS</option>
                <option value="service">Service</option>
                <option value="info_product">Info Product</option>
                <option value="creator_tool">Creator Tool</option>
              </select>
              {state.errors?.business_type && <p className="text-red-500 text-sm">{state.errors.business_type}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="risk_tolerance">Risk Tolerance</Label>
              <select
                id="risk_tolerance"
                name="risk_tolerance"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select tolerance</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {state.errors?.risk_tolerance && <p className="text-red-500 text-sm">{state.errors.risk_tolerance}</p>}
            </div>
          </div>

          {state.message && <p className="text-red-500 text-sm">{state.message}</p>}
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}







