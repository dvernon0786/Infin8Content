'use client'

// Epic 12: Stories 12-3, 12-10, 12-11 — Help Drawer
// Sheet-based drawer with Help, FAQ, and Tutorials tabs.
// All content sourced from lib/config/help-content.ts

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { useState } from 'react'
import {
  HELP_LINKS,
  FAQ_ITEMS,
  TUTORIAL_VIDEOS,
  SUPPORT_EMAIL,
} from '@/lib/config/help-content'

type Tab = 'help' | 'faq' | 'tutorials'

interface HelpDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between py-3 text-left font-lato text-sm text-neutral-800 hover:text-neutral-900 transition-colors"
        aria-expanded={expanded}
      >
        <span>{question}</span>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0 ml-2" />
          : <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0 ml-2" />}
      </button>
      {expanded && (
        <p className="pb-3 font-lato text-sm text-neutral-600 leading-relaxed">{answer}</p>
      )}
    </div>
  )
}

export function HelpDrawer({ open, onOpenChange }: HelpDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('help')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'help', label: 'Help' },
    { key: 'faq', label: 'FAQ' },
    { key: 'tutorials', label: 'Tutorials' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="font-poppins text-lg">Help & Resources</SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 px-5 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 mr-5 text-sm font-lato font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[--brand-electric-blue] text-[--brand-electric-blue]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'help' && (
            <div className="space-y-3">
              <p className="font-lato text-sm text-neutral-500">Browse our guides or reach out to support.</p>
              <div className="space-y-2">
                {HELP_LINKS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:border-[--brand-electric-blue]/30 hover:bg-[--brand-electric-blue]/5 transition-colors group"
                  >
                    <span className="font-lato text-sm text-neutral-700 group-hover:text-[--brand-electric-blue]">
                      {link.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-[--brand-electric-blue]" />
                  </a>
                ))}
              </div>
              <Separator />
              <p className="font-lato text-sm text-neutral-500">
                Still stuck?{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-[--brand-electric-blue] underline"
                >
                  Contact support
                </a>
              </p>
            </div>
          )}

          {activeTab === 'faq' && (
            <div>
              {FAQ_ITEMS.map((item) => (
                <FaqAccordionItem key={item.question} {...item} />
              ))}
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div className="space-y-5">
              {TUTORIAL_VIDEOS.map((video) => (
                <div key={video.title} className="rounded-xl overflow-hidden border border-neutral-100">
                  <div className="relative bg-neutral-900 aspect-video">
                    <iframe
                      src={video.embedUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-white">
                    <p className="font-lato text-sm font-medium text-neutral-800">{video.title}</p>
                    <span className="font-lato text-xs text-neutral-400 flex items-center gap-1">
                      <Play className="h-3 w-3" /> {video.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
