-- Migration: Enable PL/pgSQL language
-- Date: 2026-02-12
-- Purpose: Enable stored procedure language for cost enforcement functions

-- Enable PL/pgSQL language if not already enabled
CREATE EXTENSION IF NOT EXISTS plpgsql;
