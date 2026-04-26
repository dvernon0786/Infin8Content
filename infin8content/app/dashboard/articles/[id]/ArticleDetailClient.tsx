"use client"

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Edit2, Heading2, Heading3,
  List, ListOrdered, Link2, Image as ImageIcon,
  Strikethrough, AlignLeft, Undo2, Redo2,
  X, Plus, Loader2, CheckCircle2, Info, Sparkles, Upload,
} from 'lucide-react'
import { PublishToCmsButton } from '@/components/articles/PublishToCmsButton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedArticle {
  id: string
  title: string | null
  keyword: string
  status: string
  org_id: string
  slug: string | null
  workflow_state: Record<string, any> | null
  cover_image_url: string | null
}

export interface SerializedSection {
  id: string
  article_id: string
  section_order: number
  section_header: string
  section_type: string
  content_markdown: string | null
  content_html: string | null
  status: string
  section_image_url: string | null
}

interface Props {
  initialArticle: SerializedArticle
  initialSections: SerializedSection[]
}

type ViewMode = 'original' | 'revision'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type SidebarTab = 'details' | 'ai_assistant'

// ─── Debounce ─────────────────────────────────────────────────────────────────

function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T & { cancel: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  ) as T & { cancel: () => void }
  debounced.cancel = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }
  return debounced
}

// ─── Section type config ──────────────────────────────────────────────────────

const SECTION_CONFIG: Record<string, { labelTag: string; headerClass: string; containerClass: string }> = {
  introduction: {
    labelTag: '',
    headerClass: 'font-poppins text-h2-desktop font-bold text-neutral-900 leading-tight',
    containerClass: 'pb-10 mb-10 border-b border-neutral-200',
  },
  h2: {
    labelTag: 'h2',
    headerClass: 'font-poppins text-h3-desktop font-semibold text-neutral-900 leading-snug',
    containerClass: 'py-8',
  },
  h3: {
    labelTag: 'h3',
    headerClass: 'font-poppins text-h3-mobile font-semibold text-neutral-800 leading-snug',
    containerClass: 'py-6',
  },
  section: {
    labelTag: 'h2',
    headerClass: 'font-poppins text-h3-desktop font-semibold text-neutral-900 leading-snug',
    containerClass: 'py-8',
  },
  conclusion: {
    labelTag: 'h2',
    headerClass: 'font-poppins text-h3-desktop font-semibold text-neutral-900 leading-snug',
    containerClass: 'pt-10 mt-10 border-t border-neutral-200',
  },
  faq: {
    labelTag: 'h2',
    headerClass: 'font-poppins text-h3-desktop font-semibold text-neutral-900 leading-snug',
    containerClass: 'py-8',
  },
}

// ─── Read-only section ────────────────────────────────────────────────────────

function ReadOnlySection({ section }: { section: SerializedSection }) {
  const config = SECTION_CONFIG[section.section_type] ?? SECTION_CONFIG.h2

  return (
    <div className={config.containerClass}>
      {config.labelTag && (
        <span className="inline-block text-[11px] font-lato font-bold text-neutral-400 uppercase tracking-widest mb-3 select-none">
          {config.labelTag}
        </span>
      )}
      {section.section_header && (
        <div className={`${config.headerClass} mb-5`}>{section.section_header}</div>
      )}
      {section.section_image_url && (
        <div className="mb-6">
          <img
            src={section.section_image_url}
            alt=""
            className="w-full rounded-lg"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
        </div>
      )}
      <div
        className="font-lato text-neutral-700 leading-relaxed text-[1.0625rem]"
        dangerouslySetInnerHTML={{
          __html: section.content_html || section.content_markdown?.replace(/\n/g, '<br>') || '',
        }}
      />
    </div>
  )
}

// ─── Editable section ─────────────────────────────────────────────────────────

