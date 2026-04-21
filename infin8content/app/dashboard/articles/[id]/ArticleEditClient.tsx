"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Link2, Image as ImageIcon,
  AlignJustify, Undo2, Redo2, Save, ArrowLeft,
  Upload, X, Plus, ChevronDown, Loader2, CheckCircle2,
  ExternalLink, Tag, Search, FileText, Eye
} from 'lucide-react'
import { PublishToCmsButton } from '@/components/articles/PublishToCmsButton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedSection {
  id: string
  article_id: string
  section_order: number
  section_header: string
  section_type: string
  content_markdown: string | null
  content_html: string | null
  status: string
}

export interface SerializedArticle {
  id: string
  title: string | null
  keyword: string
  status: string
  org_id: string
  slug: string | null
  workflow_state: Record<string, any> | null
}

// ─── Debounce helper ──────────────────────────────────────────────────────────

function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T & { cancel: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounced = useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay]) as T & { cancel: () => void }
  debounced.cancel = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }
  return debounced
}

// ─── Save status indicator ───────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  return (
    <div className={`flex items-center gap-1.5 text-xs font-lato font-medium px-2.5 py-1 rounded-full transition-all ${
      status === 'saving' ? 'text-neutral-500 bg-neutral-100' :
      status === 'saved' ? 'text-green-600 bg-green-50' :
      'text-red-600 bg-red-50'
    }`}>
      {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'saved' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error saving'}
    </div>
  )
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, title, active = false, children
}: {
  onClick: () => void
  title: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 ${
        active ? 'bg-neutral-100 text-neutral-900' : ''
      }`}
    >
      {children}
    </button>
  )
}

// ─── Section config ────────────────────────────────────────────────────────────

const SECTION_CONFIG: Record<string, { headerClass: string; containerClass: string }> = {
  introduction: {
    headerClass: 'font-poppins text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight',
    containerClass: 'pb-10 mb-10 border-b border-neutral-200',
  },
  h2: {
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug',
    containerClass: 'py-8',
  },
  h3: {
    headerClass: 'font-poppins text-xl sm:text-2xl font-semibold text-neutral-800 leading-snug',
    containerClass: 'py-6',
  },
  section: {
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug',
    containerClass: 'py-8',
  },
  conclusion: {
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug',
    containerClass: 'pt-10 mt-10 border-t border-neutral-200',
  },
  faq: {
    headerClass: 'font-poppins text-2xl sm:text-3xl font-semibold text-neutral-900 leading-snug',
    containerClass: 'py-8',
  },
}

// ─── Editable Section ─────────────────────────────────────────────────────────

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

  // FIX: set innerHTML once on mount only — never overwrite during edits (Bug 6)
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML =
        section.content_html || section.content_markdown?.replace(/\n/g, '<br>') || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="group relative">
      <div className={config.containerClass}>
        {section.section_header && (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onHeaderChange(section.id, e.currentTarget.textContent || '')}
            className={`${config.headerClass} mb-5 outline-none border-b-2 border-transparent focus:border-blue-200 pb-1 transition-colors cursor-text`}
          >
            {section.section_header}
          </div>
        )}

        {/* FIX: onInput saves innerHTML (preserves rich formatting), not innerText (Bug 5) */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onContentChange(section.id, e.currentTarget.innerHTML)}
          className="font-lato text-neutral-700 leading-relaxed text-[1.0625rem] outline-none focus:outline-none min-h-12 cursor-text"
        />
      </div>
    </div>
  )
}

// ─── Image Uploader ───────────────────────────────────────────────────────────

function FeaturedImageUploader({
  currentUrl, altText, onSave
}: {
  currentUrl?: string
  altText?: string
  onSave: (url: string, alt: string) => void
}) {
  const [url, setUrl] = useState(currentUrl || '')
  const [alt, setAlt] = useState(altText || '')
  const [expanded, setExpanded] = useState(!!currentUrl)

  // Sync url/alt when props change (e.g. parent saves and updates featuredImageUrl)
  useEffect(() => {
    if (!expanded) {
      setUrl(currentUrl || '')
      setAlt(altText || '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl, altText])

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="relative group">
          <img
            src={currentUrl}
            alt={altText || ''}
            className="w-full h-40 object-cover rounded-lg border border-neutral-200"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => setExpanded(true)}
              className="px-3 py-1.5 bg-white rounded-md text-xs font-semibold text-neutral-900"
            >
              Change
            </button>
            <button
              onClick={() => onSave('', '')}
              className="p-1.5 bg-white/20 rounded-md text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {altText && (
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-[10px] font-lato bg-black/60 text-white px-1.5 py-0.5 rounded">
                ALT {altText}
              </span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="w-full h-28 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs font-lato">Add featured image</span>
        </button>
      )}

      {expanded && (
        <div className="border border-neutral-200 rounded-lg p-3 space-y-2 bg-neutral-50">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Image URL"
            className="w-full text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text"
            className="w-full text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onSave(url, alt); setExpanded(false) }}
              className="flex-1 py-1 text-xs font-semibold font-lato bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-3 py-1 text-xs font-lato text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[], onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const t = input.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs font-lato rounded-md"
          >
            {tag}
            <button onClick={() => onChange(tags.filter((t) => t !== tag))}>
              <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          placeholder="Add a tag…"
          className="flex-1 text-xs font-lato border border-neutral-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={add}
          className="px-2 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Editor (client-only, receives initial data from server) ──────────

interface Props {
  initialArticle: SerializedArticle
  initialSections: SerializedSection[]
}

export default function ArticleEditClient({ initialArticle, initialSections }: Props) {
  const router = useRouter()
  const articleId = initialArticle.id

  const supabase = createClient()

  const [article, setArticle] = useState<SerializedArticle>(initialArticle)
  const [sections, setSections] = useState<SerializedSection[]>(initialSections)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'seo'>('details')

  // Sidebar state
  const ws = initialArticle.workflow_state || {}
  const [tags, setTags] = useState<string[]>(ws.tags || [])
  const [focusKeyword, setFocusKeyword] = useState(ws.focus_keyword || initialArticle.keyword || '')
  const [metaDescription, setMetaDescription] = useState(ws.meta_description || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(ws.featured_image_url || '')
  const [featuredImageAlt, setFeaturedImageAlt] = useState(ws.featured_image_alt || '')

  // In-memory edits before save
  const sectionEdits = useRef<Record<string, { html?: string; header?: string }>>({})

  // ── Save section ─────────────────────────────────────────────────────────

  const persistSection = useCallback(async (sectionId: string) => {
    const edits = sectionEdits.current[sectionId]
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

      // Reflect changes in local state so UI shows latest saved content
      setSections((prev) =>
        prev.map((s) =>
          s.id !== sectionId ? s : {
            ...s,
            ...(edits.html !== undefined ? { content_html: edits.html, content_markdown: edits.html.replace(/<[^>]+>/g, '') } : {}),
            ...(edits.header !== undefined ? { section_header: edits.header } : {}),
          }
        )
      )

      delete sectionEdits.current[sectionId]
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }, [supabase])

  const debouncedSave = useDebounce(persistSection, 1200)

  const handleContentChange = useCallback((sectionId: string, html: string) => {
    sectionEdits.current[sectionId] = {
      ...sectionEdits.current[sectionId],
      html,
    }
    setSaveStatus('saving')
    debouncedSave(sectionId)
  }, [debouncedSave])

  const handleHeaderChange = useCallback((sectionId: string, header: string) => {
    sectionEdits.current[sectionId] = {
      ...sectionEdits.current[sectionId],
      header,
    }
    setSaveStatus('saving')
    debouncedSave(sectionId)
  }, [debouncedSave])

  // ── Save sidebar meta ─────────────────────────────────────────────────────

  const saveMeta = useCallback(async () => {
    if (!articleId) return
    setSaveStatus('saving')
    try {
      const current = article.workflow_state || {}
      const updated = {
        ...current,
        focus_keyword: focusKeyword,
        meta_description: metaDescription,
        featured_image_url: featuredImageUrl,
        featured_image_alt: featuredImageAlt,
        tags,
      }

      await supabase
        .from('articles')
        .update({ workflow_state: updated })
        .eq('id', articleId)

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }, [articleId, article.workflow_state, focusKeyword, metaDescription, featuredImageUrl, featuredImageAlt, tags, supabase])

  const debouncedMetaSave = useDebounce(saveMeta, 1500)

  // FIX: isFirstRender guard prevents spurious save on mount (Bug 4)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    debouncedMetaSave()
  }, [focusKeyword, metaDescription, featuredImageUrl, featuredImageAlt, tags, debouncedMetaSave])

  // Title ref — set innerHTML once on mount, never overwrite (avoids cursor reset on state update)
  const titleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.innerHTML = initialArticle.title || ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Toolbar execCommand helpers ───────────────────────────────────────────

  const exec = (cmd: string, value?: string) =>
    document.execCommand(cmd, false, value)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">

  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">
      {/* Top Bar, toolbar, editor layout — reuse markup from previous editor implementation */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-200 shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/articles/${articleId}`)}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-poppins font-bold text-sm text-neutral-900 leading-tight truncate max-w-[320px]">
              {article.title || article.keyword}
            </h1>
            <p className="text-[10px] font-lato text-neutral-400 uppercase tracking-wider">
              AI SEO Editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SaveIndicator status={saveStatus} />

          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Publish
          </button>

          <button
            onClick={() => router.push(`/dashboard/articles/${articleId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>

          <button
            onClick={() => { debouncedMetaSave.cancel(); saveMeta() }}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-white bg-linear-to-r from-[#217CEB] to-[#4A42CC] rounded-md hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </header>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-1.5 bg-white border-b border-neutral-100 shrink-0 overflow-x-auto">
        <ToolbarBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-neutral-200 mx-1" />

        <ToolbarBtn onClick={() => exec('bold')} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-neutral-200 mx-1" />

        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-neutral-200 mx-1" />

        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) exec('createLink', url)
          }}
          title="Insert link"
        >
          <Link2 className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('Image URL:')
            if (url) exec('insertImage', url)
          }}
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-neutral-200 mx-1" />

        <ToolbarBtn onClick={() => exec('undo')} title="Undo">
          <Undo2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('redo')} title="Redo">
          <Redo2 className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto px-8 py-10">

            {/* Article title (editable) — ref-initialised to avoid cursor reset on state update */}
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={async (e) => {
                const newTitle = e.currentTarget.textContent || ''
                await supabase
                  .from('articles')
                  .update({ title: newTitle })
                  .eq('id', articleId)
                setArticle((a) => ({ ...a, title: newTitle }))
              }}
              className="font-poppins text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight mb-8 outline-none focus:outline-none border-b-2 border-transparent focus:border-blue-200 pb-2 transition-colors cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-300"
              data-placeholder="Article title…"
            />

            {/* Sections */}
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-12 h-12 text-neutral-200 mb-4" />
                <p className="font-lato text-neutral-400 text-sm">
                  No content yet. Generate the article first.
                </p>
              </div>
            ) : (
              sections.map((section) => (
                <EditableSection
                  key={section.id}
                  section={section}
                  onContentChange={handleContentChange}
                  onHeaderChange={handleHeaderChange}
                />
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 shrink-0 border-l border-neutral-200 bg-white overflow-y-auto">

          {/* Sidebar tabs */}
          <div className="flex border-b border-neutral-200 sticky top-0 bg-white z-10">
            {(['details', 'seo'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold font-lato uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-6">

            {activeTab === 'details' && (
              <>
                {/* Tags */}
                <section>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold font-lato text-neutral-600 uppercase tracking-wider mb-2">
                    <Tag className="w-3 h-3" />
                    Tags
                  </label>
                  <TagInput tags={tags} onChange={setTags} />
                </section>

                {/* Featured Image */}
                <section>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold font-lato text-neutral-600 uppercase tracking-wider mb-2">
                    <ImageIcon className="w-3 h-3" />
                    Featured Image
                  </label>
                  <FeaturedImageUploader
                    currentUrl={featuredImageUrl}
                    altText={featuredImageAlt}
                    onSave={(url, alt) => {
                      setFeaturedImageUrl(url)
                      setFeaturedImageAlt(alt)
                    }}
                  />
                </section>

                {/* Article status */}
                <section>
                  <label className="text-[11px] font-bold font-lato text-neutral-600 uppercase tracking-wider block mb-2">
                    Status
                  </label>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-lato ${
                    article.status === 'completed' ? 'bg-green-50 text-green-700' :
                    article.status === 'processing' ? 'bg-orange-50 text-orange-700' :
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      article.status === 'completed' ? 'bg-green-500' :
                      article.status === 'processing' ? 'bg-orange-500 animate-pulse' :
                      'bg-neutral-400'
                    }`} />
                    {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'seo' && (
              <>
                {/* Focus Keyword */}
                <section>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold font-lato text-neutral-600 uppercase tracking-wider mb-2">
                    <Search className="w-3 h-3" />
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="w-full text-sm font-lato border border-neutral-200 rounded-md px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-neutral-700 transition-colors"
                    placeholder="e.g. content marketing"
                  />
                </section>

                {/* Meta Description */}
                <section>
                  <label className="text-[11px] font-bold font-lato text-neutral-600 uppercase tracking-wider block mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={5}
                    maxLength={160}
                    className="w-full text-sm font-lato border border-neutral-200 rounded-md px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-neutral-700 resize-none transition-colors"
                    placeholder="Write a concise meta description…"
                  />
                  <div className={`text-[10px] font-lato mt-1 text-right ${
                    metaDescription.length > 150 ? 'text-amber-500' : 'text-neutral-400'
                  }`}>
                    {metaDescription.length}/160
                  </div>
                </section>

                {/* SEO Preview */}
                <section>
                  <label className="text-[11px] font-bold font-lato text-neutral-600 uppercase tracking-wider block mb-2">
                    Search Preview
                  </label>
                  <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 space-y-1">
                    <p className="text-[13px] font-semibold text-blue-700 leading-tight truncate font-lato">
                      {article.title || 'Article Title'}
                    </p>
                    <p className="text-[11px] text-green-700 font-lato truncate">
                      yoursite.com/{article.slug || article.id}
                    </p>
                    <p className="text-[11px] text-neutral-600 font-lato leading-relaxed line-clamp-2">
                      {metaDescription || 'Add a meta description to preview how your page appears in search results.'}
                    </p>
                  </div>
                </section>
              </>
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
