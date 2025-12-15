'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layout, ExternalLink, Copy, Eye, EyeOff, Loader2 } from "lucide-react"
import { generateLandingPage, publishLandingPage, unpublishLandingPage } from './landing-actions'

interface LandingPageData {
  id: string
  slug: string
  is_active: boolean
  view_count: number
  created_at: string
}

export default function LandingTab({ 
  projectId, 
  landingPage 
}: { 
  projectId: string
  landingPage: LandingPageData | null 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')
    setSuccess('')

    const result = await generateLandingPage(projectId)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Landing page generated successfully!')
      setTimeout(() => window.location.reload(), 1500)
    }

    setIsGenerating(false)
  }

  const handleTogglePublish = async () => {
    if (!landingPage) return

    setIsToggling(true)
    setError('')

    const result = landingPage.is_active
      ? await unpublishLandingPage(landingPage.id, projectId)
      : await publishLandingPage(landingPage.id, projectId)

    if (result.error) {
      setError(result.error)
    } else {
      setTimeout(() => window.location.reload(), 500)
    }

    setIsToggling(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('URL copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  if (!landingPage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Generator</CardTitle>
          <CardDescription>
            AI will create a high-converting landing page based on your product spec.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layout className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Landing Page Yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Generate a beautiful, mobile-responsive landing page with lead capture form and analytics tracking.
            </p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
            <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Landing Page'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pageUrl = `${siteUrl}/l/${landingPage.slug}`

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Landing Page</CardTitle>
            <CardDescription>Your AI-generated landing page is ready!</CardDescription>
          </div>
          <Badge variant={landingPage.is_active ? 'default' : 'secondary'}>
            {landingPage.is_active ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">Public URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background px-3 py-2 rounded text-sm">{pageUrl}</code>
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(pageUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold">{landingPage.view_count || 0}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-lg font-semibold">
              {new Date(landingPage.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleTogglePublish} 
            disabled={isToggling}
            variant={landingPage.is_active ? 'outline' : 'default'}
          >
            {isToggling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : landingPage.is_active ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {landingPage.is_active ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


