# Infin8Content Project Documentation

## Overview

This directory contains comprehensive documentation for the Infin8Content project, automatically generated through the document-project workflow.

## Documentation Structure

### Core Documentation

- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Complete project overview, technology stack, and features
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, design patterns, and technical implementation
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Development setup, coding standards, and workflow

### Quick Reference

#### Technology Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL), Inngest
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Payments**: Stripe
- **Testing**: Vitest, Playwright

#### Key Features
- Content management system
- User authentication & authorization
- Subscription-based payment processing
- Real-time collaboration
- Analytics dashboard

#### Project Structure
```
infin8content/
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                    # Utilities and services
├── hooks/                  # Custom React hooks
└── tests/                  # Test files
```

## Getting Started

### For Developers

1. **Read the [Development Guide](./DEVELOPMENT_GUIDE.md)** for setup instructions
2. **Review the [Architecture documentation](./ARCHITECTURE.md)** for system understanding
3. **Check the [Project Overview](./PROJECT_OVERVIEW.md)** for feature context

### For System Administrators

1. **Review environment requirements** in Development Guide
2. **Understand the deployment architecture** in Architecture documentation
3. **Configure external services** (Supabase, Stripe)

## Documentation Maintenance

This documentation was generated on **2026-01-10** and should be updated when:

- Major architectural changes are made
- New features are added
- Technology stack is updated
- Deployment processes change

## External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Support

For questions about this documentation or the Infin8Content project:

1. Check the relevant documentation file
2. Review the codebase for current implementation
3. Contact the development team

---

*This documentation is part of the Infin8Content project and is maintained alongside the codebase.*
