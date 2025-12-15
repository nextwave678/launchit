'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createProject } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { ArrowRight, ArrowLeft, Rocket } from "lucide-react"

export default function NewProjectPage() {
  const [state, formAction] = useActionState(createProject, null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    summary: '',
    website: '',
    budget: 1000,
    geography: 'Global',
    business_type: 'saas',
    goal_mrr: 5000,
    risk_tolerance: 'medium'
  })

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-blue-600" />
            Create New Project
          </CardTitle>
          <CardDescription>
            Step {step} of 3: {
              step === 1 ? "The Spark" : 
              step === 2 ? "Constraints" : "Goals"
            }
          </CardDescription>
        </CardHeader>
        
        <form action={formAction}>
          <CardContent className="space-y-6 py-4">
            
            {state?.message && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
                {state.message}
              </div>
            )}

            {/* Explicitly render hidden inputs to ensure stability and no undefined values */}
            <input type="hidden" name="name" value={formData.name || ''} />
            <input type="hidden" name="niche" value={formData.niche || ''} />
            <input type="hidden" name="summary" value={formData.summary || ''} />
            <input type="hidden" name="website" value={formData.website || ''} />
            <input type="hidden" name="budget" value={formData.budget || 0} />
            <input type="hidden" name="geography" value={formData.geography || ''} />
            <input type="hidden" name="business_type" value={formData.business_type || 'saas'} />
            <input type="hidden" name="goal_mrr" value={formData.goal_mrr || 0} />
            <input type="hidden" name="risk_tolerance" value={formData.risk_tolerance || 'medium'} />

            {/* STEP 1: THE SPARK */}
            <div className={step === 1 ? "block space-y-4 animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. RealEstateAI" 
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      required={step === 1}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niche">Target Niche</Label>
                    <Input 
                      id="niche" 
                      placeholder="e.g. Solo Accountants" 
                      value={formData.niche}
                      onChange={(e) => updateField('niche', e.target.value)}
                      required={step === 1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Project Summary</Label>
                  <Textarea 
                    id="summary" 
                    placeholder="Describe your idea in a few sentences. What problem are you solving?" 
                    value={formData.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    required={step === 1}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">The more detail you provide, the better the AI can research.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Existing Website (Optional)</Label>
                  <Input 
                    id="website" 
                    placeholder="https://..." 
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="geography">Target Geography</Label>
                  <Input 
                    id="geography" 
                    placeholder="e.g. Global, US Only, UK & Europe" 
                    value={formData.geography}
                    onChange={(e) => updateField('geography', e.target.value)}
                  />
                </div>
            </div>

            {/* STEP 2: CONSTRAINTS */}
            <div className={step === 2 ? "block space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                 <div className="space-y-3">
                  <Label>Business Model</Label>
                  <RadioGroup 
                    value={formData.business_type} 
                    onValueChange={(val) => updateField('business_type', val)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="saas" id="saas" className="peer sr-only" />
                      <Label
                        htmlFor="saas"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-lg font-semibold">SaaS</span>
                        <span className="text-xs text-muted-foreground mt-1">Software</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="service" id="service" className="peer sr-only" />
                      <Label
                        htmlFor="service"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-lg font-semibold">Service</span>
                        <span className="text-xs text-muted-foreground mt-1">Agency/Freelance</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="info_product" id="info_product" className="peer sr-only" />
                      <Label
                        htmlFor="info_product"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-lg font-semibold">Info Product</span>
                        <span className="text-xs text-muted-foreground mt-1">Course/Ebook</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="creator_tool" id="creator_tool" className="peer sr-only" />
                      <Label
                        htmlFor="creator_tool"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-lg font-semibold">Creator Tool</span>
                        <span className="text-xs text-muted-foreground mt-1">Asset/Template</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Initial Budget</Label>
                    <span className="text-sm font-bold text-primary">${formData.budget}</span>
                  </div>
                  <Slider 
                    min={0} 
                    max={10000} 
                    step={100} 
                    value={[formData.budget]}
                    onValueChange={(vals) => updateField('budget', vals[0])}
                  />
                  <p className="text-xs text-muted-foreground">How much can you invest to get to first revenue?</p>
                </div>
            </div>

            {/* STEP 3: GOALS */}
            <div className={step === 3 ? "block space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                <div className="space-y-4">
                  <Label>Target Monthly Revenue (MRR)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">$</span>
                    <Input 
                      type="number" 
                      value={formData.goal_mrr} 
                      onChange={(e) => updateField('goal_mrr', Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Risk Tolerance</Label>
                  <Select 
                    value={formData.risk_tolerance} 
                    onValueChange={(val) => updateField('risk_tolerance', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Slow & Steady)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="high">High (Aggressive Growth)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    High risk means faster experimentation but higher potential for failure.
                  </p>
                </div>
            </div>

          </CardContent>
          
          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <div /> /* Spacer */
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep} disabled={!formData.name || !formData.niche || !formData.summary}>
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <SubmitButton />
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending} className="bg-green-600 hover:bg-green-700">
      {pending ? 'Launching...' : 'Launch Project 🚀'}
    </Button>
  )
}