function EditableSection({
  section,
  onContentChange,
  onHeaderChange,
}: {
  section: SerializedSection
  onContentChange: (id: string, html: string) => void
  onHeaderChange: (id: string, header: string) => void
}) {
  const config = SECTION_CONFIG[section.section_type] ?? SECTION_CONFIG.h2
  const contentRef = useRef<HTMLDivElement>(null)

  // Set inner HTML once on mount only — do not overwrite on re-render
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML =
        section.content_html || section.content_markdown?.replace(/\n/g, '<br>') || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`${config.containerClass} group relative`}>
      {config.labelTag && (
        <span className="inline-block text-[11px] font-lato font-bold text-neutral-400 uppercase tracking-widest mb-3 select-none">
          {config.labelTag}
        </span>
      )}

      {/* Editable header */}
      {section.section_header && (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onHeaderChange(section.id, e.currentTarget.textContent || '')}
          className={`${config.headerClass} mb-5 outline-none rounded px-1 -mx-1 focus:bg-blue-50/40 transition-colors cursor-text`}
        >
          {section.section_header}
        </div>
      )}

      {section.section_image_url && (
        <div className="mb-6">
          <img
            src={section.section_image_url}
            alt=""
            className="w-full rounded-lg"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
        </div>
      )}

      {/* Editable body */}
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onContentChange(section.id, e.currentTarget.innerHTML)}
        className="font-lato text-neutral-700 leading-relaxed text-[1.0625rem] outline-none min-h-12 cursor-text rounded px-1 -mx-1 focus:bg-blue-50/20 transition-colors"
      />
    </div>
  )
}

// ─── Inline dark toolbar ──────────────────────────────────────────────────────

function InlineToolbar() {
  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val)

  const Btn = ({
    title, onClick, children,
  }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="w-8 h-8 flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 bg-neutral-900 rounded-xl px-3 py-2 shadow-xl mb-6">
      <Btn title="Heading 2" onClick={() => exec('formatBlock', 'h2')}>
        <Heading2 className="w-4 h-4" />
      </Btn>
      <Btn title="Heading 3" onClick={() => exec('formatBlock', 'h3')}>
        <Heading3 className="w-4 h-4" />
      </Btn>

      <div className="w-px h-5 bg-white/10 mx-1" />

      <button
        title="Bold"
        onMouseDown={(e) => { e.preventDefault(); exec('bold') }}
        className="w-8 h-8 flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-white/10 font-bold text-sm transition-colors"
      >
        B
      </button>
      <button
        title="Italic"
        onMouseDown={(e) => { e.preventDefault(); exec('italic') }}
        className="w-8 h-8 flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-white/10 italic text-sm font-serif transition-colors"
      >
        I
      </button>

      <div className="w-px h-5 bg-white/10 mx-1" />

      <Btn title="Bullet list" onClick={() => exec('insertUnorderedList')}>
        <List className="w-4 h-4" />
      </Btn>
      <Btn title="Numbered list" onClick={() => exec('insertOrderedList')}>
        <ListOrdered className="w-4 h-4" />
      </Btn>

      <div className="w-px h-5 bg-white/10 mx-1" />

      <Btn
        title="Insert link"
        onClick={() => {
          const url = window.prompt('Link URL:')
          if (url) exec('createLink', url)
        }}
      >
        <Link2 className="w-4 h-4" />
      </Btn>
      <Btn title="Strikethrough" onClick={() => exec('strikeThrough')}>
        <Strikethrough className="w-4 h-4" />
      </Btn>
      <Btn
        title="Insert image"
        onClick={() => {
          const url = window.prompt('Image URL:')
          if (url) exec('insertImage', url)
        }}
      >
        <ImageIcon className="w-4 h-4" />
      </Btn>
      <Btn title="Justify" onClick={() => exec('justifyFull')}>
        <AlignLeft className="w-4 h-4" />
      </Btn>

      <div className="flex-1" />

      <Btn title="Undo" onClick={() => exec('undo')}>
        <Undo2 className="w-4 h-4" />
      </Btn>
      <Btn title="Redo" onClick={() => exec('redo')}>
        <Redo2 className="w-4 h-4" />
      </Btn>
    </div>
  )
}

// ─── Table of contents ───────────────────────────────────────────────────────

