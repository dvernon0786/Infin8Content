/**
 * Comparison Table Generator
 * Story 13-2: Generate Listicle Articles with Comparison Tables
 *
 * Generates a responsive, accessible HTML comparison table from structured item data.
 * Pros/cons data is sourced from AI research (Tavily/Perplexity), not from site scraping.
 */

export interface ListicleItem {
  name: string;
  description?: string;
  features?: string[];
  pros?: string[];
  cons?: string[];
  pricing?: string;
  best_for?: string;
  rating?: number;      // 0–10
  editors_choice?: boolean;
  url?: string;
}

/**
 * Generate a responsive HTML comparison table for a listicle article.
 *
 * @param items - Array of items to compare
 * @param criteria - Columns to include (subset of: 'features', 'pros_cons', 'pricing', 'rating', 'best_for')
 * @returns HTML string for the comparison table
 */
export function generateComparisonTable(
  items: ListicleItem[],
  criteria: string[]
): string {
  if (!items.length) return ''

  const showFeatures = criteria.includes('features')
  const showProsCons = criteria.includes('pros_cons')
  const showPricing = criteria.includes('pricing')
  const showRating = criteria.includes('ratings')
  const showBestFor = criteria.includes('best_for')

  const headerCells = [
    '<th scope="col">Product</th>',
    showFeatures ? '<th scope="col">Key Features</th>' : '',
    showProsCons ? '<th scope="col">Pros</th>' : '',
    showProsCons ? '<th scope="col">Cons</th>' : '',
    showPricing ? '<th scope="col">Pricing</th>' : '',
    showRating ? '<th scope="col">Rating</th>' : '',
    showBestFor ? '<th scope="col">Best For</th>' : '',
  ].filter(Boolean).join('\n        ')

  const rows = items.map((item) => {
    const editorsBadge = item.editors_choice
      ? ' <span style="display:inline-block;background:#f59e0b;color:#fff;font-size:11px;padding:1px 6px;border-radius:4px;margin-left:6px;">Editor\'s Choice</span>'
      : ''

    const cells = [
      `<td><strong>${escapeHtml(item.name)}</strong>${editorsBadge}${item.description ? `<br><small>${escapeHtml(item.description)}</small>` : ''}</td>`,
      showFeatures
        ? `<td>${item.features?.length ? `<ul style="margin:0;padding-left:16px">${item.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : '—'}</td>`
        : '',
      showProsCons
        ? `<td>${item.pros?.length ? `<ul style="margin:0;padding-left:16px;color:#16a34a">${item.pros.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>` : '—'}</td>`
        : '',
      showProsCons
        ? `<td>${item.cons?.length ? `<ul style="margin:0;padding-left:16px;color:#dc2626">${item.cons.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '—'}</td>`
        : '',
      showPricing
        ? `<td>${item.pricing ? escapeHtml(item.pricing) : '—'}</td>`
        : '',
      showRating
        ? `<td>${item.rating != null ? `${item.rating}/10` : '—'}</td>`
        : '',
      showBestFor
        ? `<td>${item.best_for ? escapeHtml(item.best_for) : '—'}</td>`
        : '',
    ].filter(Boolean).join('\n        ')

    const rowStyle = item.editors_choice
      ? ' style="background-color:#fffbeb"'
      : ''

    return `      <tr${rowStyle}>
        ${cells}
      </tr>`
  }).join('\n')

  return `<div style="overflow-x:auto;margin:24px 0">
  <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb">
    <thead style="background-color:#f9fafb">
      <tr>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
