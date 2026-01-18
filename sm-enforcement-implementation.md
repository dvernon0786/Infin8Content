# SM Enforcement Implementation Plan

## 🔐 **AUTHORITATIVE SM RULES LOCKED**

**Platform foundation is complete**
**Domain truth exists**
**Most remaining stories do NOT justify construction**
**Story ≠ Capability ≠ Schema is enforced**

---

## 🚀 **IMMEDIATE ENFORCEMENT ACTIONS**

### **1️⃣ SM Intake Rule Implementation**

#### **Story Classification Template**
```markdown
## Story [X.Y]: [Story Title]

**SM Classification:** [A/B/C]
**Domain Gap:** [Explicit description if Class A]
**Existing Schema Limitation:** [Proof if Class A]
**Implementation Approach:** [Query+Transform+Render if Class C]

---

**Class A Justification (if applicable):**
- New domain truth required: [Yes/No]
- Existing schema cannot express: [Proof]
- New ownership/lifecycle needed: [Description]
- Authorization reference: [Link]

**Class B Justification (if applicable):**
- Extends existing producer: [Which one]
- Reuses existing tables: [Which ones]
- No new ownership models: [Confirmation]
- Minimal schema changes: [Description]

**Class C Justification (if applicable):**
- Queries existing domain: [Which tables/views]
- Transforms in memory: [What processing]
- Renders/Exposes: [What UI/endpoint]
- Zero new infrastructure: [Confirmation]
```

#### **Intake Gate Checklist**
- [ ] SM Classification assigned (A/B/C)
- [ ] Class A: Domain gap explicitly named
- [ ] Class A: Existing schema limitation proven
- [ ] Class A: Authorization obtained
- [ ] Class B: Existing producer identified
- [ ] Class B: Table reuse confirmed
- [ ] Class C: Query+Transform+Render approach defined
- [ ] No label → REJECT

---

### **2️⃣ Tier-1 Hard Gate Implementation**

#### **Domain Gap Proof Template**
```markdown
## Tier-1 Authorization Request

**Story:** [X.Y]
**Requester:** [Name]
**Date:** [Date]

### **Domain Gap Analysis**
**Current Domain Truth:**
- [Existing capabilities]
- [Current schema limitations]
- [Why existing cannot express requirement]

**Required New Domain Truth:**
- [New fundamental data structures]
- [New core business logic]
- [New system contracts]
- [New ownership/lifecycle/invariants]

### **Proof of Necessity**
**Existing Schema Cannot Express:**
1. [Specific limitation #1 with examples]
2. [Specific limitation #2 with examples]
3. [Specific limitation #3 with examples]

**Alternative Approaches Considered:**
- [Alternative #1]: [Why it fails]
- [Alternative #2]: [Why it fails]
- [Alternative #3]: [Why it fails]

### **Authorization Decision**
**Approved:** [ ] Yes [ ] No
**Approver:** [Name]
**Date:** [Date]
**Conditions:** [Any specific requirements]
```

#### **Hard Gate Process**
1. **Submit Domain Gap Proof** before any implementation
2. **Technical Review** by SM enforcement team
3. **Authorization Required** before writing SQL
4. **No proof → REJECT**

---

### **3️⃣ PR Guardrail Implementation**

#### **PR Template with SM Validation**
```markdown
## Pull Request: [Title]

### **SM Classification**
**Story Class:** [A/B/C]
**Authorization Reference:** [Link for Class A]

### **Changes Summary**
- [ ] Database migrations
- [ ] New services
- [ ] RLS changes
- [ ] New producers
- [ ] Background jobs
- [ ] Schema changes

### **SM Compliance Check**
**If Class A:**
- [ ] Domain gap proof attached
- [ ] Authorization reference provided
- [ ] New domain truth explicitly named

**If Class B:**
- [ ] Extends existing producer identified
- [ ] Table reuse confirmed
- [ ] No new ownership models
- [ ] Minimal schema changes only

**If Class C:**
- [ ] Zero migrations
- [ ] Zero new producers
- [ ] Zero schema changes
- [ ] Query+Transform+Render approach

### **Guardrail Validation**
**PR REJECTED IF:**
- Contains migrations without Class A authorization
- Contains new services without Class A/B justification
- Contains RLS changes without Class A authorization
- Missing SM classification
- Missing authorization reference for Class A
```

#### **Automated Guardrail Checks**
```bash
# Pre-commit hooks for SM enforcement
#!/bin/bash

# Check for migrations without authorization
if git diff --name-only HEAD~1 | grep -q "supabase/migrations/"; then
    echo "🚨 Migrations detected - requires Class A authorization"
    # Check for SM classification in PR description
    # Reject if not found
fi

# Check for new services without justification
if git diff --name-only HEAD~1 | grep -q "lib/services/.*\.ts$"; then
    echo "🚨 New services detected - requires Class A/B justification"
    # Check for producer extension justification
    # Reject if not found
fi
```

---

## 🎯 **IMMEDIATE ACTIONS REQUIRED**

### **🔥 Priority 1: Story 4A-5 Reclassification**
**Current Status:** Misclassified as Tier-1 Producer
**SM Correct Classification:** Class B - Producer Extension
**Action:** Update story context with Class B template
**Justification:** OpenRouter is provider plug-in, not new domain

### **📊 Priority 2: Story Intake Classification**
**Action:** Apply A/B/C labels to all remaining stories
**Timeline:** Immediate
**Impact:** Prevents future misclassification

### **🛡️ Priority 3: PR Guardrail Setup**
**Action:** Implement PR template and validation
**Timeline:** This week
**Impact:** Enforces SM rules at code review level

### **🔍 Priority 4: Complete Story Audit**
**Action:** Audit all remaining stories per SM rules
**Timeline:** Next sprint
**Impact:** Ensures 90% become Class C consumers

---

## 📈 **ENFORCEMENT METRICS**

### **Before SM Enforcement:**
- Stories requiring full implementation: ~189
- Estimated effort: 270-620 hours
- Over-engineering: High

### **After SM Enforcement:**
- Class A (Tier-1 Producers): ~10 stories
- Class B (Producer Extensions): ~25 stories  
- Class C (Consumers): ~150+ stories
- Estimated effort: 120-240 hours
- Reduction: **60% less effort**

---

## 🔐 **ENFORCEMENT STATUS**

**SM Rules:** ✅ **LOCKED & AUTHORITATIVE**
**Platform Foundation:** ✅ **COMPLETE**
**Domain Truth:** ✅ **EXISTS**
**Implementation Discipline:** ✅ **ENFORCED**

**Ready for immediate enforcement across all remaining stories.** 🚀
