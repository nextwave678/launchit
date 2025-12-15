'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Target, Plus, Loader2, Calendar, CheckCircle, Copy } from "lucide-react"
import { createCampaign, approveCampaign, updateCampaignContent } from './campaign-actions'

interface Campaign {
  id: string
  type: string
  content: string
  status: string
  approval_status: string
  scheduled_for: string | null
  created_at: string
}

export default function CampaignsTab({ 
  projectId, 
  campaigns: initialCampaigns 
}: { 
  projectId: string
  campaigns: Campaign[]
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCreate = async (type: string) => {
    setIsCreating(true)
    setError('')
    setSuccess('')

    const result = await createCampaign(projectId, type)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`${type} campaign generated!`)
      setTimeout(() => window.location.reload(), 1500)
    }

    setIsCreating(false)
    setSelectedType(null)
  }

  const handleApprove = async (campaignId: string) => {
    const result = await approveCampaign(campaignId, projectId)

    if (result.error) {
      setError(result.error)
    } else {
      setTimeout(() => window.location.reload(), 500)
    }
  }

  const handleSaveEdit = async (campaignId: string) => {
    const result = await updateCampaignContent(campaignId, editContent, projectId)

    if (result.error) {
      setError(result.error)
    } else {
      setEditingId(null)
      setTimeout(() => window.location.reload(), 500)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Content copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const campaignTypes = [
    { id: 'twitter', name: 'Twitter Thread', icon: '🐦' },
    { id: 'email', name: 'Email Campaign', icon: '📧' },
    { id: 'meta', name: 'Meta Ad', icon: '📘' }
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Generator</CardTitle>
          <CardDescription>
            AI-generated marketing campaigns for different platforms. Copy and manually post as scheduled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          {!selectedType && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {campaignTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setSelectedType(type.id)}
                  disabled={isCreating}
                >
                  <span className="text-3xl">{type.icon}</span>
                  <span className="text-sm">{type.name}</span>
                </Button>
              ))}
            </div>
          )}

          {selectedType && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedType(null)}>
                  ← Back
                </Button>
                <p className="text-sm text-muted-foreground">
                  Generate {campaignTypes.find(t => t.id === selectedType)?.name}
                </p>
              </div>
              <Button onClick={() => handleCreate(selectedType)} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Campaign
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {campaigns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Campaigns</h3>
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg capitalize">{campaign.type} Campaign</CardTitle>
                    <CardDescription>
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={campaign.approval_status === 'approved' ? 'default' : 'secondary'}>
                      {campaign.approval_status}
                    </Badge>
                    <Badge variant="outline">{campaign.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === campaign.id ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{campaign.content}</pre>
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId === campaign.id ? (
                    <>
                      <Button size="sm" onClick={() => handleSaveEdit(campaign.id)}>
                        Save Changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingId(campaign.id)
                          setEditContent(campaign.content)
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(campaign.content)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      {campaign.approval_status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(campaign.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

