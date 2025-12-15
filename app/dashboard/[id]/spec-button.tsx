'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function GenerateSpecButton({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const generateSpec = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/agents/product-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Failed to generate spec')
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
    <Button size="lg" onClick={generateSpec} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Drafting Product Spec...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Generate Product Spec
        </>
      )}
    </Button>
  )
}





