import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
        <Link href="/dashboard/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-lg p-12 text-center h-[400px]">
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Start by creating your first startup idea. Our AI agents will help you research, build, and launch.
          </p>
          <Link href="/dashboard/new">
            <Button>Create Project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/dashboard/${project.id}`} key={project.id}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.niche}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Status: <span className="capitalize font-medium text-foreground">{project.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Type: <span className="capitalize">{project.business_type.replace('_', ' ')}</span>
                  </div>
                </CardContent>
                <CardFooter className="text-blue-600 text-sm font-medium">
                  View Project <ArrowRight className="ml-2 h-4 w-4" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
