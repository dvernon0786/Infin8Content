# Infin8Content Project Documentation

## Project Overview

**Project Name**: Infin8Content  
**Version**: 0.1.0  
**Type**: Next.js Web Application  
**Author**: Dghost  
**Generated**: 2026-01-10  

### Description

Infin8Content is a modern content management platform built with Next.js 16, React 19, and TypeScript. The application provides content creation, management, and collaboration features with integrated payment processing via Stripe and backend services through Supabase.

## Technology Stack

### Frontend Framework
- **Next.js**: 16.1.1 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x

### UI & Styling
- **Tailwind CSS**: 4.x
- **Radix UI**: Component library (Dialog, Dropdown, Avatar, etc.)
- **Lucide React**: Icons
- **Class Variance Authority**: Component styling

### Backend & Database
- **Supabase**: Database and authentication
- **Inngest**: Background job processing
- **PostgreSQL**: Database (via Supabase)

### Payment Processing
- **Stripe**: Payment processing (v20.1.0)
- **@stripe/stripe-js**: Client-side Stripe integration

### Development & Testing
- **Vitest**: Unit testing
- **Playwright**: E2E testing
- **ESLint**: Code linting
- **Testing Library**: React testing utilities

## Project Structure

```
infin8content/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── payment/           # Payment pages
│   └── settings/          # Settings pages
├── components/            # React components
│   ├── articles/          # Article-related components
│   ├── dashboard/         # Dashboard components
│   ├── guards/            # Route guards
│   ├── research/          # Research components
│   ├── settings/          # Settings components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── config/           # Configuration files
│   ├── inngest/          # Inngest functions
│   ├── services/         # Service layer
│   └── utils.ts          # Utility functions
└── tests/                 # Test files
```

## Key Features

### Authentication & Authorization
- Supabase-based authentication
- Route guards and middleware
- Organization-based access control

### Content Management
- Article creation and editing
- Content organization and categorization
- Collaboration features

### Payment Integration
- Stripe payment processing
- Subscription management
- Multiple pricing tiers

### Dashboard & Analytics
- User dashboard
- Content analytics
- Performance metrics

## Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...

# Database
DATABASE_URL=postgresql://...
```

## Development Workflow

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Fill in environment variables
   ```

3. **Database setup**:
   ```bash
   supabase start  # For local development
   # or configure hosted Supabase
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests (Vitest)
- `npm run test:ui` - Run tests with UI
- `npm run test:e2e` - Run E2E tests (Playwright)

## Testing Strategy

### Unit Testing
- **Framework**: Vitest
- **Location**: `/tests/` directory
- **Coverage**: Components, hooks, utilities

### E2E Testing
- **Framework**: Playwright
- **Location**: `/tests/e2e/` directory
- **Coverage**: Critical user journeys

### Test Commands
```bash
# Unit tests
npm run test              # Run all tests
npm run test:ui           # Run with UI
npm run test:run          # Run once

# E2E tests
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:headed   # Run headed mode
```

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Requirements
- Node.js 18+
- PostgreSQL database
- Supabase project
- Stripe account

## Architecture Patterns

### Component Architecture
- **Atomic Design**: Components organized by complexity
- **Composition**: Heavy use of React composition patterns
- **Separation of Concerns**: Clear separation between UI and logic

### State Management
- **Server Components**: Leveraging Next.js App Router
- **Client State**: React hooks and context
- **Server State**: Supabase queries and mutations

### API Design
- **RESTful API**: Standard REST patterns
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error boundaries

## Security Considerations

- **Authentication**: Supabase auth with JWT tokens
- **Authorization**: Role-based access control
- **Data Validation**: Zod schemas for validation
- **Environment Variables**: Secure configuration management
- **CORS**: Proper cross-origin resource sharing

## Performance Optimizations

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: Supabase and browser caching
- **Bundle Optimization**: Tree shaking and minification

## Known Issues & Limitations

- **Environment Setup**: Requires multiple external services
- **Database Migrations**: Manual migration process
- **Test Coverage**: E2E tests need expansion

## Future Enhancements

- **Real-time Features**: WebSocket integration
- **Advanced Analytics**: Custom analytics dashboard
- **Mobile App**: React Native companion app
- **API Rate Limiting**: Enhanced API security

---

*This documentation was automatically generated as part of the project documentation workflow. Last updated: 2026-01-10*
