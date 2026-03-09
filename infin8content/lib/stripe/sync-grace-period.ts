/**
 * syncGracePeriod
 *
 * Single source of truth for grace_period_started_at transitions across
 * all four Stripe webhook handlers. Eliminates the class of bugs caused by
 * each handler independently managing grace state with scattered conditionals.
 *
 * FULL STATE TRANSITION TABLE
 * ─────────────────────────────────────────────────────────────────────────────
 * prev_status   new_status   action   reason
 * ─────────────────────────────────────────────────────────────────────────────
 * active        past_due     SET      First payment failure — open grace window
 * active        suspended    SET      Direct suspension — open grace window
 * active        canceled     SET      Voluntary cancel — earned grace window
 * trialing      past_due     SET      Payment failure during trial
 * trialing      suspended    SET      Direct suspension during trial
 * trialing      canceled     CLEAR    Trial cancel — no earned grace
 * past_due      past_due     SET      Repeated failure — RESET clock (intentional)
 * past_due      suspended    KEEP     Already in grace — don't extend, don't cut short
 * past_due      active       CLEAR    Payment recovered — close grace window
 * past_due      canceled     CLEAR    Delinquent cancel — no earned grace
 * suspended     active       CLEAR    Payment recovered — close grace window
 * suspended     canceled     CLEAR    Suspended cancel — no earned grace
 * canceled      *            KEEP     Terminal state — no-op
 * *             active       CLEAR    Catch-all: recovering to active always clears
 * *             *            KEEP     Default — don't touch what we don't understand
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   const grace = syncGracePeriod(organization.payment_status, newPaymentStatus)
 *   if (grace.action !== 'keep') updateData.grace_period_started_at = grace.value
 */

type OrgStatus = 'active' | 'trialing' | 'past_due' | 'suspended' | 'canceled' | string

type GraceResult =
    | { action: 'set'; value: string }  // write new timestamp
    | { action: 'clear'; value: null }  // write null
    | { action: 'keep' }  // do not write the field at all

export function syncGracePeriod(
    prevStatus: OrgStatus | null | undefined,
    newStatus: OrgStatus
): GraceResult {
    const prev = (prevStatus ?? '').toLowerCase()
    const next = newStatus.toLowerCase()

    // ── Recovering to active always clears grace, regardless of prior state ──
    if (next === 'active') {
        return { action: 'clear', value: null }
    }

    // ── Terminal: canceled org should not have grace mutated ──
    if (prev === 'canceled') {
        return { action: 'keep' }
    }

    // ── Delinquent transitions ────────────────────────────────────────────────

    // Active/trialing → past_due: open grace window
    if ((prev === 'active' || prev === 'trialing') && next === 'past_due') {
        return { action: 'set', value: new Date().toISOString() }
    }

    // Active/trialing → suspended: open grace window
    if ((prev === 'active' || prev === 'trialing') && next === 'suspended') {
        return { action: 'set', value: new Date().toISOString() }
    }

    // Active → canceled: earned grace on voluntary cancellation
    if (prev === 'active' && next === 'canceled') {
        return { action: 'set', value: new Date().toISOString() }
    }

    // Trialing → canceled: no earned grace
    if (prev === 'trialing' && next === 'canceled') {
        return { action: 'clear', value: null }
    }

    // past_due → past_due: RESET clock on repeated failure (intentional policy)
    if (prev === 'past_due' && next === 'past_due') {
        return { action: 'set', value: new Date().toISOString() }
    }

    // past_due → suspended: grace window already running — do not touch
    if (prev === 'past_due' && next === 'suspended') {
        return { action: 'keep' }
    }

    // past_due → canceled: delinquent cancel — no earned grace
    if (prev === 'past_due' && next === 'canceled') {
        return { action: 'clear', value: null }
    }

    // suspended → canceled: no earned grace
    if (prev === 'suspended' && next === 'canceled') {
        return { action: 'clear', value: null }
    }

    // Catch-all: any unhandled transition into a delinquent state opens grace.
    // Covers null/undefined prev and any unrecognised prior status.
    // Safer to open a window than to silently skip it.
    if (next === 'past_due' || next === 'suspended') {
        return { action: 'set', value: new Date().toISOString() }
    }

    // Default: unknown transition — do not mutate
    return { action: 'keep' }
}

/**
 * applyGracePeriod
 *
 * Convenience wrapper. Mutates updateData in place and returns it.
 * Also clears suspended_at when recovering to active.
 *
 * @param updateData   - The partial org update object being built
 * @param prevStatus   - org.payment_status from the DB read
 * @param newStatus    - The payment_status being written
 */
export function applyGracePeriod(
    updateData: Record<string, any>,
    prevStatus: OrgStatus | null | undefined,
    newStatus: OrgStatus
): Record<string, any> {
    const grace = syncGracePeriod(prevStatus, newStatus)

    if (grace.action === 'set') {
        updateData.grace_period_started_at = grace.value
    } else if (grace.action === 'clear') {
        updateData.grace_period_started_at = null
        // Also clear suspension metadata on recovery
        if (newStatus === 'active') {
            updateData.suspended_at = null
        }
    }
    // 'keep': write nothing

    return updateData
}
