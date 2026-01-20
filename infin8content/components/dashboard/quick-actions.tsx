"use client"

import { redirect } from "next/navigation"

export const QuickActions = () => {
  return (
    <div className="space-y-2">
      <button
        onClick={() => redirect("/dashboard/articles/generate")}
        className="font-lato text-body text-neutral-600 hover:text-[--brand-electric-blue] transition-colors"
      >
        Create new article
      </button>

      <button
        onClick={() => redirect("/dashboard/track")}
        className="font-lato text-body text-neutral-600 hover:text-[--brand-electric-blue] transition-colors"
      >
        View analytics
      </button>

      <button
        onClick={() => redirect("/dashboard/settings")}
        className="font-lato text-body text-neutral-600 hover:text-[--brand-electric-blue] transition-colors"
      >
        Manage settings
      </button>
    </div>
  )
}
