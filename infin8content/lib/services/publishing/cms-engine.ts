/**
 * CMS Engine — adapter factory and platform type definitions.
 * Import createCMSAdapter to get the right adapter for a given platform.
 */

import { WordPressPublishingAdapter } from './wordpress-adapter'
import { WebflowAdapter } from './webflow-adapter'
import { ShopifyAdapter } from './shopify-adapter'
import { GhostAdapter } from './ghost-adapter'
import { NotionAdapter } from './notion-adapter'
import { CustomAdapter } from './custom-adapter'
import type { CMSAdapter } from './cms-adapter'

export type CMSPlatform =
  | 'wordpress'
  | 'webflow'
  | 'shopify'
  | 'ghost'
  | 'notion'
  | 'custom'

export const CMS_PLATFORMS: CMSPlatform[] = [
  'wordpress',
  'webflow',
  'shopify',
  'ghost',
  'notion',
  'custom',
]

export const CMS_PLATFORM_LABELS: Record<CMSPlatform, string> = {
  wordpress: 'WordPress',
  webflow: 'Webflow',
  shopify: 'Shopify',
  ghost: 'Ghost',
  notion: 'Notion',
  custom: 'Custom API',
}

/** Secret credential field names per platform — only these are encrypted at rest. */
export const CMS_SECRET_FIELDS: Record<CMSPlatform, string[]> = {
  wordpress: ['application_password'],
  webflow: ['api_token'],
  shopify: ['access_token'],
  ghost: ['admin_api_key'],
  notion: ['token'],
  custom: ['api_key'],
}

export function createCMSAdapter(
  platform: CMSPlatform,
  credentials: Record<string, string>
): CMSAdapter {
  switch (platform) {
    case 'wordpress':
      return new WordPressPublishingAdapter(credentials)
    case 'webflow':
      return new WebflowAdapter(credentials)
    case 'shopify':
      return new ShopifyAdapter(credentials)
    case 'ghost':
      return new GhostAdapter(credentials)
    case 'notion':
      return new NotionAdapter(credentials)
    case 'custom':
      return new CustomAdapter(credentials)
    default:
      throw new Error(`Unsupported CMS platform: ${platform}`)
  }
}
