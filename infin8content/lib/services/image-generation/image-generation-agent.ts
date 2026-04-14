/**
 * Image Generation Agent
 *
 * Generates article images via OpenRouter's chat completions endpoint.
 * Model routing by purpose:
 *   cover  → bytedance-seed/seedream-4.5   (hero, cinematic, 16:9)
 *   inline → sourceful/riverflow-v2-fast   (section illustrations, 3:2)
 *   chart  → openai/gpt-5-image-mini       (data diagrams, 4:3)
 *
 * IMPORTANT — OpenRouter image generation API:
 *   Endpoint:  POST /api/v1/chat/completions  (NOT /images/generations)
 *   Request:   modalities: ["image"] in body
 *   Response:  choices[0].message.images[0].image_url.url  (base64 data URL)
 *
 * Images are returned as base64 data URLs and uploaded to Supabase Storage
 * before the public URL is returned. The DB stores only the public URL.
 *
 * All failures are non-fatal — caller wraps in try/catch and continues.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export type ImagePurpose = 'cover' | 'inline' | 'chart'

export interface ImageGenerationInput {
    prompt: string           // section header or article title
    purpose: ImagePurpose
    articleTitle: string
    keyword: string
    articleId: string        // needed for Storage path
    imageStyle?: string      // from generationConfig.image_style
    brandColor?: string      // from generationConfig.brand_color
}

export interface ImageGenerationOutput {
    url: string              // public Supabase Storage URL
    purpose: ImagePurpose
    model: string
}

// ── Model routing ──────────────────────────────────────────────────────────────
const MODEL_MAP: Record<ImagePurpose, string> = {
    cover: 'bytedance-seed/seedream-4.5',    // cinematic hero banner
    inline: 'sourceful/riverflow-v2-fast',    // fast editorial illustration
    chart: 'openai/gpt-5-image-mini',        // structured diagram/chart
}

// ── Modalities per model type ──────────────────────────────────────────────────
// Image-only models: ["image"]
// Text+image models: ["image", "text"]
const MODALITIES_MAP: Record<ImagePurpose, string[]> = {
    cover: ['image'],          // Seedream — image only
    inline: ['image'],          // Riverflow — image only
    chart: ['image', 'text'],  // GPT-5 Image Mini — text + image
}

// ── Aspect ratios (image_config.aspect_ratio, not pixel sizes) ─────────────────
const ASPECT_RATIO_MAP: Record<ImagePurpose, string> = {
    cover: '16:9',   // wide hero banner
    inline: '3:2',    // editorial illustration
    chart: '4:3',    // diagram / chart
}

// ── Supabase Storage bucket ────────────────────────────────────────────────────
const STORAGE_BUCKET = 'article-images'

// ── Style base prompts ────────────────────────────────────────────────────────
// Maps onboarding image_style values → fixed base prompt prefix per spec.
// All prefixes explicitly exclude text from the generated image.
const STYLE_BASE_PROMPT_MAP: Record<string, string> = {
    'brand_text_realism': 'photorealistic, high detail, no text,',
    'watercolor_realism':  'watercolor painting, soft edges, artistic, no text,',
    'cinematic_realism':   'cinematic still, dramatic lighting, high resolution, no text,',
    'illustration':        'digital illustration, clean lines, vibrant colors, no text,',
    'sketch':              'pencil sketch, hand-drawn, minimalist, no text,',
}

// ── Prompt builder ─────────────────────────────────────────────────────────────
function buildPrompt(input: ImageGenerationInput): string {
    const styleKey = input.imageStyle ?? 'brand_text_realism'
    // Unknown/legacy style values fall back to brand_text_realism
    let basePrompt = STYLE_BASE_PROMPT_MAP[styleKey] ?? STYLE_BASE_PROMPT_MAP['brand_text_realism']

    // For Brand & Text Realism, splice brand color into the base prefix per spec
    if (styleKey === 'brand_text_realism' && input.brandColor) {
        basePrompt = `photorealistic, high detail, no text, dominant color ${input.brandColor},`
    }

    let dynamic: string
    switch (input.purpose) {
        case 'cover':
            dynamic = `hero banner for article "${input.articleTitle}". Topic: ${input.keyword}. Wide composition. No text overlays. High resolution.`
            break
        case 'inline':
            dynamic = `editorial illustration for blog section: "${input.prompt}". Topic: ${input.keyword}. Informative. White background.`
            break
        case 'chart':
            dynamic = `data visualization for "${input.prompt}". Business blog about ${input.keyword}. White background. Clear visual structure.`
            break
    }

    const full = `${basePrompt} ${dynamic}`
    // Spec requires < 300 chars; hard-truncate if dynamic content pushes over
    return full.length <= 300 ? full : full.slice(0, 297) + '...'
}

// ── Upload base64 data URL to Supabase Storage ─────────────────────────────────
async function uploadToStorage(
    base64DataUrl: string,
    articleId: string,
    purpose: ImagePurpose,
    slot: string
): Promise<string> {
    const supabase = createServiceRoleClient()

    // Parse: "data:image/png;base64,iVBORw0KGgo..."
    // Using split instead of regex to safely handle chunked base64 with embedded newlines
    const semiIdx = base64DataUrl.indexOf(';base64,')
    if (!base64DataUrl.startsWith('data:') || semiIdx === -1) {
        throw new Error('[ImageAgent] Invalid base64 data URL format')
    }
    const mimeType = base64DataUrl.slice(5, semiIdx)           // "image/png"
    const base64Data = base64DataUrl.slice(semiIdx + 8)        // everything after ";base64,"
    const ext = mimeType.split('/')[1] || 'png'

    const buffer = Buffer.from(base64Data, 'base64')
    const storagePath = `${articleId}/${purpose}-${slot}.${ext}`

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
        })

    if (error) throw new Error(`[ImageAgent] Storage upload failed: ${error.message}`)

    const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath)

    if (!urlData?.publicUrl) throw new Error('[ImageAgent] Failed to get public URL from Storage')

    return urlData.publicUrl
}

// ── Main export ────────────────────────────────────────────────────────────────
export async function generateArticleImage(
    input: ImageGenerationInput,
    storageSlot: string = input.purpose
): Promise<ImageGenerationOutput> {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error('[ImageAgent] OPENROUTER_API_KEY not set')

    const model = MODEL_MAP[input.purpose]
    const modalities = MODALITIES_MAP[input.purpose]
    const aspectRatio = ASPECT_RATIO_MAP[input.purpose]
    const prompt = buildPrompt(input)

    console.log(`[ImageAgent] Generating ${input.purpose} image | model: ${model} | ratio: ${aspectRatio}`)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://app.outrank.so',
            'X-Title': 'Infin8Content',
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            modalities,
            image_config: { aspect_ratio: aspectRatio },
        }),
    })

    if (!response.ok) {
        const body = await response.text()
        throw new Error(`[ImageAgent] ${model} failed (${response.status}): ${body}`)
    }

    const data = await response.json()

    // Response shape varies by model:
    //   Image-only models (Seedream, Riverflow): choices[0].message.images[0].image_url.url
    //   Text+image models (GPT-5 Image Mini):    same .images path, but .content may also exist
    // Fallback: some models embed the data URL directly in .content
    const fromImages: string | undefined =
        data?.choices?.[0]?.message?.images?.[0]?.image_url?.url
    const fromContent: string | undefined =
        typeof data?.choices?.[0]?.message?.content === 'string' &&
            (data.choices[0].message.content as string).startsWith('data:')
            ? data.choices[0].message.content
            : undefined
    const base64DataUrl = fromImages || fromContent

    if (!base64DataUrl) {
        throw new Error(
            `[ImageAgent] No image in response from ${model}: ${JSON.stringify(data).slice(0, 200)}`
        )
    }

    console.log(`[ImageAgent] ${input.purpose} image received, uploading to Supabase Storage...`)

    const publicUrl = await uploadToStorage(base64DataUrl, input.articleId, input.purpose, storageSlot)

    console.log(`[ImageAgent] ${input.purpose} image stored: ${publicUrl.slice(0, 80)}...`)

    return { url: publicUrl, purpose: input.purpose, model }
}

// ── Section image eligibility ──────────────────────────────────────────────────
export function getSectionImagePurpose(
    sectionType: string,
    sectionOrder: number,
    sectionHeader: string
): ImagePurpose | null {
    if (sectionType !== 'h2') return null
    if (sectionOrder % 2 !== 0) return null

    const isDataHeavy = /statistic|cost|price|percentage|roi|comparison|table|chart|budget|revenue|%|\$/i
        .test(sectionHeader)

    return isDataHeavy ? 'chart' : 'inline'
}

// ── Word-count-based section image selection ───────────────────────────────────
// Spec: <1500 words → 2 total images, 1500-2500 → 3, >2500 → 4.
// Cover is always 1 (generated separately in the main pipeline),
// so inline/chart slots = total - 1.
// Sections are evenly distributed across eligible h2 sections only.
export function selectSectionImages(
    sections: Array<{ section_type: string; section_order: number; section_header: string; [key: string]: any }>,
    wordCount: number
): Array<{ section: (typeof sections)[0]; purpose: ImagePurpose }> {
    // Default to 3 images if word count unavailable (per spec error-handling rule)
    const totalImages = wordCount <= 0 ? 3 : wordCount < 1500 ? 2 : wordCount <= 2500 ? 3 : 4
    const inlineSlots = Math.max(1, totalImages - 1)

    const eligible = sections.filter(s => s.section_type === 'h2')
    if (eligible.length === 0) return []

    const count = Math.min(inlineSlots, eligible.length)
    const isDataHeavy = /statistic|cost|price|percentage|roi|comparison|table|chart|budget|revenue|%|\$/i
    const selected: Array<{ section: (typeof sections)[0]; purpose: ImagePurpose }> = []

    for (let i = 0; i < count; i++) {
        // Evenly space selections: pick section nearest to each interval midpoint
        const idx = Math.floor((i + 0.5) / count * eligible.length)
        const section = eligible[idx]
        const purpose: ImagePurpose = isDataHeavy.test(section.section_header) ? 'chart' : 'inline'
        selected.push({ section, purpose })
    }

    return selected
}
