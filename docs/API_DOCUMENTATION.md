# API Documentation - ICP Generation with Cost Governance

## 🏆 **Enterprise-Grade AI Cost Infrastructure**

### **Completed: February 12, 2026**

---

## **🚀 Endpoint Overview**

### **POST /api/intent/workflows/{workflow_id}/steps/icp-generate**

**Purpose**: Generate ICP document with atomic cost governance
**Classification**: Enterprise financial infrastructure

---

## **📋 Request Specification**

### **Headers**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

### **Body**
```json
{
  "organization_name": "Example Corp",
  "organization_url": "https://example.com", 
  "organization_linkedin_url": "https://linkedin.com/company/example"
}
```

### **Validation**
- All fields required
- URLs must be valid format
- User must be authenticated
- Organization isolation enforced

---

## **🔄 Execution Flow**

### **Phase 1: Authorization (Pre-Call)**
```ts
// Atomic cost check - no database mutation
const canProceed = await checkWorkflowCostLimit(
  workflowId, 
  estimatedMaxCost, 
  1.00 // $1.00 hard limit
)

if (!canProceed) {
  throw new Error('Workflow AI cost limit exceeded')
}
```

### **Phase 2: AI Execution**
```ts
// Deterministic model routing
const result = await generateContent(messages, {
  model: 'perplexity/sonar',
  maxTokens: 700,
  temperature: 0.3,
  disableFallback: false
})
```

### **Phase 3: Settlement (Post-Call)**
```ts
// Bank-grade atomic transaction
await record_usage_and_increment({
  workflow_id: workflowId,
  organization_id: organizationId,
  model: result.modelUsed,
  prompt_tokens: result.promptTokens,
  completion_tokens: result.completionTokens,
  cost: result.cost
})
```

---

## **📊 Response Specification**

### **Success Response (200)**
```json
{
  "success": true,
  "workflow_id": "63fc648d-1518-405a-8e17-05973c608c71",
  "status": "step_1_icp",
  "icp_data": {
    "industries": ["SaaS", "Enterprise Software"],
    "buyerRoles": ["CTO", "VP Engineering"],
    "painPoints": ["Manual processes", "Scalability issues"],
    "valueProposition": "Automated workflow optimization"
  },
  "metadata": {
    "tokens_used": 1853,
    "model_used": "perplexity/sonar",
    "ai_cost": 0.00132,
    "generated_at": "2026-02-12T01:05:29.967Z",
    "retry_count": 1
  }
}
```

### **Error Responses**

#### **Cost Limit Exceeded (429)**
```json
{
  "error": "Workflow AI cost limit exceeded",
  "message": "Estimated cost $0.05 would exceed $1.00 limit",
  "workflow_id": "workflow-id"
}
```

#### **Invalid Input (400)**
```json
{
  "error": "INVALID_ICP_INPUT",
  "details": {
    "organization_url": ["Invalid URL format"]
  }
}
```

#### **Rate Limited (429)**
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 ICP generations per organization per hour",
  "retryAfter": 3600
}
```

#### **System Error (500)**
```json
{
  "error": "ICP generation failed",
  "message": "Financial recording failed",
  "workflow_id": "workflow-id"
}
```

---

## **💰 Cost Governance Features**

### **Financial Safety**
- **Pre-Call Authorization**: Prevents spending before API calls
- **Hard Cost Cap**: $1.00 maximum per workflow
- **Atomic Settlement**: Single transaction recording
- **Ledger Authority**: Append-only financial audit trail

### **Cost Tracking**
- **Real-Time Calculation**: Based on actual token usage
- **Model Pricing**: perplexity/sonar ($0.001/1k input, $0.002/1k output)
- **Organization Analytics**: Monthly cost tracking per customer
- **Retry Logic**: Intelligent error classification

### **Enterprise Controls**
- **Rate Limiting**: 10 requests per organization per hour
- **Organization Isolation**: RLS enforced data separation
- **Audit Trail**: Complete transaction history
- **Margin Protection**: No silent cost failures

---

## **🔒 Security & Compliance**

### **Authentication**
- User authentication required
- Organization membership validation
- Workflow ownership verification

### **Authorization**
- Step order validation (must be at step 1)
- Organization-level rate limiting
- Resource access control

### **Financial Security**
- Atomic database transactions
- Row-level locking prevents race conditions
- No partial financial writes
- Complete audit logging

---

## **📈 Analytics Integration**

### **Events Emitted**
```json
{
  "event_type": "workflow_step_completed",
  "workflow_id": "workflow-id",
  "organization_id": "org-id",
  "step": "step_1_icp",
  "status": "success",
  "metadata": {
    "tokens_used": 1853,
    "model_used": "perplexity/sonar",
    "ai_cost": 0.00132,
    "generated_at": "2026-02-12T01:05:29.967Z",
    "retry_count": 1
  },
  "timestamp": "2026-02-12T01:05:30.201Z"
}
```

### **Financial Events**
- Cost tracking per request
- Model usage analytics
- Retry frequency monitoring
- Organization cost aggregation

---

## **🚀 Performance Characteristics**

### **Typical Metrics**
- **Response Time**: 3-85 seconds (depends on retry)
- **Cost Range**: $0.001-0.003 per generation
- **Token Usage**: 700 max tokens optimized
- **Success Rate**: High with automatic retry

### **Scalability**
- **Horizontal Scaling**: Multi-instance safe
- **Concurrency**: Race-condition protected
- **Database**: Atomic transactions
- **Caching**: Workflow result caching

---

## **🔧 Implementation Details**

### **Key Components**
- **Cost Engine**: Atomic financial operations
- **Model Router**: Deterministic AI execution
- **Retry System**: Intelligent error handling
- **Analytics Engine**: Real-time event emission

### **Database Operations**
- **Pre-Call**: `check_workflow_cost_limit()`
- **Settlement**: `record_usage_and_increment()`
- **Analytics**: `get_organization_monthly_ai_cost()`

---

## **🏁 API Classification**

**This endpoint provides enterprise-grade AI execution with bank-grade financial governance.**

- **Financial Infrastructure**: Not just AI, but cost-controlled AI
- **Production Ready**: Atomic safety, audit trails, scalability
- **Enterprise Grade**: Rate limiting, org isolation, compliance

*Status: Production-Ready Financial Infrastructure* ✅
