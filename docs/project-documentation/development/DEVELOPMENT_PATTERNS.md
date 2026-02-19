# Development Patterns & Testing Guide

**Generated:** February 19, 2026  
**Version:** v2.1.0 (Zero-Legacy FSM)  
**Architecture**: Deterministic Finite State Machine  
**Status**: Production-Ready

---

## 🎯 Overview

This guide covers the development patterns, testing strategies, and best practices for working with the Infin8Content zero-legacy FSM architecture.

---

## 🏗️ Architecture Patterns

### FSM-First Development
All workflow-related code must follow FSM-first principles:

```typescript
// ✅ Correct: FSM state validation
if (workflow.state !== 'step_2_competitors') {
  return NextResponse.json({ error: 'Invalid state' }, { status: 409 });
}

// ❌ Forbidden: Legacy field references
if (workflow.current_step !== 2 || workflow.status !== 'step_2_competitors') {
  // Never reference legacy fields
}
```

### Atomic Transition Pattern
```typescript
// Execute side effects FIRST
const result = await service.executeWork(request);

// Transition state ONLY after success
const transitionResult = await WorkflowFSM.transition(workflowId, 'COMPETITORS_COMPLETED');

// Handle concurrent requests gracefully
if (!transitionResult) {
  return NextResponse.json({ success: true }); // Work already done
}
```

### Explicit Field Selection
```typescript
// ✅ Correct: Explicit field selection
const { data } = await supabase
  .from('intent_workflows')
  .select('id, state, organization_id')
  .eq('id', workflowId)
  .single();

// ❌ Forbidden: Wildcard selection
const { data } = await supabase
  .from('intent_workflows')
  .select('*') // Never use SELECT *
  .eq('id', workflowId)
  .single();
```

---

## 🔧 Service Layer Patterns

### Service Interface Pattern
All services must implement consistent interfaces:

```typescript
export interface ServiceProcessor<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
  validate(input: TInput): Promise<boolean>;
  audit(input: TInput, output: TOutput): Promise<void>;
}
```

### Dependency Injection Pattern
Use factory functions for testable dependencies:

```typescript
// ✅ Correct: Factory function
export function createExtractor(isTest = false) {
  return isTest ? new DeterministicFakeExtractor() : new DataForSEOExtractor();
}

// ❌ Forbidden: Global state
export const extractor = new DataForSEOExtractor(); // No global singletons
```

### Error Handling Pattern
```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Usage in services
if (!isValid(input)) {
  throw new ServiceError('Invalid input data', 'INVALID_INPUT', 400);
}
```

---

## 🧪 Testing Patterns

### Unit Testing Structure
```typescript
describe('ServiceName', () => {
  let service: ServiceType;
  let mockSupabase: MockSupabase;
  
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new Service(mockSupabase);
  });

  describe('execute', () => {
    it('should process valid input successfully', async () => {
      // Arrange
      const input = createValidInput();
      const expected = createExpectedOutput();
      mockSupabase.from().select().mockResolvedValue({ data: expected });

      // Act
      const result = await service.execute(input);

      // Assert
      expect(result).toEqual(expected);
      expect(mockSupabase.from).toHaveBeenCalledWith('table_name');
    });

    it('should handle invalid input gracefully', async () => {
      // Arrange
      const input = createInvalidInput();

      // Act & Assert
      await expect(service.execute(input))
        .rejects.toThrow(ServiceError);
    });
  });
});
```

### Integration Testing Pattern
```typescript
describe('API Endpoint Integration', () => {
  let app: NextApplication;
  let testOrg: Organization;
  let testUser: User;

  beforeAll(async () => {
    app = createTestApp();
    ({ testOrg, testUser } = await setupTestOrganization());
  });

  afterAll(async () => {
    await cleanupTestData(testOrg.id);
  });

  it('should handle complete workflow execution', async () => {
    // Create workflow
    const workflow = await createTestWorkflow(testOrg.id);
    
    // Execute step 1
    const step1Response = await request(app)
      .post(`/api/intent/workflows/${workflow.id}/steps/icp-generate`)
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(validICPInput);

    expect(step1Response.status).toBe(200);
    
    // Verify state transition
    const updatedWorkflow = await getWorkflow(workflow.id);
    expect(updatedWorkflow.state).toBe('step_2_competitors');
  });
});
```

### FSM Testing Pattern
```typescript
describe('FSM State Transitions', () => {
  it('should enforce valid state transitions only', async () => {
    const workflow = await createTestWorkflow({ state: 'step_2_competitors' });

    // Valid transition
    const validTransition = await WorkflowFSM.transition(
      workflow.id, 
      'COMPETITORS_COMPLETED'
    );
    expect(validTransition.applied).toBe(true);

    // Invalid transition
    const invalidTransition = await WorkflowFSM.transition(
      workflow.id, 
      'ICP_COMPLETED' // Can't go backwards
    );
    expect(invalidTransition.applied).toBe(false);
  });

  it('should handle concurrent requests atomically', async () => {
    const workflow = await createTestWorkflow({ state: 'step_3_seeds' });

    // Simulate concurrent requests
    const promises = Array(3).fill(null).map(() =>
      WorkflowFSM.transition(workflow.id, 'SEEDS_APPROVED')
    );

    const results = await Promise.all(promises);
    
    // Only one should succeed
    const successCount = results.filter(r => r.applied).length;
    expect(successCount).toBe(1);
  });
});
```

