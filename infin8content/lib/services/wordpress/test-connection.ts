import { WordPressIntegration } from './wordpress-integration'

export interface WordPressCredentials {
  url: string
  username: string
  application_password: string
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  user?: {
    id: number
    name: string
    email: string
    roles: string[]
  }
  site?: {
    name: string
    description: string
    url: string
  }
}

/**
 * Test WordPress connection with credentials
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

    // Test connection by getting user info
    const user = await wp.testConnection()
    if (!user.success) {
      throw new Error(user.message)
    }

    // Get site info for additional validation
    const siteInfo = await wp.getSiteInfo()

    return {
      success: true,
      message: 'Connection successful',
      user: user.user,
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
