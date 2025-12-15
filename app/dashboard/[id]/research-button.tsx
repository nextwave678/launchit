'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Bot, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function StartResearchButton({ projectId, niche }: { projectId: string, niche: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const startResearch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/agents/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, niche }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to start research')
        return
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button size="lg" onClick={startResearch} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing Market...
        </>
      ) : (
        <>
          <Bot className="mr-2 h-4 w-4" />
          Start Research Agent
        </>
      )}
    </Button>
  )
}






