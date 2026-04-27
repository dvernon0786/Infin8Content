/**
 * WORKFLOW STEPS CARD STRUCTURE
 * Complete code for all 9 workflow steps
 * URL: /workflows/[id]/steps/[1-9]
 *
 * This file contains:
 * 1. Shared layout (WorkflowStepLayoutClient)
 * 2. All 9 step page components
 * 3. All 9 step form components
 * 4. Data structures for each step
 */

// ============================================================================
// SHARED LAYOUT & COMPONENTS
// ============================================================================

/**
 * WorkflowStepLayoutClient - Shared wrapper for all steps
 * Location: /components/workflows/WorkflowStepLayoutClient.tsx
 *
 * Features:
 * - Progress bar (11% → 100%)
 * - Step navigation (ICP → Competitors → ... → Articles)
 * - Header with step name
 * - Back/Continue buttons
 * - Failure state display
 */

interface WorkflowStepLayoutClientProps {
  workflow: WorkflowState
  step: number  // 1-9
  children: React.ReactNode
}

const STEP_NARRATIVE = [
  'ICP',          // Step 1
  'Competitors',  // Step 2
  'Seeds',        // Step 3
  'Longtails',    // Step 4
  'Filtering',    // Step 5
  'Clustering',   // Step 6
  'Validation',   // Step 7
  'Subtopics',    // Step 8
  'Articles',     // Step 9
]

const PROGRESS_WIDTH = [
  'w-[11%]',   // Step 1: 11%
  'w-[22%]',   // Step 2: 22%
  'w-[33%]',   // Step 3: 33%
  'w-[44%]',   // Step 4: 44%
  'w-[55%]',   // Step 5: 55%
  'w-[66%]',   // Step 6: 66%
  'w-[77%]',   // Step 7: 77%
  'w-[88%]',   // Step 8: 88%
  'w-full',    // Step 9: 100%
]

// ============================================================================
// STEP 1: ICP (Ideal Customer Profile)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/1/page.tsx
 */
export default async function Step1Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 1)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={1}>
      <Step1ICPForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}

/**
 * Form Component: /components/workflows/steps/Step1ICPForm.tsx
 * Card Title: "ICP"
 * Description: Define your ideal customer profile
 */
interface Step1ICPFormProps {
  workflowId: string
}

export function Step1ICPForm({ workflowId }: Step1ICPFormProps) {
  const [form, setForm] = useState({
    organizationName: '',
    organizationUrl: '',
    organizationLinkedInUrl: '',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ideal Customer Profile</CardTitle>
        <CardDescription>
          Enter information about your organization to generate an ICP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Organization Name</label>
          <Input
            placeholder="e.g., Your Company Name"
            value={form.organizationName}
            onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Organization Website</label>
          <Input
            placeholder="https://yourcompany.com"
            value={form.organizationUrl}
            onChange={(e) => setForm({ ...form, organizationUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">LinkedIn Company URL</label>
          <Input
            placeholder="https://linkedin.com/company/yourcompany"
            value={form.organizationLinkedInUrl}
            onChange={(e) => setForm({ ...form, organizationLinkedInUrl: e.target.value })}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate ICP'
          )}
        </Button>

        {error && <div className="text-sm text-destructive">{error}</div>}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// STEP 2: COMPETITORS
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/2/page.tsx
 */
export default async function Step2Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 2)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={2}>
      <Step2CompetitorsForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}

/**
 * Form Component: /components/workflows/steps/Step2CompetitorsForm.tsx
 * Card Title: "Competitors"
 * Description: Identify your main competitors
 */
interface Step2CompetitorsFormProps {
  workflowId: string
}

export function Step2CompetitorsForm({ workflowId }: Step2CompetitorsFormProps) {
  const [competitors, setCompetitors] = useState<string[]>(['', '', ''])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitors</CardTitle>
        <CardDescription>
          Enter the websites of your main competitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {competitors.map((url, idx) => (
          <div key={idx} className="space-y-2">
            <label className="text-sm font-medium">Competitor {idx + 1}</label>
            <Input
              placeholder="https://competitor.com"
              value={url}
              onChange={(e) => {
                const newCompetitors = [...competitors]
                newCompetitors[idx] = e.target.value
                setCompetitors(newCompetitors)
              }}
            />
          </div>
        ))}

        <Button onClick={handleSubmit} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Competitors'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// STEP 3: SEEDS (Keyword Seeds)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/3/page.tsx
 */
export default async function Step3Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 3)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={3}>
      <Step3SeedsForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}

/**
 * Form Component: /components/workflows/steps/Step3SeedsForm.tsx
 * Card Title: "Seeds"
 * Description: Enter seed keywords
 */
interface Step3SeedsFormProps {
  workflowId: string
}

export function Step3SeedsForm({ workflowId }: Step3SeedsFormProps) {
  const [seeds, setSeeds] = useState<string>('')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed Keywords</CardTitle>
        <CardDescription>
          Enter seed keywords (one per line). These will be used to generate keyword opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          placeholder="seo optimization&#10;content marketing&#10;keyword research"
          value={seeds}
          onChange={(e) => setSeeds(e.target.value)}
          className="w-full h-32 p-2 border rounded-md"
        />

        <Button onClick={handleSubmit} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Extracting...
            </>
          ) : (
            'Extract Keywords'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// STEP 4: LONGTAILS (Longtail Expansion)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/4/page.tsx
 * Redirects to /workflows/[id]/progress
 *
 * This is an automated pipeline step (no interactive form)
 * Status: Shows "In Progress" → "Completed"
 */
export default async function Step4Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 4)

  // Auto-redirect to progress page
  redirect(`/workflows/${id}/progress`)
}

