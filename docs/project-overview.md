# Project Overview - Infin8Content

Generated: 2026-02-26  

## Purpose

Infin8Content is a high-performance, AI-driven content generation platform designed for organizations. It automates the research, outlining, and writing of articles while integrating with SEO tools and publishing platforms like WordPress.

## Key Capabilities

- **Automated Research**: Uses Tavily and DataForSEO for deep keyword and competitor analysis.
- **AI Writing**: Integrates with OpenRouter to leverage cutting-edge LLMs (Gemini, Llama) for content creation.
- **Workflow Management**: Sophisticated state management for complex content pipelines.
- **Scalable SaaS**: Multi-tenant architecture with Stripe subscription management.
- **Compliance & Audit**: Comprehensive logging of all system and user actions.

## Repository Structure

The project is organized as a monorepo:

- **infin8content/**: The main Next.js web application.
- **tools/**: Internal utilities, including custom ESLint plugins for design system compliance.
- **_bmad/**: The BMad framework providing management and planning workflows.
- **supabase/**: PostgreSQL schema and database migration management.

## Architecture Highlights

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind 4.
- **Backend**: Supabase (Auth, DB, RLS), Inngest (Workflows).
- **Integrations**: OpenRouter, Stripe, Brevo, WordPress.

For detailed information, see the [Master Index](./index.md).
