export interface PublishReference {
  id: string
  article_id: string
  platform: string
  platform_post_id: string
  platform_url: string
  published_at: string
  created_at: string
}

export enum PublishPlatform {
  WORDPRESS = 'wordpress'
  // Future platforms can be added here
}

export interface CreatePublishReferenceRequest {
  article_id: string
  platform: PublishPlatform
  platform_post_id: string
  platform_url: string
  published_at: string
}
