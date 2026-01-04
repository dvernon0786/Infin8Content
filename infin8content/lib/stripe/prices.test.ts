/**
 * Stripe Price ID Mapping Tests
 * 
 * Unit tests for getPriceId function and price ID mapping
 */

import { describe, it, expect } from 'vitest'
import { getPriceId, type PlanType, type BillingFrequency } from './prices'

describe('getPriceId', () => {
  it('should return starter monthly price ID', () => {
    const priceId = getPriceId('starter', 'monthly')
    expect(priceId).toBeDefined()
    expect(typeof priceId).toBe('string')
  })

  it('should return starter annual price ID', () => {
    const priceId = getPriceId('starter', 'annual')
    expect(priceId).toBeDefined()
    expect(typeof priceId).toBe('string')
  })

  it('should return pro monthly price ID', () => {
    const priceId = getPriceId('pro', 'monthly')
    expect(priceId).toBeDefined()
    expect(typeof priceId).toBe('string')
  })

  it('should return pro annual price ID', () => {
    const priceId = getPriceId('pro', 'annual')
    expect(priceId).toBeDefined()
    expect(typeof priceId).toBe('string')
  })

  it('should return agency monthly price ID', () => {
    const priceId = getPriceId('agency', 'monthly')
    expect(priceId).toBeDefined()
    expect(typeof priceId).toBe('string')
  })

  it('should return agency annual price ID', () => {
    const priceId = getPriceId('agency', 'annual')
    expect(priceId).toBeDefined()
    expect(typeof priceId).toBe('string')
  })
})

