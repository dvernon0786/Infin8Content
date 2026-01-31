/**
 * Encryption utilities for sensitive data using PostgreSQL pgcrypto
 * Story 33.2: Configure Organization ICP Settings
 */

import { createClient } from '@/lib/supabase/server'

// Encryption key from environment variables
const ENCRYPTION_KEY = process.env.ICP_ENCRYPTION_KEY || 'default-key-change-in-production'

/**
 * Encrypts sensitive data using PostgreSQL pgcrypto
 * @param data - The data to encrypt
 * @returns Promise<string> - Encrypted data as base64 string
 */
export async function encryptData(data: any): Promise<string> {
  const supabase = await createClient()
  
  try {
    const { data: result, error } = await supabase
      .rpc('encrypt_sensitive_data', {
        data_to_encrypt: JSON.stringify(data),
        encryption_key: ENCRYPTION_KEY
      })

    if (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }

    return result as string
  } catch (error) {
    console.error('Encryption failed:', error)
    throw error
  }
}

/**
 * Decrypts sensitive data using PostgreSQL pgcrypto
 * @param encryptedData - The encrypted data (base64 string)
 * @returns Promise<any> - Decrypted data
 */
export async function decryptData(encryptedData: string): Promise<any> {
  const supabase = await createClient()
  
  try {
    const { data: result, error } = await supabase
      .rpc('decrypt_sensitive_data', {
        encrypted_data: encryptedData,
        encryption_key: ENCRYPTION_KEY
      })

    if (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }

    return JSON.parse(result as string)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw error
  }
}

/**
 * Encrypts ICP settings fields that contain sensitive business information
 * @param icpData - Raw ICP settings data
 * @returns Promise<Record<string, any>> - Encrypted data package
 */
export async function encryptICPFields(icpData: {
  target_industries: string[]
  buyer_roles: string[]
  pain_points: string[]
  value_proposition: string
}): Promise<Record<string, any>> {
  // Identify sensitive fields that should be encrypted
  const sensitiveFields = {
    buyer_roles: icpData.buyer_roles, // Buyer roles can be sensitive
    pain_points: icpData.pain_points, // Pain points are highly sensitive
    value_proposition: icpData.value_proposition // Value proposition is business intelligence
  }

  // Encrypt sensitive fields
  const encrypted = await encryptData(sensitiveFields)

  return {
    encrypted_fields: encrypted,
    encryption_version: '1.0',
    encrypted_at: new Date().toISOString(),
    // Keep less sensitive fields as plaintext for querying
    public_industries: icpData.target_industries
  }
}

/**
 * Decrypts ICP settings fields
 * @param encryptedData - The encrypted data package from database
 * @returns Promise<{target_industries: string[], buyer_roles: string[], pain_points: string[], value_proposition: string}>
 */
export async function decryptICPFields(encryptedData: Record<string, any>): Promise<{
  target_industries: string[]
  buyer_roles: string[]
  pain_points: string[]
  value_proposition: string
}> {
  try {
    const decrypted = await decryptData(encryptedData.encrypted_fields)

    return {
      target_industries: encryptedData.public_industries || [],
      buyer_roles: decrypted.buyer_roles || [],
      pain_points: decrypted.pain_points || [],
      value_proposition: decrypted.value_proposition || ''
    }
  } catch (error) {
    console.error('Failed to decrypt ICP fields:', error)
    throw new Error('ICP data decryption failed')
  }
}
