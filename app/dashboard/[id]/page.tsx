import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bot, CheckCircle, Clock, FileText, Layout, Rocket, Target, Zap, Users } from "lucide-react"
import StartResearchButton from "./research-button"
import GenerateSpecButton from "./spec-button"
import LandingTab from "./landing-tab"
import CampaignsTab from "./campaigns-tab"
import LeadsTab from "./leads-tab"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch Project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) {
    notFound()
  }

  // Fetch Research Report
  const { data: research } = await supabase
    .from('research_reports')
    .select('*')
    .eq('project_id', project.id)
    .single()

  // Fetch Product Spec
  const { data: spec } = await supabase
    .from('product_specs')
    .select('*')
    .eq('project_id', project.id)
    .single()

  // Fetch Landing Page
  const { data: landingPage } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('project_id', project.id)
    .single()

  // Fetch Campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  // Fetch Leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'launched' ? 'default' : 'secondary'} className="capitalize">
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {project.niche} • {project.business_type.replace('_', ' ')} • ${project.budget} budget
          </p>
        </div>
        <div className="flex gap-2">
          {/* Context actions like Edit Project could go here */}
        </div>
      </div>

      <Tabs defaultValue={spec ? "product" : "research"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <Bot className="w-4 h-4" /> Research
          </TabsTrigger>
          <TabsTrigger value="product" disabled={!research} className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Product Spec
          </TabsTrigger>
          <TabsTrigger value="landing" disabled={!spec}>
            <Layout className="w-4 h-4 mr-2" /> Landing Page
          </TabsTrigger>
          <TabsTrigger value="campaigns" disabled={!spec}>
            <Target className="w-4 h-4 mr-2" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Users className="w-4 h-4 mr-2" /> Leads
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goal MRR</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${project.goal_mrr}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Tolerance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{project.risk_tolerance}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leads?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{landingPage?.view_count || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RESEARCH TAB */}
        <TabsContent value="research" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Research Agent</CardTitle>
              <CardDescription>
                Analyze your niche, find competitors, and identify pain points.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {research ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md w-fit">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Research Complete</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Top Pain Points</h3>
                      <ul className="space-y-2">
                        {research.pain_points?.map((point: any, i: number) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="text-red-500 font-bold">•</span>
                            {point.pain || point}
                          </li>
                        )) || <p className="text-muted-foreground">No pain points found.</p>}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Competitors</h3>
                       <ul className="space-y-2">
                        {research.competitors?.map((comp: any, i: number) => (
                          <li key={i} className="text-sm p-2 bg-muted rounded">
                            <div className="font-medium">{comp.name}</div>
                            <div className="text-xs text-muted-foreground">{comp.pricing || "Pricing N/A"}</div>
                          </li>
                        )) || <p className="text-muted-foreground">No competitors found.</p>}
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Opportunity Score</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-primary">{research.opportunity_score}/100</div>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {research.opportunity_score > 70 ? "High potential. Go for it!" : 
                         research.opportunity_score > 40 ? "Moderate potential. Needs differentiation." : 
                         "High competition or low demand. Proceed with caution."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No research yet</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Launch the Autonomous Research Agent to analyze the 
                    <span className="font-medium text-foreground"> {project.niche} </span> 
                    market. It will research pain points, analyze competitors, and calculate an opportunity score using AI.
                  </p>
                  <StartResearchButton projectId={project.id} niche={project.niche} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCT SPEC TAB */}
        <TabsContent value="product" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Product Specification</CardTitle>
              <CardDescription>
                Define your features, pricing, and positioning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spec ? (
                 <div className="space-y-8">
                  <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 text-center">
                    <h3 className="text-2xl font-bold text-primary mb-2">{spec.hero_offer}</h3>
                    <p className="text-lg text-muted-foreground italic">"{spec.tagline}"</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4" /> Key Features
                      </h4>
                      <ul className="space-y-3">
                        {spec.features?.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4" /> Problem & Solution
                      </h4>
                      <div className="space-y-4">
                        {spec.pain_solution_map?.map((item: any, i: number) => (
                          <div key={i} className="text-sm border-l-2 border-muted pl-4">
                            <div className="text-red-500 font-medium mb-1">Problem: {item.pain}</div>
                            <div className="text-green-600">Solution: {item.solution}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/50 p-6 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-2">Pricing Strategy</h4>
                      <div className="text-3xl font-bold">
                        {spec.pricing?.currency}{spec.pricing?.price}
                        <span className="text-sm font-normal text-muted-foreground">/{spec.pricing?.billing_cycle}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Why: {spec.differentiation}
                      </p>
                    </div>
                    <Button size="lg" className="min-w-[200px]">
                      Deploy Landing Page
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Product Spec yet</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Based on the research, the AI can now generate a complete product specification, 
                    including features, pricing, and your hero offer.
                  </p>
                  <GenerateSpecButton projectId={project.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LANDING PAGE TAB */}
        <TabsContent value="landing" className="space-y-4">
          <LandingTab projectId={project.id} landingPage={landingPage} />
        </TabsContent>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsTab projectId={project.id} campaigns={campaigns || []} />
        </TabsContent>

        {/* LEADS TAB */}
        <TabsContent value="leads" className="space-y-4">
          <LeadsTab projectId={project.id} leads={leads || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
