"use client"

import { IntegrationsManager } from "@/components/settings/IntegrationsManager"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function IntegrationsSettingsPage() {
    return (
        <div className="flex flex-col gap-8 max-w-4xl">
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/settings" className="w-fit">
                    <Button variant="ghost" size="sm" className="pl-0 text-neutral-500 hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Settings
                    </Button>
                </Link>

                <IntegrationsManager />
            </div>

            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                <h3 className="font-poppins font-semibold text-neutral-900 mb-2">How Integrations Work</h3>
                <p className="font-lato text-neutral-600 text-sm leading-relaxed mb-4">
                    Once connected, Infin8Content can automatically publish generated articles to your WordPress site as drafts or live posts.
                    We use WordPress Application Passwords to ensure a secure, limited-access connection.
                </p>
                <div className="flex flex-col gap-2">
                    <h4 className="font-poppins font-medium text-neutral-900 text-sm">Security Best Practices:</h4>
                    <ul className="list-disc list-inside font-lato text-neutral-600 text-sm space-y-1">
                        <li>Create a dedicated WordPress user for Infin8Content</li>
                        <li>Use <strong>Application Passwords</strong>, not your main account password</li>
                        <li>Revoke the application password at any time from your WordPress profile</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
