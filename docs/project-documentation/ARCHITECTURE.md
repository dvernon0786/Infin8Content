# Infin8Content Architecture Documentation

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Next.js App   │    │   External APIs │
│   (React 19)    │◄──►│   (App Router)  │◄──►│   (Stripe, etc)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase DB   │
                       │   PostgreSQL    │
                       └─────────────────┘
```

### Component Architecture

#### Frontend Layers

1. **Presentation Layer** (`app/`)
   - Route handlers and pages
   - Server components
   - API routes

2. **Component Layer** (`components/`)
   - Reusable UI components
   - Feature-specific components
   - Layout components

3. **Business Logic Layer** (`lib/`)
   - Service functions
   - Utility functions
   - Configuration management

4. **Data Access Layer**
   - Supabase client
   - API clients
   - Type definitions

## Database Architecture

### Supabase Integration

```typescript
// Database client configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Key Tables (Inferred)

```sql
-- Users table (managed by Supabase Auth)
users (
  id: uuid,
  email: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Organizations table
organizations (
  id: uuid,
  name: text,
  slug: text,
  owner_id: uuid,
  created_at: timestamp
)

-- Articles table
articles (
  id: uuid,
  title: text,
  content: text,
  author_id: uuid,
  organization_id: uuid,
  status: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Subscriptions table
subscriptions (
  id: uuid,
  user_id: uuid,
  stripe_customer_id: text,
  stripe_subscription_id: text,
  plan: text,
  status: text,
  created_at: timestamp
)
```

## API Architecture

### Route Structure

```
/api/
├── auth/              # Authentication endpoints
├── organizations/     # Organization management
├── articles/          # Article CRUD operations
├── payments/          # Payment webhooks
└── users/             # User management
```

### API Patterns

#### RESTful Endpoints

```typescript
// Example: Articles API
GET    /api/articles           # List articles
POST   /api/articles           # Create article
GET    /api/articles/[id]      # Get article
PUT    /api/articles/[id]      # Update article
DELETE /api/articles/[id]      # Delete article
```

#### Error Handling

```typescript
// Standardized error response
interface ApiError {
  error: string;
  message: string;
  code?: number;
  details?: any;
}
```

## Component Architecture

### Component Hierarchy

```
Layout
├── Navigation
├── Sidebar
├── Main Content
│   ├── Dashboard
│   ├── Articles
│   ├── Settings
│   └── Payment
└── Footer
```

### Component Patterns

#### 1. Server Components vs Client Components

```typescript
// Server Component (default)
export default async function ArticleList() {
  const articles = await getArticles()
  return <ArticleGrid articles={articles} />
}

// Client Component (with 'use client')
'use client'
export function ArticleEditor({ article }: { article: Article }) {
  const [content, setContent] = useState(article.content)
  return <textarea value={content} onChange={(e) => setContent(e.target.value)} />
}
```

#### 2. Composition Pattern

```typescript
// Base component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)

// Composed variants
const PrimaryButton = (props: ButtonProps) => (
  <Button variant="default" {...props} />
)
```

#### 3. Container/Presenter Pattern

```typescript
// Container (logic)
export function ArticleContainer({ id }: { id: string }) {
  const { article, loading, error } = useArticle(id)
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!article) return <NotFound />
  
  return <ArticleView article={article} />
}

// Presenter (UI)
export function ArticleView({ article }: { article: Article }) {
  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  )
}
```

## State Management Architecture

### Client State

#### React Hooks Pattern

```typescript
// Custom hook for article state
export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getArticles()
      setArticles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { articles, loading, error, fetchArticles }
}
```

#### Context API for Global State

```typescript
// Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Auth logic here
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Server State

#### Supabase Queries

```typescript
// Server-side data fetching
export async function getArticles(): Promise<Article[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}
```

## Security Architecture

### Authentication Flow

```
1. User signs in → Supabase Auth
2. Supabase returns JWT token
3. Token stored in secure cookie
4. Subsequent requests include token
5. Server validates token on each request
```

### Authorization Patterns

```typescript
// Route protection middleware
export function withAuth<T extends PagedProps>(
  Component: React.ComponentType<T>
) {
  return function AuthenticatedComponent(props: T) {
    const { user, loading } = useAuth()
    
    if (loading) return <LoadingSpinner />
    if (!user) return <LoginRedirect />
    
    return <Component {...props} />
  }
}
```

### Data Validation

```typescript
// Zod schema validation
const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  organizationId: z.string().uuid(),
})

export async function createArticle(data: unknown) {
  const validated = createArticleSchema.parse(data)
  // Process validated data
}
```

## Performance Architecture

### Code Splitting Strategy

```typescript
// Dynamic imports for route-level splitting
const Dashboard = dynamic(() => import('./Dashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const Settings = dynamic(() => import('./Settings'))
```

### Caching Strategy

#### Browser Caching
- Static assets cached via CDN
- API responses cached with appropriate headers

#### Server Caching
- Database query results cached
- Supabase edge functions for global caching

### Bundle Optimization

```typescript
// Tree shaking with explicit imports
import { Button } from '@/components/ui/button'  // ✅ Specific import
// import * as UI from '@/components/ui'          // ❌ Barrel import
```

## Integration Architecture

### Stripe Integration

```typescript
// Payment flow
1. User selects plan → Frontend
2. Create checkout session → API route
3. Redirect to Stripe → External
4. Payment completion → Stripe webhook
5. Update subscription → Database
```

### Inngest Integration

```typescript
// Background job processing
inngest.createFunction(
  { id: 'article-processing' },
  { event: 'article/created' },
  async ({ event }) => {
    // Process article asynchronously
    await generateSummary(event.data.articleId)
    await updateSearchIndex(event.data.articleId)
  }
)
```

## Deployment Architecture

### Production Stack

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel/Netlify │    │   Supabase     │    │   Stripe        │
│   (Frontend)    │    │   (Database)   │    │   (Payments)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Environment Configuration

```typescript
// Configuration management
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  stripe: {
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  },
  app: {
    name: 'Infin8Content',
    version: '0.1.0',
  }
}
```

## Monitoring & Observability

### Error Tracking
- Client-side error boundaries
- Server-side error logging
- Performance monitoring

### Analytics
- User behavior tracking
- Performance metrics
- Business KPIs

---

*This architecture documentation provides a comprehensive overview of the Infin8Content system design and implementation patterns.*
