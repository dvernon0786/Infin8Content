import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-poppins text-neutral-900 text-h2-desktop">Settings</h1>
          <p className="font-lato text-neutral-600 text-body">
            Manage your account and organization settings
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">Organization</CardTitle>
              <CardDescription className="font-lato text-neutral-600 text-body">
                Manage your organization details and team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                asChild 
                variant="outline"
                className="font-lato text-neutral-600 hover:text-primary border-neutral-200"
              >
                <Link href="/settings/organization">Manage Organization</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">Billing</CardTitle>
              <CardDescription className="font-lato text-neutral-600 text-body">
                View and manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                asChild 
                variant="outline"
                className="font-lato text-neutral-600 hover:text-primary border-neutral-200"
              >
                <Link href="/payment">Manage Billing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">Team</CardTitle>
              <CardDescription className="font-lato text-neutral-600 text-body">
                Manage team members and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                asChild 
                variant="outline"
                className="font-lato text-neutral-600 hover:text-primary border-neutral-200"
              >
                <Link href="/settings/team">Manage Team</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">Profile</CardTitle>
              <CardDescription className="font-lato text-neutral-600 text-body">
                Coming soon - Profile management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-lato text-neutral-600 text-small">
                Profile settings will be available soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

