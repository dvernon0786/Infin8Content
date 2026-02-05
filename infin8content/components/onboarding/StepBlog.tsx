"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StepBlogProps {
  className?: string
  onNext?: (data: BlogData) => void
  onSkip?: () => void
}

interface BlogData {
  blog_root?: string
  sitemap_url?: string
  reference_posts?: string[]
}

export function StepBlog({ className, onNext, onSkip }: StepBlogProps) {
  const [formData, setFormData] = useState<BlogData>({
    blog_root: "",
    sitemap_url: "",
    reference_posts: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.blog_root) {
      newErrors.blog_root = "Blog root URL is required"
    } else if (!validateUrl(formData.blog_root)) {
      newErrors.blog_root = "Please enter a valid URL"
    }

    if (formData.sitemap_url && !validateUrl(formData.sitemap_url)) {
      newErrors.sitemap_url = "Please enter a valid sitemap URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof BlogData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleReferencePostsChange = (value: string) => {
    const posts = value.split('\n').map(p => p.trim()).filter(Boolean)
    handleInputChange('reference_posts', posts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onNext?.(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  const isFormValid = formData.blog_root && validateUrl(formData.blog_root)

  return (
    <main className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Blog Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informational Context Box */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h3 className="font-medium mb-2">Set up your blog foundation</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Configure your blog settings to help us generate content that matches your existing style and structure.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Blog root URL helps us understand your content structure</li>
              <li>• Sitemap enables comprehensive content analysis</li>
              <li>• Reference posts guide content style and tone</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Blog Root URL */}
            <div className="space-y-2">
              <label htmlFor="blog_root" className="text-sm font-medium">
                Blog Root URL <span className="text-destructive">*</span>
              </label>
              <Input
                id="blog_root"
                type="url"
                placeholder="https://example.com/blog"
                value={formData.blog_root}
                onChange={(e) => handleInputChange('blog_root', e.target.value)}
                className={cn(errors.blog_root && "border-destructive")}
                aria-describedby={errors.blog_root ? "blog_root-error" : undefined}
              />
              {errors.blog_root && (
                <p id="blog_root-error" className="text-sm text-destructive" role="alert">
                  {errors.blog_root}
                </p>
              )}
            </div>

            {/* Sitemap URL */}
            <div className="space-y-2">
              <label htmlFor="sitemap_url" className="text-sm font-medium">
                Sitemap URL (Optional)
              </label>
              <Input
                id="sitemap_url"
                type="url"
                placeholder="https://example.com/sitemap.xml"
                value={formData.sitemap_url}
                onChange={(e) => handleInputChange('sitemap_url', e.target.value)}
                className={cn(errors.sitemap_url && "border-destructive")}
                aria-describedby={errors.sitemap_url ? "sitemap_url-error" : undefined}
              />
              {errors.sitemap_url && (
                <p id="sitemap_url-error" className="text-sm text-destructive" role="alert">
                  {errors.sitemap_url}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Helps us analyze your existing content structure
              </p>
            </div>

            {/* Reference Posts */}
            <div className="space-y-2">
              <label htmlFor="reference_posts" className="text-sm font-medium">
                Reference Posts (Optional)
              </label>
              <textarea
                id="reference_posts"
                rows={4}
                placeholder="https://example.com/blog/post-1&#10;https://example.com/blog/post-2&#10;https://example.com/blog/post-3"
                onChange={(e) => handleReferencePostsChange(e.target.value)}
                className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Add URLs of your best content (one per line) to guide content style
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={!isFormValid || isSubmitting}
                loading={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Saving..." : "Next Step"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial"
              >
                Skip & Add Later
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
