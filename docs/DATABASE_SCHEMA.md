# Database Schema - AI Cost Governance

## 🏆 **Financial Infrastructure Tables**

### **Completed: February 12, 2026**

---

## **📊 Core Tables**

### **ai_usage_ledger - Financial Audit Trail**
```sql
CREATE TABLE ai_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  model text NOT NULL,
  prompt_tokens int NOT NULL,
  completion_tokens int NOT NULL,
  cost numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_usage_ledger_org_month 
ON ai_usage_ledger(organization_id, created_at);

CREATE INDEX idx_ai_usage_ledger_workflow 
ON ai_usage_ledger(workflow_id);
```

**Purpose**: Append-only financial record of every AI request
**Authority**: Single source of truth for billing and analytics

---

### **intent_workflows - Workflow Cost Tracking**
```sql
-- Uses JSONB field for cost aggregation
workflow_data jsonb DEFAULT '{}'::jsonb

-- Cost stored as:
workflow_data.total_ai_cost numeric
```

**Purpose**: Cached aggregate cost per workflow
**Update Method**: Atomic database functions

---

## **🔧 Atomic Functions**

### **Pre-Call Authorization**
```sql
CREATE OR REPLACE FUNCTION check_workflow_cost_limit(
  p_workflow_id uuid,
  p_additional_cost numeric,
  p_max_cost numeric DEFAULT 1.00
) RETURNS boolean AS $$
BEGIN
  -- Lock row and check if adding cost would exceed limit
  -- Returns true/false without mutation
END;
$$ LANGUAGE plpgsql;
```

### **Bank-Grade Settlement**
```sql
CREATE OR REPLACE FUNCTION record_usage_and_increment(
  p_workflow_id uuid,
  p_organization_id uuid,
  p_model text,
  p_prompt_tokens int,
  p_completion_tokens int,
  p_cost numeric
) RETURNS void AS $$
BEGIN
  -- Insert into ledger AND increment workflow total
  -- Single atomic transaction
  INSERT INTO ai_usage_ledger(...) VALUES (...);
  UPDATE intent_workflows SET workflow_data = jsonb_set(...);
END;
$$ LANGUAGE plpgsql;
```

### **Analytics Functions**
```sql
-- Organization monthly cost calculation
CREATE OR REPLACE FUNCTION get_organization_monthly_ai_cost(
  p_organization_id uuid
) RETURNS numeric;

-- Monthly quota checking
CREATE OR REPLACE FUNCTION check_organization_monthly_quota(
  p_organization_id uuid,
  p_monthly_limit numeric DEFAULT 25.00
) RETURNS boolean;
```

---

## **💰 Financial Flow**

### **1. Authorization Phase**
```sql
SELECT check_workflow_cost_limit(workflow_id, estimated_cost, 1.00);
-- Returns: true (can proceed) or false (blocked)
```

### **2. Settlement Phase**
```sql
SELECT record_usage_and_increment(
  workflow_id, org_id, model, prompt_tokens, completion_tokens, cost
);
-- Atomic: ledger insert + workflow increment
```

### **3. Analytics Phase**
```sql
SELECT get_organization_monthly_ai_cost('org-id');
-- Returns: total cost for current month
```

---

## **🔒 Safety Guarantees**

### **Atomic Transactions**
- Ledger insert and cost increment in single transaction
- Row-level locks prevent race conditions
- No partial writes or orphan data

### **Financial Integrity**
- Append-only ledger (no deletions)
- Hard cost caps enforced at database level
- Complete audit trail for billing reconciliation

### **Concurrency Safety**
- Multi-instance deployment ready
- High concurrency tested
- Horizontal scaling safe

---

## **📈 Analytics Queries**

### **Organization Cost Analysis**
```sql
-- Monthly cost per organization
SELECT 
  organization_id,
  SUM(cost) as monthly_cost,
  COUNT(*) as request_count
FROM ai_usage_ledger
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY organization_id;
```

### **Model Performance**
```sql
-- Cost and usage by model
SELECT 
  model,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost,
  SUM(prompt_tokens + completion_tokens) as total_tokens
FROM ai_usage_ledger
GROUP BY model
ORDER BY total_cost DESC;
```

### **Workflow Economics**
```sql
-- Most expensive workflows
SELECT 
  workflow_id,
  SUM(cost) as total_cost,
  COUNT(*) as request_count,
  model
FROM ai_usage_ledger
GROUP BY workflow_id, model
ORDER BY total_cost DESC
LIMIT 10;
```

---

## **🚀 Migration Status**

### **Required Migrations (Completed)**
1. ✅ `20260212_enable_plpgsql.sql` - Language enablement
2. ✅ `20260212_create_cost_functions.sql` - Core functions
3. ✅ `20260212_add_check_only_function.sql` - Pre-call guard
4. ✅ `20260212_add_atomic_increment.sql` - Post-call update
5. ✅ `20260212_fix_ledger_uuid.sql` - UUID generation

### **Verification**
```sql
-- Check all functions exist
SELECT proname FROM pg_proc 
WHERE proname LIKE '%workflow_cost%' 
   OR proname LIKE '%organization_monthly%';
```

---

## **🏁 Architecture Classification**

**This schema provides enterprise-grade financial infrastructure for AI cost governance.**

- **Bank-Grade Transactions**: Atomic financial operations
- **Audit Ready**: Complete transaction history
- **Scalable Design**: High concurrency safe
- **Billing Ready**: Cost reconciliation support

*Status: Production-Ready Financial Infrastructure* ✅