/**
 * What happens in Step 4:
 * - System expands seed keywords to longtail variations
 * - Example: "seo" → ["seo tips", "seo checklist", "advanced seo"]
 * - Automatic (no user interaction)
 * - User sees progress on /workflows/[id]/progress page
 */

// ============================================================================
// STEP 5: FILTERING (Keyword Filtering)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/5/page.tsx
 * Redirects to /workflows/[id]/progress
 *
 * This is an automated pipeline step (no interactive form)
 * Status: Shows "In Progress" → "Completed"
 */
export default async function Step5Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 5)

  // Auto-redirect to progress page
  redirect(`/workflows/${id}/progress`)
}

/**
 * What happens in Step 5:
 * - Filter keywords by:
 *   - Search volume
 *   - Competition level
 *   - Relevance to ICP
 * - Automatic (no user interaction)
 * - User sees progress on /workflows/[id]/progress page
 */

// ============================================================================
// STEP 6: CLUSTERING (Topic Clustering)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/6/page.tsx
 * Redirects to /workflows/[id]/progress
 *
 * This is an automated pipeline step (no interactive form)
 * Status: Shows "In Progress" → "Completed"
 */
export default async function Step6Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 6)

  // Auto-redirect to progress page
  redirect(`/workflows/${id}/progress`)
}

/**
 * What happens in Step 6:
 * - Group similar keywords into semantic clusters
 * - Example cluster: ["seo", "search engine optimization", "seo ranking"]
 * - Create topic groups for content strategy
 * - Automatic (no user interaction)
 * - User sees progress on /workflows/[id]/progress page
 */

// ============================================================================
// STEP 7: VALIDATION (Cluster Validation)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/7/page.tsx
 * Redirects to /workflows/[id]/progress
 *
 * This is an automated pipeline step (no interactive form)
 * Status: Shows "In Progress" → "Completed"
 */
export default async function Step7Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 7)

  // Auto-redirect to progress page
  redirect(`/workflows/${id}/progress`)
}

/**
 * What happens in Step 7:
 * - Validate keyword clusters
 * - Check cluster coherence
 * - Remove outliers
 * - Ensure data quality
 * - Automatic (no user interaction)
 * - User sees progress on /workflows/[id]/progress page
 */

// ============================================================================
// STEP 8: SUBTOPICS (Generate Subtopics)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/8/page.tsx
 */
export default async function Step8Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 8)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={8}>
      <Step8SubtopicsForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}

