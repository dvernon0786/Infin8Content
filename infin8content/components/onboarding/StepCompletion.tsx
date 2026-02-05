"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StepCompletionProps {
  className?: string
  onStart?: () => void
}

export function StepCompletion({ className, onStart }: StepCompletionProps) {
  return (
    <main className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Setup Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Your organization is ready to start generating amazing content.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 border">
              <h3 className="font-medium mb-3">What's next?</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Explore your dashboard and create your first content workflow</li>
                <li>• Set up your keyword research and content generation preferences</li>
                <li>• Start generating SEO-optimized articles for your blog</li>
                <li>• Track performance and refine your content strategy</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="primary"
              size="default"
              onClick={onStart}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              size="default"
              className="flex-1 sm:flex-initial"
            >
              View Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
