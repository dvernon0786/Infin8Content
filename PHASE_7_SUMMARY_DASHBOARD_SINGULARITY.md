# Phase 7: Article Engine Decoupling & Dashboard Singularity

**Date:** February 26, 2026
**Status:** ✅ PRODUCTION CERTIFIED
**Architecture:** Zero-Drift Decoupled FSM

## 🎯 Architectural shift: Dashboard Singularity

The "Dashboard Singularity" refactor has successfully eliminated all shadow orchestration layers. The database is now the **Single Source of Truth** for both the generation pipeline and the frontend display.

### 1. Unified Generation Path (Mechanical Pureness)
- **Step 9** now only plans; it seeds articles into a `queued` state.
- **Workers** (Inngest) are the only state mutators.
- **FSM** (Internal) manages atomic "compare-and-swap" transitions to prevent race conditions.
- **Scheduler** (Cron) fetch-and-fires queued articles based on quota availability.

### 2. Frontend Realtime Hardening
The `use-realtime-articles.ts` hook has been rewritten for clinical architectural purity:
- **Direct Supabase RLS**: No proxy APIs. No backend "Dashboard Service".
- **Realtime Subscription**: Pure `postgres_changes` subscription on the `articles` table.
- **Ref-Hardened Callbacks**: All external callbacks (`onDashboardUpdate`, `onConnectionChange`, `onError`) and the `fetchArticles` logic are wrapped in `useRef`.
- **Subscription Isolation**: The subscription lifecycle depends only on `orgId` and `supabase`, making it immune to parent component render churn and re-subscription loops.
- **Deterministic Re-fetch**: Payload data is ignored; any change triggers a full DB re-fetch to ensure zero-drift state.

## 🔍 Validation Results
- **Atomic Safety**: ✅ TESTED. Illegal state transitions are rejected.
- **Idempotency**: ✅ VERIFIED. Repeat event emissions do not disrupt pipeline.
- **Subscription Stability**: ✅ CERTIFIED. Subscription remains stable through rerenders.
- **Data Purity**: ✅ ENFORCED. No local state patching; DB is authority.

## 🏁 Operational Status
The Article Engine is now mathematically sealed and production-certified.

**Status: READY FOR PRODUCTION DEPLOYMENT** 🚀
