## Story Context: c-2-publish-references-table

**Status**: done

**Epic**: C – Assembly, Status & Publishing

**User Story**: As a system, I need to track which articles have been published where so that I can prevent duplicate publishing.

**Story Classification**:
- Type: Producer (infrastructure database table)
- Tier: Tier 1 (foundational publishing infrastructure)

**Business Intent**: Create a publish references table to track which articles have been published to which platforms, enabling idempotent publishing and preventing duplicate publications.

## Contracts Required

**C1**: Database migration file for publish_references table
**C2/C4/C5**: publish_references table with proper constraints and RLS
**Terminal State**: Table exists with proper schema and constraints
**UI Boundary**: No UI events (infrastructure only)
**Analytics**: No analytics events (database infrastructure)

## Contracts Modified

- New table: publish_references
- No existing tables modified

## Contracts Guaranteed

- ✅ No UI events emitted (database infrastructure only)
- ✅ No intermediate analytics (infrastructure change only)
- ✅ No state mutation outside producer (database schema only)
- ✅ Idempotency: Table creation is idempotent via migration system
- ✅ Retry rules: Migration system handles retries automatically

## Producer Dependency Check

**Epic B Status**: COMPLETED ✅  
**Epic C Status**: in-progress  
**Story C-1 Status**: done (Article Assembly Service completed)  
**Dependencies Met**: Epic B pipeline complete, C-1 assembly service ready  
**Blocking Decision**: ALLOWED

## Acceptance Criteria

1. **Given** articles need to be published idempotently  
   **When** I create the publish_references table  
   **Then** the following columns exist:
   - `id` (UUID, primary key)
   - `article_id` (UUID, foreign key to articles)
   - `platform` (TEXT, e.g., "wordpress")
   - `platform_post_id` (TEXT, external ID from platform)
   - `platform_url` (TEXT, published URL)
   - `published_at` (TIMESTAMPTZ)
   - `created_at` (TIMESTAMPTZ)

2. **And** a unique constraint on (article_id, platform)

3. **And** RLS policies enforce organization isolation via articles table

4. **And** a migration file is created with rollback capability

## Technical Requirements

### Database Schema

**Migration File**: `supabase/migrations/[timestamp]_add_publish_references_table.sql`

```sql
CREATE TABLE IF NOT EXISTS publish_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('wordpress')),
  platform_post_id TEXT NOT NULL,
  platform_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, platform),
  UNIQUE (platform, platform_post_id)
);

CREATE INDEX idx_publish_references_article_id ON publish_references(article_id);
CREATE INDEX idx_publish_references_platform ON publish_references(platform);

-- RLS Policy
ALTER TABLE publish_references ENABLE ROW LEVEL SECURITY;

-- Note: If project has public.get_auth_user_org_id() helper, prefer that over JWT extraction
CREATE POLICY "Users can view publish references for their org" ON publish_references
  FOR SELECT USING (
    article_id IN (
      SELECT id FROM articles 
      WHERE organization_id = auth.jwt() ->> 'org_id'
    )
  );

CREATE POLICY "Users can insert publish references for their org" ON publish_references
  FOR INSERT WITH CHECK (
    article_id IN (
      SELECT id FROM articles 
      WHERE organization_id = auth.jwt() ->> 'org_id'
    )
  );
```

### Type Definitions

**File**: `types/publishing.ts`

```typescript
export interface PublishReference {
  id: string
  article_id: string
  platform: string
  platform_post_id: string
  platform_url: string
  published_at: string
  created_at: string
}

export enum PublishPlatform {
  WORDPRESS = 'wordpress'
  // Future platforms can be added here
}
```

## Architecture Compliance

### Database Architecture
- Follows existing Supabase migration patterns
- Uses UUID primary keys (consistent with existing schema)
- Implements proper foreign key relationships
- Includes proper indexing for query performance
- Enforces organization isolation via RLS

### Integration Points
- References articles table (existing)
- Supports C-3 WordPress Publishing Service (next story)
- Enables C-4 Publishing API Endpoint (future story)
- Provides foundation for C-5 Publishing UI (future story)

## Implementation Notes

### Migration Best Practices (2025)
- Use `supabase migration new` command to generate timestamped files
- Include proper rollback comments in migration files
- Test migration in local environment first
- Use `IF NOT EXISTS` patterns for safety
- Include proper indexes for performance
- Add CHECK constraints for data integrity
- Consider reverse uniqueness guards for platform safety

### Security Considerations
- RLS policies enforce organization isolation
- Cascade delete maintains referential integrity
- Unique constraint prevents duplicate publishing
- CHECK constraint prevents platform value corruption
- Reverse uniqueness prevents platform post ID reuse
- No sensitive data stored in this table

### Performance Considerations
- Indexes on article_id and platform for fast lookups
- Unique constraint enables efficient duplicate checking
- Simple schema for fast insert/query operations

## Files to Create

1. `supabase/migrations/[timestamp]_add_publish_references_table.sql` - Database migration
2. `types/publishing.ts` - TypeScript type definitions

## Files to Modify

None (this is a pure infrastructure addition)

## Testing Requirements

### Migration Testing
- [ ] Migration applies cleanly to local database
- [ ] Migration rolls back cleanly without errors
- [ ] Table created with correct schema
- [ ] Unique constraint enforced properly
- [ ] Indexes created for query performance

### RLS Testing
- [ ] Users can only see their organization's publish references
- [ ] Users can only insert for their organization's articles
- [ ] Cross-organization access properly blocked

### Integration Testing
- [ ] Foreign key relationship with articles table works
- [ ] Cascade delete maintains data integrity
- [ ] Unique constraint prevents duplicates

## Previous Story Intelligence

**C-1 Article Assembly Service**: COMPLETED ✅
- Established article completion workflow
- Articles now have proper status tracking
- Content assembly creates completed articles ready for publishing
- Provides foundation for publish references tracking

## Git Intelligence

Based on recent commits in Epic C:
- Article assembly service implemented with proper error handling
- Database migrations follow established patterns
- TypeScript types properly organized in `/types/` directory
- RLS policies consistently implemented across new tables

## Latest Technical Information

**Supabase Migration Best Practices (2025)**:
- Use `supabase migration new` command to generate timestamped files
- Include proper rollback comments in migration files
- Test migrations locally before deployment
- Use `ON DELETE CASCADE` for referential integrity
- Implement RLS policies for all new tables

**TypeScript Database Integration**:
- Supabase generates TypeScript types automatically
- Custom types should be added to `/types/` directory
- Use proper typing for database operations
- Include null safety in type definitions

## Project Context Reference

This story is part of Epic C: Assembly, Status & Publishing, which implements the final output stage of the article pipeline. The publish references table enables idempotent publishing, a key requirement for user confidence in the publishing system.

## Story Completion Status

**Dependencies**: All prerequisites met
**Architecture**: Fully compliant with existing patterns
**Implementation**: Ready for development
**Testing**: Comprehensive test plan provided
**Integration**: Properly sequenced in Epic C workflow

**Status**: ready-for-dev

---

*This story follows the canonical SM template and is ready for development with all contracts, dependencies, and technical requirements fully specified.*