function TableOfContents({ sections }: { sections: SerializedSection[] }) {
  const [open, setOpen] = useState(true)
  const headings = sections.filter((s) => s.section_header && s.section_type !== 'introduction')

  return (
    <div className="border border-neutral-200 rounded-lg mb-8 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-lato font-semibold text-sm text-neutral-700">Table of Contents</span>
          <span className="text-[10px] font-semibold font-lato text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            Auto-generated
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${open ? '' : '-rotate-90'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && headings.length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          {headings.map((s, i) => (
            <div key={s.id} className="flex items-start gap-2">
              <span className="text-xs font-lato text-neutral-400 mt-0.5 select-none">
                {s.section_type === 'h3' ? '  ·' : `${i + 1}.`}
              </span>
              <span
                className={`text-sm font-lato text-neutral-600 hover:text-blue-600 cursor-pointer transition-colors ${
                  s.section_type === 'h3' ? 'pl-2' : ''
                }`}
              >
                {s.section_header}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Featured image panel — falls back to cover_image_url ────────────────────

function FeaturedImagePanel({
  url,
  alt,
  coverFallback,
  onChange,
}: {
  url: string
  alt: string
  coverFallback?: string | null
  onChange: (url: string, alt: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draftUrl, setDraftUrl] = useState(url)
  const [draftAlt, setDraftAlt] = useState(alt)

  // Display the user-set URL first; fall back to AI-generated cover
  const displayUrl = url || coverFallback || ''
  const isAutoFromCover = !url && !!coverFallback

  if (!displayUrl && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full h-28 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
      >
        <Upload className="w-5 h-5" />
        <span className="text-xs font-lato">Add featured image</span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {displayUrl && !editing && (
        <div className="relative group">
          <img src={displayUrl} alt={alt} className="w-full rounded-lg border border-neutral-200 object-cover max-h-44" />
          {alt && (
            <div className="absolute bottom-2 left-2">
              <span className="text-[10px] font-lato font-bold bg-neutral-900/80 text-white px-2 py-0.5 rounded">
                ALT {alt}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => { setDraftUrl(url); setDraftAlt(alt); setEditing(true) }}
              className="px-3 py-1.5 bg-white rounded-md text-xs font-semibold text-neutral-900"
            >
              Change
            </button>
            {!isAutoFromCover && (
              <button onClick={() => onChange('', '')} className="p-1.5 bg-white/20 rounded-md">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {isAutoFromCover && !editing && (
        <p className="text-[10px] font-lato text-neutral-400">
          Auto-populated from article cover. Set a custom image to override.
        </p>
      )}

      {editing && (
        <div className="border border-neutral-200 rounded-lg p-3 space-y-2 bg-neutral-50">
          <input
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="Image URL"
            className="w-full text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="text"
            value={draftAlt}
            onChange={(e) => setDraftAlt(e.target.value)}
            placeholder="Alt text description"
            className="w-full text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onChange(draftUrl, draftAlt); setEditing(false) }}
              className="flex-1 py-1.5 text-xs font-semibold font-lato text-white rounded-md bg-linear-to-r from-[#217CEB] to-[#4A42CC] hover:opacity-95"
            >
              Save Image
            </button>
            <button onClick={() => setEditing(false)} className="px-3 text-xs font-lato text-neutral-500 hover:text-neutral-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tag input — fetches org suggestions from /api/tags ──────────────────────

function TagInput({
  tags,
  onChange,
  onNewTag,
}: {
  tags: string[]
  onChange: (t: string[]) => void
  onNewTag?: (name: string) => void
}) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const fetchController = useRef<AbortController | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (fetchController.current) fetchController.current.abort()
    fetchController.current = new AbortController()
    setLoadingSuggestions(true)
    try {
      const res = await fetch(
        `/api/tags${q ? `?q=${encodeURIComponent(q)}` : ''}`,
        { signal: fetchController.current.signal }
      )
      if (!res.ok) return
      const data = await res.json()
      setSuggestions((data.tags as string[]).filter((t) => !tags.includes(t)))
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.warn('[TagInput] fetch failed:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [tags])

  // Load all org tags on mount
  useEffect(() => { fetchSuggestions('') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addTag = (value: string) => {
    const t = value.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setSuggestions((prev) => prev.filter((s) => s !== t))
    setDropdownOpen(false)
  }

  const createTag = () => {
    const t = input.trim().toLowerCase()
    if (!t || tags.includes(t)) { setInput(''); return }
    onChange([...tags, t])
    onNewTag?.(t)
    setInput('')
    setSuggestions((prev) => prev.filter((s) => s !== t))
  }

  const available = suggestions.filter((s) => !tags.includes(s))

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs font-lato rounded-md border border-neutral-200"
            >
              {tag}
              <button onClick={() => { onChange(tags.filter((t) => t !== tag)); setSuggestions((prev) => [...prev, tag].sort()) }}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5" ref={dropdownRef}>
        {/* Select from org tags */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => { setDropdownOpen((o) => !o); if (!dropdownOpen) fetchSuggestions('') }}
            className="w-full text-left text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-neutral-500 flex items-center justify-between"
          >
            <span className="truncate">{loadingSuggestions ? 'Loading…' : 'Select a tag…'}</span>
            <Plus className="w-3 h-3 text-neutral-400 shrink-0" />
          </button>
          {dropdownOpen && available.length > 0 && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-neutral-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {available.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-lato text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create new tag */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); createTag() }
          }}
          placeholder="Create new tag"
          className="flex-1 text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-neutral-400"
        />
        {input.trim() && (
          <button
            type="button"
            onClick={createTag}
            className="px-2 py-1.5 text-xs font-semibold font-lato text-white rounded-md bg-blue-500 hover:bg-blue-600"
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Save indicator pill ──────────────────────────────────────────────────────

function SavePill({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  return (
    <div className={`flex items-center gap-1.5 text-xs font-lato font-medium px-3 py-1 rounded-full transition-all ${
      status === 'saving' ? 'text-neutral-500 bg-neutral-100' :
      status === 'saved'  ? 'text-green-600 bg-green-50' :
                            'text-red-600 bg-red-50'
    }`}>
      {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'saved'  && <CheckCircle2 className="w-3 h-3" />}
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error saving'}
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export default function ArticleDetailClient({ initialArticle, initialSections }: Props) {
  const supabase = createClient()

  const [article]   = useState<SerializedArticle>(initialArticle)
  const [sections, setSections] = useState<SerializedSection[]>(initialSections)
  const [viewMode, setViewMode]   = useState<ViewMode>('original')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('details')
  const [showPublishModal, setShowPublishModal] = useState(false)

  // Sidebar meta — initialise from workflow_state
  const ws = initialArticle.workflow_state || {}
  const [tags, setTags]                     = useState<string[]>(ws.tags || [])
  const [focusKeyword, setFocusKeyword]     = useState<string>(ws.focus_keyword || initialArticle.keyword || '')
  const [metaDescription, setMetaDescription] = useState<string>(ws.meta_description || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>(ws.featured_image_url || '')
  const [featuredImageAlt, setFeaturedImageAlt] = useState<string>(ws.featured_image_alt || '')

  // Track whether meta description was AI-generated (show badge until user edits it)
  const [metaIsAI, setMetaIsAI] = useState(
    !!(ws.meta_description?.trim()) && !ws._meta_manually_edited
  )

  // Track pending section edits without causing re-renders
  const pendingEdits = useRef<Record<string, { html?: string; header?: string }>>({})

  // ── Persist a single section ──────────────────────────────────────────────
  const persistSection = useCallback(async (sectionId: string) => {
    const edits = pendingEdits.current[sectionId]
    if (!edits) return

    setSaveStatus('saving')
    try {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (edits.html !== undefined) {
        updates.content_html     = edits.html
        updates.content_markdown = edits.html.replace(/<[^>]+>/g, '')
      }
      if (edits.header !== undefined) updates.section_header = edits.header

      const { error } = await supabase
        .from('article_sections')
        .update(updates)
        .eq('id', sectionId)

      if (error) throw error

      // Reflect changes in local state so switching to Original shows them
      setSections((prev) =>
        prev.map((s) =>
          s.id !== sectionId ? s : {
            ...s,
            ...(edits.html !== undefined
              ? { content_html: edits.html, content_markdown: edits.html.replace(/<[^>]+>/g, '') }
              : {}),
            ...(edits.header !== undefined ? { section_header: edits.header } : {}),
          }
        )
      )

      delete pendingEdits.current[sectionId]
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
    }
  }, [supabase])

  const debouncedPersist = useDebounce(persistSection, 1200)

  const handleContentChange = useCallback((sectionId: string, html: string) => {
    pendingEdits.current[sectionId] = { ...pendingEdits.current[sectionId], html }
    setSaveStatus('saving')
    debouncedPersist(sectionId)
  }, [debouncedPersist])

  const handleHeaderChange = useCallback((sectionId: string, header: string) => {
    pendingEdits.current[sectionId] = { ...pendingEdits.current[sectionId], header }
    setSaveStatus('saving')
    debouncedPersist(sectionId)
  }, [debouncedPersist])

  // ── Persist sidebar meta ──────────────────────────────────────────────────
  // ── Upsert newly created tag to org_tags ─────────────────────────────────
  const handleNewTag = useCallback(async (name: string) => {
    try {
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    } catch (err) {
      console.warn('[ArticleDetailClient] Failed to upsert tag:', err)
    }
  }, [])

  const saveMeta = useCallback(async () => {
    setSaveStatus('saving')
    try {
      await supabase
        .from('articles')
        .update({
          workflow_state: {
            ...(initialArticle.workflow_state || {}),
            focus_keyword: focusKeyword,
            meta_description: metaDescription,
            _meta_manually_edited: metaIsAI ? undefined : true,
            featured_image_url: featuredImageUrl,
            featured_image_alt: featuredImageAlt,
            tags,
          },
        })
        .eq('id', article.id)

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
    }
  }, [article.id, initialArticle.workflow_state, focusKeyword, metaDescription, metaIsAI, featuredImageUrl, featuredImageAlt, tags, supabase])

  const debouncedMeta = useDebounce(saveMeta, 1500)

  // Trigger meta save whenever sidebar values change
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    debouncedMeta()
  }, [focusKeyword, metaDescription, featuredImageUrl, featuredImageAlt, tags, debouncedMeta])

  const isRevision = viewMode === 'revision'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Page header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/articles" className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-sm text-neutral-900 leading-tight truncate max-w-100">
              {article.title ?? article.keyword ?? 'Article'}
            </h1>
            <p className="text-[10px] font-lato text-neutral-400 uppercase tracking-wider">
              {article.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {article.status === 'completed' && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Publish
            </button>
          )}
          <Link
            href={`/dashboard/articles/${article.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-white rounded-md transition-colors bg-linear-to-r from-[#217CEB] to-[#4A42CC]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

      {/* ── Article canvas ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-200 mx-auto px-8 py-8">

          {/* View mode tabs + save indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(['original', 'revision'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  if (viewMode === 'revision' && mode === 'original') {
                    Object.keys(pendingEdits.current).forEach((id) => persistSection(id))
                  }
                  setViewMode(mode)
                }}
                className={`px-4 py-1.5 text-sm font-lato font-medium rounded-full border transition-all capitalize ${
                  viewMode === mode
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 bg-white'
                }`}
              >
                {mode}
              </button>
            ))}
            <SavePill status={saveStatus} />
          </div>

          {/* Read-only notice */}
          {!isRevision && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg mb-6">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Info className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm font-lato text-blue-700">
                This article is read-only.{' '}
                <button
                  onClick={() => setViewMode('revision')}
                  className="font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-900 transition-colors"
                >
                  Switch to revision to edit.
                </button>
              </p>
            </div>
          )}

          {/* Cover image */}
          {article.cover_image_url && (
            <div className="mb-8 rounded-xl overflow-hidden bg-neutral-100">
              <img
                src={article.cover_image_url}
                alt={article.title || article.keyword}
                className="w-full object-cover max-h-80"
              />
            </div>
          )}

          {/* Article title */}
          <h1 className="font-poppins text-3xl font-bold text-neutral-900 leading-tight mb-6">
            {article.title || article.keyword}
          </h1>

          {/* Dark inline toolbar — Revision mode only */}
          {isRevision && <InlineToolbar />}

          {/* Table of Contents */}
          <TableOfContents sections={sections} />

          {/* Sections */}
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-lato text-neutral-500 text-sm">No content sections yet.</p>
              <p className="font-lato text-neutral-400 text-xs mt-1">Generate the article to see content here.</p>
            </div>
          ) : isRevision ? (
            sections.map((section) => (
              <EditableSection
                key={section.id}
                section={section}
                onContentChange={handleContentChange}
                onHeaderChange={handleHeaderChange}
              />
            ))
          ) : (
            sections.map((section) => (
              <ReadOnlySection key={section.id} section={section} />
            ))
          )}

          <div className="h-24" />
        </div>
      </div>

      {/* ── Right sidebar ────────────────────────────────────────────────── */}
      <aside className="w-70 shrink-0 border-l border-neutral-200 bg-white overflow-y-auto flex flex-col">

        {/* Tab bar */}
        <div className="flex border-b border-neutral-200 sticky top-0 bg-white z-10 shrink-0">
          <button
            onClick={() => setSidebarTab('details')}
            className={`flex-1 py-3.5 text-xs font-semibold font-lato transition-colors relative ${
              sidebarTab === 'details' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Details
            {sidebarTab === 'details' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
          {isRevision && (
            <button
              onClick={() => setSidebarTab('ai_assistant')}
              className={`flex-1 py-3.5 text-xs font-semibold font-lato transition-colors relative ${
                sidebarTab === 'ai_assistant' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              AI Assistant
              {sidebarTab === 'ai_assistant' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )}
            </button>
          )}
        </div>

        {/* Sidebar body */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">

          {sidebarTab === 'details' && (
            <>
              {/* Tags */}
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-xs font-semibold font-lato text-neutral-700">Tags</label>
                  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <TagInput tags={tags} onChange={setTags} onNewTag={handleNewTag} />
              </section>

              {/* Focus Keyword */}
              <section>
                <label className="text-xs font-semibold font-lato text-neutral-700 block mb-2">
                  Focus Keyword
                </label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  className="w-full text-sm font-lato border border-neutral-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-neutral-700 placeholder:text-neutral-400"
                  placeholder={article.keyword}
                />
              </section>

              {/* Meta Description */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold font-lato text-neutral-700">
                    Meta Description
                  </label>
                  {metaIsAI && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-lato font-medium rounded border border-purple-100">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI generated
                    </span>
                  )}
                </div>
                <textarea
                  value={metaDescription}
                  onChange={(e) => { setMetaDescription(e.target.value); setMetaIsAI(false) }}
                  rows={5}
                  maxLength={160}
                  className="w-full text-sm font-lato border border-neutral-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-neutral-700 resize-none placeholder:text-neutral-400"
                  placeholder={`Write a meta description…`}
                />
                <div className={`text-[10px] font-lato text-right mt-1 ${
                  metaDescription.length > 150 ? 'text-amber-500' : 'text-neutral-400'
                }`}>
                  {metaDescription.length}/160
                </div>
              </section>

              {/* Featured Image */}
              <section>
                <label className="text-xs font-semibold font-lato text-neutral-700 block mb-2">
                  Featured Image
                </label>
                <FeaturedImagePanel
                  url={featuredImageUrl}
                  alt={featuredImageAlt}
                  coverFallback={article.cover_image_url}
                  onChange={(url, alt) => { setFeaturedImageUrl(url); setFeaturedImageAlt(alt) }}
                />
              </section>
            </>
          )}

          {sidebarTab === 'ai_assistant' && isRevision && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-linear-to-br from-[#217CEB] to-[#4A42CC]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-lato text-neutral-900">AI Assistant</p>
                  <p className="text-[11px] font-lato text-neutral-500">Select text to get suggestions</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Improve writing',  desc: 'Enhance clarity and flow' },
                  { label: 'Make it shorter',  desc: 'Condense without losing meaning' },
                  { label: 'Make it longer',   desc: 'Expand with more detail' },
                  { label: 'Fix grammar',      desc: 'Correct errors and typos' },
                  { label: 'Change tone',      desc: 'Professional, casual, or friendly' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="w-full text-left px-3 py-2.5 border border-neutral-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <p className="text-xs font-semibold font-lato text-neutral-800 group-hover:text-blue-700 transition-colors">
                      {action.label}
                    </p>
                    <p className="text-[11px] font-lato text-neutral-500 mt-0.5">{action.desc}</p>
                  </button>
                ))}
              </div>

              <div className="border border-neutral-200 rounded-lg p-3">
                <textarea
                  rows={3}
                  placeholder="Or type a custom instruction…"
                  className="w-full text-xs font-lato text-neutral-700 placeholder:text-neutral-400 resize-none outline-none bg-transparent"
                />
                <div className="flex justify-end mt-2">
                  <button
                    className="px-3 py-1.5 text-xs font-semibold font-lato text-white rounded-md bg-linear-to-r from-[#217CEB] to-[#4A42CC] hover:opacity-95"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
      </div>

      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle className="sr-only">Publish Article</DialogTitle>
          <PublishToCmsButton
            articleId={article.id}
            articleStatus={article.status}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
