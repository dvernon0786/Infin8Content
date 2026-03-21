import crypto from "crypto"

// 🚨 CRITICAL: Check for encryption secret
const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET

// Allow missing during build time, but require at runtime
if (!INTEGRATION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn("⚠️ INTEGRATION_SECRET not set - encryption will be disabled until configured")
}

const ALGO = "aes-256-gcm"
const KEY = INTEGRATION_SECRET ? Buffer.from(INTEGRATION_SECRET, "hex") : null

// Validate key length if secret exists
if (KEY && KEY.length !== 32) {
  throw new Error(`INTEGRATION_SECRET must be 32 bytes (64 hex chars). Got ${KEY.length} bytes.`)
}

export function encrypt(value: string): string {
  if (!KEY) {
    throw new Error("INTEGRATION_SECRET is required for encryption. Please set the environment variable.")
  }
  
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(payload: string): string {
  if (!KEY) {
    throw new Error("INTEGRATION_SECRET is required for decryption. Please set the environment variable.")
  }
  
  const parts = payload.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format")
  }

  const [ivHex, tagHex, dataHex] = parts
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))
  
  try {
    return decipher.update(dataHex, "hex", "utf8") + decipher.final("utf8")
  } catch (error) {
    throw new Error("Failed to decrypt payload - invalid credentials or corrupted data")
  }
}

/**
 * Test encryption/decryption round-trip for development
 */
export function testEncryption(): boolean {
  try {
    const test = "test-password-123"
    const encrypted = encrypt(test)
    const decrypted = decrypt(encrypted)
    return test === decrypted
  } catch (error) {
    console.error("Encryption test failed:", error)
    return false
  }
}
