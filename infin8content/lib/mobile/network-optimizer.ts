/**
 * Mobile Network Optimizer
 * 
 * Provides network-aware optimization strategies for mobile devices
 * including adaptive loading, bandwidth detection, and offline support.
 */

export interface NetworkInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  downlink: number // Mbps
  rtt: number // ms
  saveData: boolean
}

export interface NetworkOptimizationConfig {
  enableImageOptimization: boolean
  enableLazyLoading: boolean
  enableCompression: boolean
  enableCaching: boolean
  adaptiveQuality: boolean
}

export class NetworkOptimizer {
  private currentNetwork: NetworkInfo | null = null
  private config: NetworkOptimizationConfig
  private observers: ((network: NetworkInfo) => void)[] = []

  constructor() {
    this.config = this.getDefaultConfig()
    this.initializeNetworkMonitoring()
  }

  /**
   * Get current network information
   */
  getNetworkInfo(): NetworkInfo | null {
    return this.currentNetwork
  }

  /**
   * Get optimization configuration for current network
   */
  getOptimizationConfig(): NetworkOptimizationConfig {
    if (!this.currentNetwork) {
      return this.config
    }

    return this.adaptConfigToNetwork(this.currentNetwork)
  }

  /**
   * Subscribe to network changes
   */
  subscribe(callback: (network: NetworkInfo) => void): () => void {
    this.observers.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  /**
   * Check if network is suitable for high-quality content
   */
  isHighQualityNetwork(): boolean {
    if (!this.currentNetwork) return true // Assume good network if unknown
    
    return this.currentNetwork.effectiveType === '4g' && 
           this.currentNetwork.downlink >= 5 && // 5 Mbps
           this.currentNetwork.rtt < 200 // 200ms
  }

  /**
   * Check if data saver mode is enabled
   */
  isDataSaverMode(): boolean {
    return this.currentNetwork?.saveData || false
  }

  /**
   * Get appropriate image quality based on network
   */
  getImageQuality(): 'low' | 'medium' | 'high' {
    if (!this.currentNetwork) return 'high'

    const { effectiveType, downlink, saveData } = this.currentNetwork

    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'low'
    }

    if (effectiveType === '3g' || downlink < 2) {
      return 'medium'
    }

    return 'high'
  }

  /**
   * Get appropriate video quality based on network
   */
  getVideoQuality(): 'low' | 'medium' | 'high' | 'auto' {
    if (!this.currentNetwork) return 'auto'

    const { effectiveType, downlink, saveData } = this.currentNetwork

    if (saveData || effectiveType === 'slow-2g') {
      return 'low'
    }

    if (effectiveType === '2g' || (effectiveType === '3g' && downlink < 1.5)) {
      return 'medium'
    }

    if (effectiveType === '4g' && downlink >= 10) {
      return 'high'
    }

    return 'auto'
  }

  /**
   * Get loading strategy based on network
   */
  getLoadingStrategy(): 'eager' | 'lazy' | 'progressive' {
    if (!this.currentNetwork) return 'eager'

    const { effectiveType, saveData } = this.currentNetwork

    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'lazy'
    }

    if (effectiveType === '3g') {
      return 'progressive'
    }

    return 'eager'
  }

  /**
   * Get cache duration based on network
   */
  getCacheDuration(): number {
    if (!this.currentNetwork) return 3600000 // 1 hour default

    const { effectiveType } = this.currentNetwork

    switch (effectiveType) {
      case 'slow-2g':
        return 86400000 // 24 hours - cache longer for slow networks
      case '2g':
        return 43200000 // 12 hours
      case '3g':
        return 7200000 // 2 hours
      case '4g':
        return 3600000 // 1 hour
      default:
        return 3600000
    }
  }

  /**
   * Optimize image URL based on network
   */
  optimizeImageUrl(originalUrl: string, quality?: 'low' | 'medium' | 'high'): string {
    const imageQuality = quality || this.getImageQuality()
    
    // This is a placeholder - in a real implementation, you would
    // integrate with your image CDN/service (e.g., Cloudinary, Imgix)
    // SSR safety check - use fallback origin on server
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'
    const url = new URL(originalUrl, origin)
    
    switch (imageQuality) {
      case 'low':
        url.searchParams.set('q', '30')
        url.searchParams.set('w', '400')
        break
      case 'medium':
        url.searchParams.set('q', '60')
        url.searchParams.set('w', '800')
        break
      case 'high':
        url.searchParams.set('q', '85')
        url.searchParams.set('w', '1200')
        break
    }
    
    return url.toString()
  }

  /**
   * Check if should prefetch resources
   */
  shouldPrefetch(): boolean {
    if (!this.currentNetwork) return true

    const { effectiveType, saveData } = this.currentNetwork
    return !saveData && (effectiveType === '4g' || effectiveType === '3g')
  }

  /**
   * Get request timeout based on network
   */
  getRequestTimeout(): number {
    if (!this.currentNetwork) return 10000 // 10 seconds default

    const { effectiveType, rtt } = this.currentNetwork

    switch (effectiveType) {
      case 'slow-2g':
        return 30000 // 30 seconds
      case '2g':
        return 20000 // 20 seconds
      case '3g':
        return 15000 // 15 seconds
      case '4g':
        return Math.max(10000, rtt * 10) // 10 seconds or 10x RTT
      default:
        return 10000
    }
  }

  /**
   * Get retry count based on network
   */
  getRetryCount(): number {
    if (!this.currentNetwork) return 3

    const { effectiveType } = this.currentNetwork

    switch (effectiveType) {
      case 'slow-2g':
        return 5 // More retries for unstable networks
      case '2g':
        return 4
      case '3g':
        return 3
      case '4g':
        return 2
      default:
        return 3
    }
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Get initial network info
    this.updateNetworkInfo()

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', () => {
        this.updateNetworkInfo()
      })
    }

    // Listen for online/offline events - SSR safety check
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateNetworkInfo()
      })

      window.addEventListener('offline', () => {
        this.updateNetworkInfo()
      })
    }
  }

  /**
   * Update network information
   */
  private updateNetworkInfo(): void {
    const connection = this.getConnectionInfo()
    
    if (connection) {
      this.currentNetwork = connection
      this.notifyObservers(connection)
    }
  }

  /**
   * Get connection information from browser APIs
   */
  private getConnectionInfo(): NetworkInfo | null {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection

    if (!connection) {
      return null
    }

    return {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): NetworkOptimizationConfig {
    return {
      enableImageOptimization: true,
      enableLazyLoading: true,
      enableCompression: true,
      enableCaching: true,
      adaptiveQuality: true
    }
  }

  /**
   * Adapt configuration based on network
   */
  private adaptConfigToNetwork(network: NetworkInfo): NetworkOptimizationConfig {
    const config = { ...this.config }

    // Disable heavy optimizations on slow networks
    if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
      config.enableLazyLoading = true
      config.adaptiveQuality = true
    }

    // Enable data saver optimizations
    if (network.saveData) {
      config.enableImageOptimization = true
      config.adaptiveQuality = true
    }

    return config
  }

  /**
   * Notify observers of network changes
   */
  private notifyObservers(network: NetworkInfo): void {
    this.observers.forEach(callback => {
      try {
        callback(network)
      } catch (error) {
        console.error('Error in network observer callback:', error)
      }
    })
  }
}

// Singleton instance
export const networkOptimizer = new NetworkOptimizer()