---

## 🔒 Security Patterns

### Authentication Pattern
```typescript
// API route authentication
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Organization isolation enforced by RLS
  const data = await supabase
    .from('table_name')
    .select('*')
    .eq('organization_id', currentUser.org_id);
}
```

### Authorization Pattern
```typescript
// Role-based access control
export function requireRole(requiredRole: UserRole) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = await getCurrentUser();
      
      if (!user || user.role !== requiredRole) {
        throw new ServiceError('Insufficient permissions', 'FORBIDDEN', 403);
      }

      return originalMethod.apply(this, args);
    };
  };
}

// Usage
@requireRole('admin')
export async function adminOnlyOperation() {
  // Admin-only logic
}
```

### Audit Logging Pattern
```typescript
export async function logActionAsync(params: {
  orgId: string;
  userId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await supabase.from('audit_logs').insert({
    organization_id: params.orgId,
    user_id: params.userId,
    action: params.action,
    details: params.details || {},
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });
}

// Usage in services
await logActionAsync({
  orgId: organizationId,
  userId: currentUser.id,
  action: 'workflow.step.completed',
  details: { workflowId, step: 'step_4_longtails' },
  ipAddress: extractIpAddress(request.headers),
  userAgent: extractUserAgent(request.headers),
});
```

---

## 📊 Performance Patterns

### Database Optimization
```typescript
// Efficient queries with explicit field selection
const workflows = await supabase
  .from('intent_workflows')
  .select('id, state, created_at, updated_at') // Only needed fields
  .eq('organization_id', orgId)
  .order('updated_at', { ascending: false })
  .limit(10);

// Indexed queries
const keywords = await supabase
  .from('keywords')
  .select('id, keyword, search_volume')
  .eq('organization_id', orgId)
  .eq('workflow_id', workflowId) // Use indexed columns
  .gt('search_volume', 100); // SARGable predicate
```

### Caching Pattern
```typescript
// Service-level caching with TTL
export class CachedService {
  private cache = new Map<string, { data: any; expiry: number }>();

  async get(key: string): Promise<any> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const data = await this.fetchFromSource(key);
    this.cache.set(key, { data, expiry: Date.now() + 5 * 60 * 1000 }); // 5 min TTL
    
    return data;
  }
}
```

### Batch Processing Pattern
```typescript
// Process items in batches to avoid rate limits
export async function processBatch<T>(
  items: T[],
  processor: (batch: T[]) => Promise<void>,
  batchSize: number = 10
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
    
    // Rate limiting delay
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

---

## 🔄 Real-time Patterns

### Supabase Subscription Pattern
```typescript
export function useWorkflowSubscription(workflowId: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`workflow-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'intent_workflows',
          filter: `id=eq.${workflowId}`
        },
        (payload) => {
          setWorkflow(payload.new as Workflow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId]);

  return workflow;
}
```

### Optimistic Updates Pattern
```typescript
export function useOptimisticUpdate<T>(
  queryKey: string[],
  updateFn: (oldData: T) => T
) {
  const queryClient = useQueryClient();

  return useCallback((updateData: Partial<T>) => {
    // Optimistic update
    queryClient.setQueryData(queryKey, (old: T) => 
      updateFn({ ...old, ...updateData })
    );

    // Actual update
    return updateData;
  }, [queryClient, queryKey, updateFn]);
}
```

---

## 🛠️ Code Quality Patterns

### Type Safety Pattern
```typescript
// Strong typing for all interfaces
export interface Workflow {
  id: string;
  state: WorkflowState; // Enum, not string
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Type guards for runtime validation
export function isWorkflow(obj: unknown): obj is Workflow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'state' in obj &&
    'organization_id' in obj &&
    isWorkflowState(obj.state) // Validate enum
  );
}
```

### Error Boundary Pattern
```typescript
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 📋 Testing Checklist

### Before Submitting Code
- [ ] All new services have unit tests with >90% coverage
- [ ] API endpoints have integration tests
- [ ] FSM transitions are tested for validity and concurrency
- [ ] Authentication and authorization are tested
- [ ] Error handling scenarios are covered
- [ ] Database queries use explicit field selection
- [ ] No legacy field references (`status`, `current_step`, etc.)
- [ ] Audit logging is implemented for all actions
- [ ] Type safety is maintained throughout

### Performance Testing
- [ ] Database queries are optimized
- [ ] Rate limiting is respected
- [ ] Memory usage is within limits
- [ ] Response times are acceptable
- [ ] Concurrent request handling works correctly

### Security Testing
- [ ] RLS policies enforce organization isolation
- [ ] Authentication is required for protected endpoints
- [ ] Authorization checks are in place
- [ ] Input validation prevents injection attacks
- [ ] Audit trail is complete

---

## 🔧 Development Tools

### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "no-console": "warn"
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 📚 Additional Resources

### Documentation
- [FSM Workflow Guide](./workflows/FSM_WORKFLOW_GUIDE.md) - FSM architecture
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Database Schema](./DATABASE_SCHEMA.md) - Database design

### Code Examples
- `lib/services/intent-engine/` - Service layer examples
- `app/api/intent/workflows/` - API endpoint patterns
- `__tests__/` - Testing examples and patterns

---

*This development guide reflects the current zero-legacy FSM architecture. Last updated: February 19, 2026.*
