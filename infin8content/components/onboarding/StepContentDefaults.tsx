"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/hooks/use-current-user"

interface StepContentDefaultsProps {
  className?: string
  onNext: (state: any) => void
}

type ContentDefaultsPayload = {
  content_defaults: {
    language: string
    tone: string
    style: string
    target_word_count: number
    auto_publish: boolean
    brand_color: string
    image_style: string
    add_youtube_video: boolean
    add_cta: boolean
    add_infographics: boolean
    add_emojis: boolean
    internal_links: boolean
    num_internal_links: number
  }
}

export function StepContentDefaults({
  className,
  onNext,
}: StepContentDefaultsProps) {
  const { user } = useCurrentUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<ContentDefaultsPayload>({
    content_defaults: {
      language: "english",
      tone: "professional",
      style: "informative",
      target_word_count: 1500,
      auto_publish: false,
      brand_color: "#" + "000000",
      image_style: "realistic",
      add_youtube_video: false,
      add_cta: false,
      add_infographics: false,
      add_emojis: false,
      internal_links: true,
      num_internal_links: 3,
    },
  })

  function updateField<
    K extends keyof ContentDefaultsPayload["content_defaults"]
  >(key: K, value: ContentDefaultsPayload["content_defaults"][K]) {
    setFormData((prev) => ({
      content_defaults: {
        ...prev.content_defaults,
        [key]: value,
      },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.org_id) {
      console.error("[StepContentDefaults] Missing org context")
      return
    }

    setIsSubmitting(true)

    try {
      // 1️⃣ Persist only provided data
      const persistRes = await fetch("/api/onboarding/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!persistRes.ok) {
        throw new Error("Failed to persist content defaults")
      }

      // 2️⃣ Observe canonical truth
      if (!user?.org_id) {
        throw new Error('User not authenticated or missing organization')
      }

      const observeRes = await fetch("/api/onboarding/observe", {
        method: 'GET',
      })

      if (!observeRes.ok) {
        throw new Error("Failed to observe onboarding state")
      }

      const state = await observeRes.json()

      // 3️⃣ Bubble up canonical state (never raw form data)
      onNext(state)
    } catch (err) {
      console.error("[StepContentDefaults] Submission error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={cn("mx-auto w-full max-w-2xl", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Content Defaults</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                value={formData.content_defaults.language}
                onChange={(e) =>
                  updateField("language", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <select
                value={formData.content_defaults.tone}
                onChange={(e) =>
                  updateField("tone", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <select
                value={formData.content_defaults.style}
                onChange={(e) =>
                  updateField("style", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="informative">Informative</option>
                <option value="educational">Educational</option>
                <option value="persuasive">Persuasive</option>
              </select>
            </div>

            {/* Target Word Count */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Target Word Count
              </label>
              <Input
                type="number"
                min={500}
                max={10000}
                value={formData.content_defaults.target_word_count}
                onChange={(e) =>
                  updateField(
                    "target_word_count",
                    Number(e.target.value) || 1500
                  )
                }
              />
            </div>

            {/* Auto Publish */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.content_defaults.auto_publish}
                onChange={(e) =>
                  updateField("auto_publish", e.target.checked)
                }
              />
              <label className="text-sm">
                Auto-publish after generation
              </label>
            </div>

            <hr className="my-6" />
            <h3 className="text-lg font-semibold mb-4">Content Generation Settings</h3>

            {/* Brand Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Color (Hex Code)</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.content_defaults.brand_color}
                  onChange={(e) => updateField("brand_color", e.target.value)}
                  className="w-12 h-10 p-1 rounded-md"
                />
                <Input
                  type="text"
                  placeholder={"#" + "000000"}
                  value={formData.content_defaults.brand_color}
                  onChange={(e) => updateField("brand_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Image Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image Style</label>
              <select
                value={formData.content_defaults.image_style}
                onChange={(e) => updateField("image_style", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="realistic">Realistic</option>
                <option value="illustrated">Illustrated</option>
                <option value="minimalist">Minimalist</option>
                <option value="abstract">Abstract</option>
              </select>
            </div>

            {/* Internal Links Count */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Internal Links</label>
              <Input
                type="number"
                min={0}
                max={10}
                value={formData.content_defaults.num_internal_links}
                onChange={(e) => updateField("num_internal_links", Number(e.target.value))}
              />
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.content_defaults.internal_links}
                  onChange={(e) => updateField("internal_links", e.target.checked)}
                />
                <label className="text-sm text-neutral-600">Include Internal Links</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_cta}
                  onChange={(e) => updateField("add_cta", e.target.checked)}
                />
                <label className="text-sm text-neutral-600">Add CTA Sections</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_youtube_video}
                  onChange={(e) => updateField("add_youtube_video", e.target.checked)}
                />
                <label className="text-sm text-neutral-600">Embed YouTube Videos</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_infographics}
                  onChange={(e) => updateField("add_infographics", e.target.checked)}
                />
                <label className="text-sm text-neutral-600">Add Infographics</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_emojis}
                  onChange={(e) => updateField("add_emojis", e.target.checked)}
                />
                <label className="text-sm text-neutral-600">Use Emojis</label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Saving…" : "Save & Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
