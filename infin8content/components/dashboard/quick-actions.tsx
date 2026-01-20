"use client"

import { redirect } from "next/navigation"

export const QuickActions = () => {
  return (
    <div className="space-y-2">
      <button
        onClick={() => redirect("/dashboard/articles/generate")}
        className="text-sm text-primary hover:underline"
      >
        Create new article
      </button>

      <button
        onClick={() => redirect("/dashboard/track")}
        className="text-sm text-primary hover:underline"
      >
        View analytics
      </button>

      <button
        onClick={() => redirect("/dashboard/settings")}
        className="text-sm text-primary hover:underline"
      >
        Manage settings
      </button>
    </div>
  )
}