/**
 * Form Component: /components/workflows/steps/Step8SubtopicsForm.tsx
 * Card Title: "Subtopics"
 * Description: Review and approve generated subtopics
 *
 * User can:
 * - View generated subtopics
 * - Edit subtopic names
 * - Add/remove subtopics
 * - Approve to move to Step 9
 */
interface Step8SubtopicsFormProps {
  workflowId: string
}

export function Step8SubtopicsForm({ workflowId }: Step8SubtopicsFormProps) {
  const [subtopics, setSubtopics] = useState<string[]>([
    'SEO Basics',
    'On-Page Optimization',
    'Technical SEO',
    'Link Building',
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Subtopics</CardTitle>
        <CardDescription>
          Review and approve the generated subtopics for your content strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subtopics.map((topic, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={topic}
              onChange={(e) => {
                const newSubtopics = [...subtopics]
                newSubtopics[idx] = e.target.value
                setSubtopics(newSubtopics)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSubtopics(subtopics.filter((_, i) => i !== idx))
              }}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button variant="outline" className="w-full">
          Add Subtopic
        </Button>

        <Button onClick={handleSubmit} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Articles...
            </>
          ) : (
            'Generate Articles'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// STEP 9: ARTICLES (Generate Articles)
// ============================================================================

/**
 * Page Component: /app/workflows/[id]/steps/9/page.tsx
 */
export default async function Step9Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 9)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={9}>
      <Step9ArticlesForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}

/**
 * Form Component: /components/workflows/steps/Step9ArticlesForm.tsx
 * Card Title: "Articles"
 * Description: Generate articles for your workflow
 *
 * User can:
 * - Select which subtopics to generate articles for
 * - Configure article settings
 * - Start article generation
 * - Track generation progress
 */
interface Step9ArticlesFormProps {
  workflowId: string
}

export function Step9ArticlesForm({ workflowId }: Step9ArticlesFormProps) {
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([
    'SEO Basics',
    'On-Page Optimization',
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Articles</CardTitle>
        <CardDescription>
          Select subtopics to generate articles for
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {['SEO Basics', 'On-Page Optimization', 'Technical SEO', 'Link Building'].map((topic) => (
            <label key={topic} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedSubtopics.includes(topic)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSubtopics([...selectedSubtopics, topic])
                  } else {
                    setSelectedSubtopics(selectedSubtopics.filter(t => t !== topic))
                  }
                }}
              />
              {topic}
            </label>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate ${selectedSubtopics.length} Articles`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// PROGRESS PAGE (for automated steps 4-7)
// ============================================================================

/**
 * Page Component: /workflows/[id]/progress
 *
 * Shown when user is on steps 4-7 (automated pipeline)
 * Displays:
 * - Current step progress
 * - Overall workflow progress
 * - Real-time status updates
 * - Error handling for failed steps
 */

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * WORKFLOW STEPS SUMMARY
 *
 * Interactive Steps (User Input Required):
 * ✓ Step 1: ICP - Define ideal customer profile
 * ✓ Step 2: Competitors - Identify competitors
 * ✓ Step 3: Seeds - Enter seed keywords
 * ✓ Step 8: Subtopics - Review/approve generated subtopics
 * ✓ Step 9: Articles - Select subtopics and generate articles
 *
 * Automated Steps (No User Input):
 * → Step 4: Longtails - Auto-expand keywords
 * → Step 5: Filtering - Auto-filter keywords
 * → Step 6: Clustering - Auto-cluster topics
 * → Step 7: Validation - Auto-validate clusters
 *
 * Progress Tracking:
 * - Progress bar updates as user progresses
 * - Step navigation with arrows
 * - Current step highlighted in narrative
 * - Failure state handling
 * - Analytics tracking for each step
 *
 * URL Pattern:
 * /workflows/[id]/steps/1 → ICP form
 * /workflows/[id]/steps/2 → Competitors form
 * /workflows/[id]/steps/3 → Seeds form
 * /workflows/[id]/progress → Show progress for steps 4-7
 * /workflows/[id]/steps/8 → Subtopics form
 * /workflows/[id]/steps/9 → Articles form
 */
