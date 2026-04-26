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
import "./onboarding-steps.css"

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
      image_style: "brand_text_realism",
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
    <main className={cn("onboarding-step-container", className)}>
      <div className="onboarding-step-card">
        <h2 className="onboarding-step-title">Content Defaults</h2>

        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Language */}
            <div className="space-y-2">
              <label className="onboarding-label">Language</label>
              <select
                value={formData.content_defaults.language}
                onChange={(e) =>
                  updateField("language", e.target.value)
                }
                className="onboarding-select"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--onboarding-text-light, #e8eaf2)"
              }}>Tone</label>
              <select
                value={formData.content_defaults.tone}
                onChange={(e) =>
                  updateField("tone", e.target.value)
                }
                className="onboarding-select"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--onboarding-text-light, #e8eaf2)"
              }}>Style</label>
              <select
                value={formData.content_defaults.style}
                onChange={(e) =>
                  updateField("style", e.target.value)
                }
                className="onboarding-select"
              >
                <option value="informative">Informative</option>
                <option value="educational">Educational</option>
                <option value="persuasive">Persuasive</option>
              </select>
            </div>

            {/* Target Word Count */}
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--onboarding-text-light, #e8eaf2)"
              }}>
                Target Word Count
              </label>
              <input
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
                className="onboarding-select"
              />
            </div>

            {/* Auto Publish */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <input
                type="checkbox"
                checked={formData.content_defaults.auto_publish}
                onChange={(e) =>
                  updateField("auto_publish", e.target.checked)
                }
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--brand-electric-blue, #217CEB)",
                  cursor: "pointer"
                }}
              />
              <label style={{
                fontSize: "13px",
                color: "var(--onboarding-text-secondary, #7b8098)",
                cursor: "pointer"
              }}>
                Auto-publish after generation
              </label>
            </div>

            <hr style={{
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              margin: "24px 0"
            }} />
            <h3 style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--onboarding-text-primary, #ffffff)",
              marginBottom: "16px"
            }}>Content Generation Settings</h3>

            {/* Brand Color */}
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--onboarding-text-light, #e8eaf2)"
              }}>Brand Color (Hex Code)</label>
              <div style={{
                display: "flex",
                gap: "8px"
              }}>
                <input
                  type="color"
                  value={formData.content_defaults.brand_color}
                  onChange={(e) => updateField("brand_color", e.target.value)}
                  style={{
                    width: "48px",
                    height: "40px",
                    padding: "4px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer"
                  }}
                />
                <input
                  type="text"
                  placeholder={"#" + "000000"}
                  value={formData.content_defaults.brand_color}
                  onChange={(e) => updateField("brand_color", e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "var(--onboarding-input-bg, #13151e)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "8px",
                    color: "var(--onboarding-text-light, #e8eaf2)",
                    fontSize: "14px",
                    outline: "none"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(79,110,247,0.3)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                />
              </div>
            </div>

            {/* Image Style */}
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--onboarding-text-light, #e8eaf2)"
              }}>Image Style</label>
              <select
                value={formData.content_defaults.image_style}
                onChange={(e) => updateField("image_style", e.target.value)}
                className="onboarding-select"
              >
                <option value="brand_text_realism">Brand &amp; Text Realism</option>
                <option value="watercolor_realism">Watercolor Realism</option>
                <option value="cinematic_realism">Cinematic Realism</option>
                <option value="illustration">Illustration</option>
                <option value="sketch">Sketch</option>
              </select>
            </div>

            {/* Internal Links Count */}
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--onboarding-text-light, #e8eaf2)"
              }}>Max Internal Links</label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.content_defaults.num_internal_links}
                onChange={(e) => updateField("num_internal_links", Number(e.target.value))}
                className="onboarding-select"
              />
            </div>

            {/* Feature Toggles */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              paddingTop: "8px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <input
                  type="checkbox"
                  checked={formData.content_defaults.internal_links}
                  onChange={(e) => updateField("internal_links", e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--brand-electric-blue, #217CEB)",
                    cursor: "pointer"
                  }}
                />
                <label style={{
                  fontSize: "13px",
                  color: "var(--onboarding-text-secondary, #7b8098)",
                  cursor: "pointer"
                }}>Include Internal Links</label>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_cta}
                  onChange={(e) => updateField("add_cta", e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--brand-electric-blue, #217CEB)",
                    cursor: "pointer"
                  }}
                />
                <label style={{
                  fontSize: "13px",
                  color: "var(--onboarding-text-secondary, #7b8098)",
                  cursor: "pointer"
                }}>Add CTA Sections</label>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_youtube_video}
                  onChange={(e) => updateField("add_youtube_video", e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--brand-electric-blue, #217CEB)",
                    cursor: "pointer"
                  }}
                />
                <label style={{
                  fontSize: "13px",
                  color: "var(--onboarding-text-secondary, #7b8098)",
                  cursor: "pointer"
                }}>Embed YouTube Videos</label>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_infographics}
                  onChange={(e) => updateField("add_infographics", e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--brand-electric-blue, #217CEB)",
                    cursor: "pointer"
                  }}
                />
                <label style={{
                  fontSize: "13px",
                  color: "var(--onboarding-text-secondary, #7b8098)",
                  cursor: "pointer"
                }}>Add Infographics</label>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <input
                  type="checkbox"
                  checked={formData.content_defaults.add_emojis}
                  onChange={(e) => updateField("add_emojis", e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--brand-electric-blue, #217CEB)",
                    cursor: "pointer"
                  }}
                />
                <label style={{
                  fontSize: "13px",
                  color: "var(--onboarding-text-secondary, #7b8098)",
                  cursor: "pointer"
                }}>Use Emojis</label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn("onboarding-button onboarding-button-primary", "w-full")}
            >
              {isSubmitting ? "Saving…" : "Save & Continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
