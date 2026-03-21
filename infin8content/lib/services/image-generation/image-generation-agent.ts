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

// ── Prompt builder ─────────────────────────────────────────────────────────────
function buildPrompt(input: ImageGenerationInput): string {
    const style = input.imageStyle || 'professional, modern, editorial'
    const colorHint = input.brandColor ? `, accent color ${input.brandColor}` : ''

    switch (input.purpose) {
        case 'cover':
            return [
                `Hero cover image for a blog article titled: "${input.articleTitle}".`,
                `Topic: ${input.keyword}.`,
                `Style: ${style}${colorHint}.`,
                `Wide cinematic composition. Photorealistic. No text. No overlays. High resolution.`,
            ].join(' ')

        case 'inline':
            return [
                `Editorial illustration for a blog section about: "${input.prompt}".`,
                `Article topic: ${input.keyword}.`,
                `Style: ${style}, clean, informative illustration.`,
                `No text overlays. Professional. White or neutral background.`,
            ].join(' ')

        case 'chart':
            return [
                `Clean data visualization or diagram showing: "${input.prompt}".`,
                `Style: minimal, professional${colorHint}.`,
                `White background. Clear visual structure. No decorative elements.`,
                `Suitable for a business blog article about ${input.keyword}.`,
            ].join(' ')
    }
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
