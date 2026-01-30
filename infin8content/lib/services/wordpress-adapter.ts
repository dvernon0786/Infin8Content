// WordPress Adapter Service
// Story 5-1: Publish Article to WordPress (Minimal One-Click Export)
// Handles WordPress REST API integration with strict constraints

export interface WordPressPostRequest {
  title: string;
  content: string;
  status: 'publish';
}

export interface WordPressPostResponse {
  id: number;
  link: string;
  status: string;
}

export interface WordPressCredentials {
  username: string;
  application_password: string;
  site_url: string;
}

export interface WordPressPublishResult {
  success: boolean;
  url?: string;
  error?: string;
  postId?: number;
}

/**
 * WordPress Adapter with minimal API scope
 * ONLY uses POST /wp-json/wp/v2/posts endpoint
 */
export class WordPressAdapter {
  private credentials: WordPressCredentials;

  constructor(credentials: WordPressCredentials) {
    this.credentials = credentials;
  }

  /**
   * Publish article to WordPress
   * @param postData - Article data with exact contract
   * @returns WordPress publish result
   */
  async publishPost(postData: WordPressPostRequest): Promise<WordPressPublishResult> {
    try {
      // Validate request contract - only allow title, content, status
      this.validateRequestContract(postData);

      // Create WordPress API URL
      const apiUrl = `${this.credentials.site_url}/wp-json/wp/v2/posts`;

      // Create Basic Auth header
      const auth = Buffer.from(
        `${this.credentials.username}:${this.credentials.application_password}`
      ).toString('base64');

      // Set timeout (≤30 seconds as required)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
          body: JSON.stringify(postData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          return this.handleError(response.status, errorText);
        }

        const responseData: WordPressPostResponse = await response.json();

        // Return only required fields from response
        return {
          success: true,
          url: responseData.link,
          postId: responseData.id,
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout (30s limit exceeded)',
          };
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('WordPress publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate request contract strictly
   * Only allows: title, content, status
   */
  private validateRequestContract(postData: WordPressPostRequest): void {
    const allowedKeys = ['title', 'content', 'status'];
    const providedKeys = Object.keys(postData);

    // Check for forbidden fields
    const forbiddenKeys = providedKeys.filter(key => !allowedKeys.includes(key));
    if (forbiddenKeys.length > 0) {
      throw new Error(
        `Forbidden fields in WordPress request: ${forbiddenKeys.join(', ')}. ` +
        `Only title, content, and status are allowed.`
      );
    }

    // Validate status is 'publish' only
    if (postData.status !== 'publish') {
      throw new Error(`Invalid status: ${postData.status}. Only 'publish' status is allowed.`);
    }

    // Validate required fields
    if (!postData.title || !postData.content) {
      throw new Error('Title and content are required fields');
    }
  }

  /**
   * Handle WordPress API errors with clear user messages
   */
  private handleError(status: number, errorText: string): WordPressPublishResult {
    switch (status) {
      case 401:
        return {
          success: false,
          error: 'WordPress authentication failed. Please check your credentials.',
        };
      case 403:
        return {
          success: false,
          error: 'WordPress access forbidden. Application password may not have sufficient permissions.',
        };
      case 404:
        return {
          success: false,
          error: 'WordPress API endpoint not found. Please check your site URL.',
        };
      case 429:
        return {
          success: false,
          error: 'WordPress rate limit exceeded. Please try again later.',
        };
      case 500:
        return {
          success: false,
          error: 'WordPress server error. Please try again later.',
        };
      default:
        return {
          success: false,
          error: `WordPress API error (${status}): ${errorText}`,
        };
    }
  }

  /**
   * Test WordPress connection (optional validation)
   * @returns Connection test result
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a minimal request to verify credentials
      const testUrl = `${this.credentials.site_url}/wp-json/wp/v2/posts?per_page=1`;

      const auth = Buffer.from(
        `${this.credentials.username}:${this.credentials.application_password}`
      ).toString('base64');

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout for test
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Connection test failed: ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}
