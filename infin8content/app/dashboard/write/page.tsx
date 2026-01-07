import { redirect } from "next/navigation"

export default function WritePage() {
  // Redirect to article generation page (Story 4a-1: Primary entry point)
  redirect("/dashboard/articles/generate")
}

