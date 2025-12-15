import { login, signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">LaunchIt</CardTitle>
          <CardDescription>
            Enter your email below to login or create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            
            {searchParams.message && (
              <div className="text-green-500 text-sm p-2 bg-green-50 rounded">
                {searchParams.message}
              </div>
            )}
            
            {searchParams.error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                {searchParams.error}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button formAction={login} className="w-full">Log in</Button>
              <Button formAction={signup} variant="outline" className="w-full">Sign up</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

