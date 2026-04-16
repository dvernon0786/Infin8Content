# Marketing homepage deliverable — 2026-04-16

- **Date:** 2026-04-16
- **Status:** ✅ Packaged and delivered
- **Artifacts:** `homepage_files.zip` (project root); single-file homepage `index.html` provided in chat
- **Source files:** `infin8content/app/page.tsx`, `infin8content/app/layout.tsx`, `infin8content/app/globals.css`, `infin8content/components/marketing/*`, `infin8content/public/infin8content-logo.png`

## Short TOC guidance

- Build-time (recommended): extract headings during MDX/assembly and persist a `toc` JSONB on `articles` at assembly time (fast, indexable, SEO-friendly).
- Client-side (fast rollout): add `components/article/TableOfContents.tsx` that scans rendered headings (`h2`/`h3`) and renders anchor links with smooth scroll.

## Suggested migration

Create a small migration to add a `toc` JSONB column to `articles`:

```sql
-- supabase/migrations/20260416_add_articles_toc.sql
ALTER TABLE articles
  ADD COLUMN toc JSONB DEFAULT '[]'::jsonb;
```

## Build-time extractor (example)

Create a small utility to extract headings from markdown and return an ordered `toc` array. Example implementation: `lib/mdx/extractHeadings.ts`.

```ts
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import {visit} from 'unist-util-visit'

function simpleSlug(s:string){
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g,'')
    .replace(/\s+/g,'-')
}

export function extractHeadings(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown as any)
  const headings: Array<{text:string; depth:number; slug:string}> = []
  visit(tree, 'heading', (node: any) => {
    const text = (node.children || []).map((c:any)=>c.value||'').join('').trim()
    const depth = node.depth || 2
    const slug = simpleSlug(text)
    headings.push({ text, depth, slug })
  })
  return headings
}
```

Integration note: run `extractHeadings()` after `content_markdown` is assembled in the `ArticleAssembler`, then persist to `articles.toc`.

## Client-side TOC component (quick example)

Add `infin8content/components/article/TableOfContents.tsx` for immediate rollout which scans headings in the article container.

```tsx
'use client'
import React, {useEffect, useState} from 'react'

export default function TableOfContents({
  selector = '#article-content',
  headingSelectors = 'h2,h3'
}:{selector?:string; headingSelectors?:string}){
  const [items, setItems] = useState<{text:string; id:string; depth:number}[]>([])

  useEffect(()=>{
    const root = document.querySelector(selector)
    if (!root) return
    const scan = ()=>{
      const found = Array.from(root.querySelectorAll(headingSelectors)).map(h=>{
        const el = h as HTMLElement
        if (!el.id) {
          el.id = (el.textContent||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]/g,'')
        }
        return { text: el.textContent||'', id: el.id, depth: Number(el.tagName[1])||2 }
      })
      setItems(found)
    }
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(root, {childList: true, subtree: true})
    return ()=> mo.disconnect()
  }, [selector, headingSelectors])

  return (
    <nav aria-label="Table of contents">
      <ul>
        {items.map(it=> (
          <li key={it.id} style={{marginLeft: (it.depth-2)*12}}>
            <a href={`#${it.id}`}>{it.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

## Next actions

- If you want build-time: I can update `accessible-artifacts/b-1-article-sections-data-model.md` and the `ArticleAssembler` to extract and persist `toc` on assembly (recommended).
- If you want client-side only: wire the `TableOfContents` component into the article layout and ship immediately.

---
Notes: this file centralizes the homepage deliverable and TOC guidance. I added a migration snippet and example code for both approaches to speed implementation.
