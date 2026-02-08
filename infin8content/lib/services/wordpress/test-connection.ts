import { WordPressIntegration } from './wordpress-integration'

export interface WordPressCredentials {
  url: string
  username: string
  application_password: string
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  site?: {
    name: string
    description: string
    url: string
  }
}

/**
 * Test WordPress connection with credentials
 * Uses safe endpoints that work with Application Passwords
 * Throws error if connection fails
 */
export async function testWordPressConnection(credentials: WordPressCredentials): Promise<ConnectionTestResult> {
  try {
    // Validate URL format
    const url = new URL(credentials.url)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid URL protocol. Use http:// or https://')
    }

    // Create WordPress integration
    const wp = new WordPressIntegration(credentials)

    // Test connection using safe endpoint
    const connectionTest = await wp.testConnection()
    if (!connectionTest.success) {
      throw new Error(connectionTest.message)
    }

    // Try to get site info (optional - may fail on some hosts)
    let siteInfo
    try {
      siteInfo = await wp.getSiteInfo()
    } catch (siteError) {
      // Site info often fails on shared hosting, but connection is still valid
      console.warn('Site info unavailable, but connection is valid:', siteError)
      siteInfo = {
        name: 'WordPress Site',
        description: '',
        url: credentials.url
      }
    }

    return {
      success: true,
      message: 'Connection successful',
      site: siteInfo
    }

  } catch (error: any) {
    console.error('WordPress connection test failed:', error)
    
    // Provide specific error messages
    if (error.code === 'ENOTFOUND') {
      throw new Error('WordPress site not found. Check the URL and ensure the site is accessible.')
    }
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Connection refused. Check if the WordPress site is running and accessible.')
    }
    
    if (error.message?.includes('401')) {
      throw new Error('Authentication failed. Check username and application password.')
    }
    
    if (error.message?.includes('403')) {
      throw new Error('Access forbidden. Ensure Application Passwords are enabled for this user.')
    }
    
    if (error.message?.includes('404')) {
      throw new Error('WordPress REST API not found. Ensure the site has the REST API enabled.')
    }
    
    // Re-throw original error if it's already formatted
    if (error.message?.startsWith('WordPress API Error:')) {
      throw error
    }
    
    // Generic error
    throw new Error(`Failed to connect to WordPress: ${error.message}`)
  }
}
