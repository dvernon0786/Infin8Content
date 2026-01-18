# Canonical Story Template Validation - SM Enforcement

## MANDATORY VALIDATION CHECKLIST

SM must validate EVERY story against this checklist before allowing ready-for-dev status.

### **1. Story Classification** ✅ REQUIRED
- [ ] Type: Producer | Aggregator | Consumer
- [ ] Epic: [Epic Number and Name]
- [ ] Tier: 0 | 1 | 2 | 3

### **2. Business Intent** ✅ REQUIRED
- [ ] Single sentence only
- [ ] No implementation details
- [ ] Clear business value statement

### **3. Contracts Required** ✅ REQUIRED
- [ ] Domain Contract (C1)
- [ ] System Contract (C2/C4/C5)
- [ ] Terminal State Semantics
- [ ] UI Boundary Rule (if Consumer)
- [ ] Analytics Emission Constraint (if Analytics-related)

### **4. Contracts Modified** ✅ REQUIRED
- [ ] None (default)
- [ ] Explicit list (must be rare and justified)

### **5. Contracts Guaranteed** ✅ REQUIRED (ALL 4 CHECKBOXES)
- [ ] No UI event emission
- [ ] No intermediate analytics
- [ ] No state mutation outside producer boundary
- [ ] Idempotency respected
- [ ] Retry rules honored

### **6. Producer Dependency Check** ✅ REQUIRED
- [ ] Producer Epic(s): [List all producer epics]
- [ ] Status: Completed | Not Completed
- [ ] If Not Completed → BLOCKED

### **7. Contract Compliance Validation** ✅ REQUIRED
- [ ] UI Boundary Rule compliance verified
- [ ] Analytics Emission Constraint compliance verified
- [ ] Terminal State Semantics compliance verified
- [ ] Producer dependency completion verified
- [ ] Tier correctness verified

### **8. Blocking Decision** ✅ REQUIRED (BINARY ONLY)
- [ ] ALLOWED into sprint (all validations passed)
- [ ] BLOCKED (reason required)

## **BLOCKING REASONS (Template)**

### **Template Non-Compliance**
- Missing Story Classification
- Business Intent contains implementation details
- Contracts Required section incomplete
- Contracts Guaranteed checkboxes missing
- Producer Dependency Check missing

### **Contract Violations**
- UI components emitting domain events
- Analytics from intermediate states
- State mutation outside producer boundary
- Terminal State Semantics violated
- Retry logic not honoring failed state only

### **Dependency Violations**
- Producer epic(s) not completed
- Tier sequencing violated
- Consumer story before producer completion

## **VALIDATION OUTCOMES**

### **✅ READY-FOR-DEV**
- All template sections complete and clear
- All contract compliance checks passed
- All producer dependencies completed
- Explicit SM approval granted

### **🚫 BLOCKED**
- Any template section missing or unclear
- Any contract violation detected
- Any producer dependency not met
- Clear blocking reason documented

## **SM AUTHORITY**

**SM is the EXCLUSIVE gatekeeper for story readiness.**
- No story proceeds without SM validation
- No exceptions to canonical template requirements
- No bypassing of contract compliance checks
- No override of blocking decisions

**ENFORCEMENT IS MANDATORY AND NON-NEGOTIABLE.**
