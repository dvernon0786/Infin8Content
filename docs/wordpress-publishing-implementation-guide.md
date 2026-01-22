# WordPress Publishing Implementation Guide

## 🎯 Overview

Complete implementation of WordPress publishing functionality for Story 5-1 with robust error handling, idempotency, and production-ready architecture.

## 📋 Prerequisites

### Environment Variables

```bash
# Required for WordPress publishing
WORDPRESS_PUBLISH_ENABLED=true
WORDPRESS_DEFAULT_SITE_URL=https://your-site.com
WORDPRESS_DEFAULT_USERNAME=your-username
WORDPRESS_DEFAULT_APPLICATION_PASSWORD=your-app-password

# Existing Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### WordPress Setup

1. **Application Passwords**: Create application password in WordPress admin
2. **API Permissions**: Ensure user has `publish_posts` capability
3. **Site URL**: Confirm WordPress REST API is accessible

## 🏗️ Architecture

### Core Components

1. **API Route** (`/api/articles/publish/route.ts`)
   - Authentication and validation
   - WordPress integration
   - Idempotency handling

2. **WordPress Adapter** (`/lib/services/wordpress-adapter.ts`)
   - Minimal WordPress REST API client
   - Request contract validation
   - Error handling and timeout protection

3. **UI Component** (`/components/articles/publish-to-wordpress-button.tsx`)
   - One-click publishing interface
   - Success/error states
   - Retry functionality

4. **Database Layer** (`/lib/supabase/publish-references.ts`)
   - Publish tracking
   - Idempotency enforcement
   - Organization security

### Data Flow

```
User Clicks Button 
→ API Route (POST /api/articles/publish)
→ Authentication Check
→ Article Validation
→ Publish Reference Check (Idempotency)
→ WordPress Adapter Publish
→ Store Publish Reference
→ Return Success/Error
```

## 🔧 Implementation Details

### 1. Server-Side Gating

```typescript
// app/dashboard/articles/[id]/page.tsx
const isPublishEnabled = process.env.WORDPRESS_PUBLISH_ENABLED === 'true';
const canPublish = isPublishEnabled && article.status === 'completed';

{canPublish && (
  <PublishToWordPressButton 
    articleId={article.id} 
    articleStatus={article.status}
  />
)}
```

### 2. API Route Structure

```typescript
export async function POST(request: NextRequest) {
  // Feature flag check
  if (!WORDPRESS_PUBLISH_ENABLED) {
    return NextResponse.json({ error: 'WordPress publishing is currently disabled' }, { status: 503 });
  }

  // Authentication
  const session = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Article validation
  if (article.status !== 'completed') {
    return NextResponse.json({ error: 'Article must be completed before publishing' }, { status: 400 });
  }

  // Idempotency check
  const existingReference = await getPublishReference(articleId, 'wordpress');
  if (existingReference) {
    return NextResponse.json({
      success: true,
      url: existingReference.published_url,
      alreadyPublished: true,
    });
  }

  // WordPress publishing
  const result = await wordpressAdapter.publishPost(postData);
  
  // Store reference (non-blocking failure)
  await createPublishReference({...});
}
```

### 3. WordPress Adapter

```typescript
export class WordPressAdapter {
  async publishPost(postData: WordPressPostRequest): Promise<WordPressPublishResult> {
    // Validate contract (only title, content, status)
    this.validateRequestContract(postData);

    // Create request with timeout
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(postData),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    // Handle errors
    if (!response.ok) {
      return this.handleError(response.status, await response.text());
    }

    // Return success
    const responseData = await response.json();
    return {
      success: true,
      url: responseData.link,
      postId: responseData.id,
    };
  }
}
```

### 4. Database Schema

```sql
CREATE TABLE IF NOT EXISTS publish_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    cms_type TEXT NOT NULL CHECK (cms_type IN ('wordpress')),
    published_url TEXT NOT NULL,
    external_id TEXT, -- WordPress post ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_publish_references_unique_article_cms 
ON publish_references(article_id, cms_type);
```

## 🧪 Testing

### Unit Tests

```bash
# WordPress adapter tests
npm test __tests__/lib/services/wordpress-adapter.test.ts

# API route tests
npm test __tests__/api/articles/publish.test.ts
```

### Integration Testing

1. **Happy Path**: Complete publish workflow
2. **Idempotency**: Duplicate publish attempts
3. **Error Handling**: Network failures, auth errors
4. **Feature Flag**: Disabled functionality
5. **Validation**: Invalid requests

### Manual Testing Checklist

- [ ] Article with status='completed' shows publish button
- [ ] Article with status≠'completed' hides publish button
- [ ] Feature flag disabled hides all publish buttons
- [ ] Successful publish shows success state with URL
- [ ] Failed publish shows error state with retry
- [ ] Duplicate publish shows "already published" message
- [ ] Network timeout shows appropriate error

## 🔒 Security Considerations

### Authentication
- User session validation
- Organization access control
- Article ownership verification

### WordPress Security
- Application Passwords (not user passwords)
- HTTPS-only communication
- Minimal API scope (posts only)

### Data Protection
- Organization-based RLS policies
- No sensitive data in client logs
- Secure credential storage

## 🚀 Deployment

### Database Migration

```bash
# Apply migration
supabase db push
```

### Environment Setup

```bash
# Verify environment variables
echo $WORDPRESS_PUBLISH_ENABLED
echo $WORDPRESS_DEFAULT_SITE_URL
```

### Health Check

```bash
# Test API endpoint
curl http://localhost:3000/api/articles/publish
```

## 📊 Monitoring

### Key Metrics
- Publish success rate
- API response times
- Error frequency by type
- WordPress connection health

### Logging
- Publish attempts and results
- WordPress API errors
- Authentication failures
- Performance metrics

### Alerts
- High error rates
- WordPress connection failures
- Feature flag changes

## 🔧 Troubleshooting

### Common Issues

1. **Button Not Visible**
   - Check `WORDPRESS_PUBLISH_ENABLED=true`
   - Verify article status is 'completed'
   - Check browser console for errors

2. **Authentication Failed**
   - Verify WordPress application password
   - Check user permissions in WordPress
   - Confirm site URL is correct

3. **Network Timeout**
   - Check WordPress site accessibility
   - Verify API endpoint is reachable
   - Consider increasing timeout if needed

4. **Idempotency Issues**
   - Check publish_references table
   - Verify unique constraint is working
   - Clear stuck references if needed

### Debug Mode

```typescript
// Enable debug logging
console.log('Publish request:', { articleId, status, timestamp });
```

## 📚 API Reference

### POST /api/articles/publish

**Request:**
```json
{
  "articleId": "uuid-string"
}
```

**Success Response:**
```json
{
  "success": true,
  "url": "https://site.com/post-url",
  "postId": 123,
  "alreadyPublished": false
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### GET /api/articles/publish

**Response:**
```json
{
  "enabled": true,
  "configured": true
}
```

## 🎯 Best Practices

1. **Always check feature flag** before implementing UI
2. **Validate article status** server-side
3. **Use idempotency** for all external API calls
4. **Handle timeouts gracefully** with user-friendly messages
5. **Log errors** but don't expose sensitive data
6. **Test all error paths** in development
7. **Monitor WordPress API health** in production

## 🔄 Future Enhancements

1. **Multiple CMS Support**: Extend publish_references for other platforms
2. **Scheduled Publishing**: Add publish_at functionality
3. **Bulk Publishing**: Publish multiple articles
4. **Content Preview**: Show WordPress preview before publishing
5. **Category/Tag Mapping**: Map article metadata to WordPress taxonomy
