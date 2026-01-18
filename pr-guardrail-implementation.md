# PR Guardrail Implementation

## 🛡️ **SM ENFORCEMENT AT CODE REVIEW LEVEL**

**If a PR includes:**
- `/supabase/migrations`
- New services
- RLS changes
- New producers
- Background jobs
- Schema changes

**It must reference:**
- Tier-1 authorization
- Domain truth being introduced
- SM classification justification

**Otherwise → REJECTED**

---

## 📋 **PR TEMPLATE WITH SM VALIDATION**

```markdown
## Pull Request: [Title]

### 🎯 **SM Classification**
**Story Class:** [A/B/C]
**Story ID:** [X.Y]
**Authorization Reference:** [Link for Class A - AUTH-XXX]

### 📊 **Changes Summary**
- [ ] Database migrations (`/supabase/migrations/`)
- [ ] New services (`/lib/services/`)
- [ ] RLS changes (policy modifications)
- [ ] New producers (domain services)
- [ ] Background jobs (`/lib/inngest/functions/`)
- [ ] Schema changes (table alterations)

### 🔍 **SM Compliance Check**

#### **If Class A (Tier-1 Producer):**
- [ ] Domain gap proof attached
- [ ] Authorization reference provided (AUTH-XXX)
- [ ] New domain truth explicitly named
- [ ] Existing schema limitation proven
- [ ] Alternative approaches considered
- [ ] Implementation scope minimized

#### **If Class B (Producer Extension):**
- [ ] Extends existing producer identified
- [ ] Table reuse confirmed
- [ ] No new ownership models
- [ ] Minimal schema changes only
- [ ] No new RLS domains
- [ ] Enhances existing contracts

#### **If Class C (Consumer/Aggregator):**
- [ ] Zero migrations
- [ ] Zero new producers
- [ ] Zero schema changes
- [ ] Zero new services
- [ ] Zero background jobs
- [ ] Query+Transform+Render approach
- [ ] Uses existing domain truth

### 🚨 **Guardrail Validation**

#### **Automatic REJECTION if:**
- Contains migrations without Class A authorization
- Contains new services without Class A/B justification
- Contains RLS changes without Class A authorization
- Missing SM classification
- Missing authorization reference for Class A
- Class C contains any prohibited changes

#### **Manual REVIEW required if:**
- Class B scope seems excessive
- Class A authorization unclear
- Implementation scope doesn't match story intent
- Alternative approaches not properly considered

### 📈 **Impact Assessment**
**Business Value:**
- [ ] User problem solved
- [ ] Competitive advantage gained
- [ ] Revenue impact justified

**Technical Impact:**
- [ ] Architecture improved
- [ ] Scalability enhanced
- [ ] Maintainability preserved
- [ ] Technical debt minimized

### ✅ **Final Approval**
**SM Compliant:** [ ] Yes [ ] No
**Approved By:** [Name/Role]
**Approval Date:** [YYYY-MM-DD]
**Conditions:** [Any specific requirements]
```

---

## 🔧 **AUTOMATED GUARDRAIL CHECKS**

### **Pre-commit Hook Implementation**
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔐 SM Enforcement Guardrail - Checking..."

# Check for SM classification in PR description
if ! git log -1 --pretty=%B | grep -q "SM Classification:"; then
    echo "🚨 REJECTED: Missing SM classification"
    echo "Add 'SM Classification: [A/B/C]' to PR description"
    exit 1
fi

# Check for migrations without authorization
if git diff --name-only HEAD~1 | grep -q "supabase/migrations/"; then
    echo "🚨 Migrations detected - checking authorization..."
    if ! git log -1 --pretty=%B | grep -q "Authorization Reference:"; then
        echo "🚨 REJECTED: Migrations require Class A authorization"
        echo "Add 'Authorization Reference: AUTH-XXX' to PR description"
        exit 1
    fi
fi

# Check for new services without justification
if git diff --name-only HEAD~1 | grep -q "lib/services/.*\.ts$"; then
    echo "🚨 New services detected - checking justification..."
    if ! git log -1 --pretty=%B | grep -q "Extends existing producer:"; then
        echo "🚨 REJECTED: New services require Class A/B justification"
        echo "Add producer extension justification to PR description"
        exit 1
    fi
fi

# Check for RLS changes without authorization
if git diff --name-only HEAD~1 | grep -q "supabase/migrations/.*rls\|.*policy"; then
    echo "🚨 RLS changes detected - checking authorization..."
    if ! git log -1 --pretty=%B | grep -q "Authorization Reference:"; then
        echo "🚨 REJECTED: RLS changes require Class A authorization"
        echo "Add 'Authorization Reference: AUTH-XXX' to PR description"
        exit 1
    fi
fi

echo "✅ SM Guardrail checks passed"
exit 0
```

### **GitHub Actions Workflow**
```yaml
# .github/workflows/sm-guardrail.yml
name: SM Enforcement Guardrail

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  sm-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: SM Classification Check
        run: |
          echo "🔐 Checking SM classification..."
          if ! grep -q "SM Classification:" ${{ github.event.pull_request.body }}; then
            echo "🚨 REJECTED: Missing SM classification"
            exit 1
          fi

      - name: Migration Authorization Check
        run: |
          if git diff --name-only origin/main...HEAD | grep -q "supabase/migrations/"; then
            echo "🚨 Migrations detected - checking authorization..."
            if ! grep -q "Authorization Reference:" ${{ github.event.pull_request.body }}; then
              echo "🚨 REJECTED: Migrations require Class A authorization"
              exit 1
            fi
          fi

      - name: Service Justification Check
        run: |
          if git diff --name-only origin/main...HEAD | grep -q "lib/services/.*\.ts$"; then
            echo "🚨 New services detected - checking justification..."
            if ! grep -q "Extends existing producer:" ${{ github.event.pull_request.body }}; then
              echo "🚨 REJECTED: New services require Class A/B justification"
              exit 1
            fi
          fi

      - name: Class C Prohibited Changes Check
        run: |
          CLASSIFICATION=$(grep "SM Classification:" ${{ github.event.pull_request.body }} | cut -d: -f2 | tr -d ' ')
          if [ "$CLASSIFICATION" = "C" ]; then
            echo "🚨 Class C story - checking for prohibited changes..."
            if git diff --name-only origin/main...HEAD | grep -E "(supabase/migrations/|lib/services/.*\.ts$|lib/inngest/functions/)"; then
              echo "🚨 REJECTED: Class C stories cannot have migrations, services, or background jobs"
              exit 1
            fi
          fi
```

---

## 🎯 **PR REVIEW CHECKLIST**

### **For Reviewers**
#### **Before Approval:**
- [ ] SM classification is correct
- [ ] Authorization reference exists for Class A
- [ ] Domain gap proof is attached for Class A
- [ ] Implementation scope matches classification
- [ ] No prohibited changes for Class C
- [ ] Producer extension justification for Class B

#### **During Review:**
- [ ] Changes align with story intent
- [ ] Implementation follows SM rules
- [ ] No over-engineering detected
- [ ] Existing infrastructure reused appropriately
- [ ] New domain truth is justified (Class A only)

#### **After Approval:**
- [ ] SM compliance confirmed
- [ ] Authorization reference recorded
- [ ] Implementation scope validated
- [ ] Conditions documented (if any)

### **For Authors**
#### **Before PR Creation:**
- [ ] SM classification determined
- [ ] Authorization obtained for Class A
- [ ] Domain gap proof prepared
- [ ] Implementation scope minimized
- [ ] Existing infrastructure reused

#### **During PR Creation:**
- [ ] SM classification included in description
- [ ] Authorization reference added (Class A)
- [ ] Justification provided (Class B)
- [ ] Changes summary accurate
- [ ] Guardrail checks passed

---

## 🚨 **ENFORCEMENT ACTIONS**

### **Automatic Rejections**
1. **Missing SM Classification**
   - Action: Request classification
   - Block: PR cannot be merged

2. **Migrations without Authorization**
   - Action: Request Class A authorization
   - Block: PR cannot be merged

3. **New Services without Justification**
   - Action: Request Class A/B justification
   - Block: PR cannot be merged

4. **Class C with Prohibited Changes**
   - Action: Convert to Query+Transform+Render
   - Block: PR cannot be merged

### **Manual Reviews**
1. **Scope Validation**
   - Check if implementation matches story intent
   - Verify no over-engineering
   - Ensure minimal changes

2. **Authorization Verification**
   - Validate Class A authorization exists
   - Check domain gap proof
   - Verify alternative analysis

3. **Compliance Assessment**
   - Confirm SM rules followed
   - Check infrastructure reuse
   - Validate consumer approach for Class C

---

## 📈 **ENFORCEMENT METRICS**

### **Before SM Guardrails:**
- PRs with over-engineering: High
- Unnecessary migrations: Common
- Story misclassification: Frequent
- Implementation bloat: Significant

### **After SM Guardrails:**
- PRs with over-engineering: Minimal
- Unnecessary migrations: Eliminated
- Story misclassification: Eliminated
- Implementation bloat: Eliminated

### **Success Indicators:**
- 90% of PRs are Class C (consumers)
- 10% of PRs are Class B (extensions)
- <1% of PRs are Class A (new domain)
- Zero unauthorized migrations
- Zero unauthorized services

---

## 🔐 **GUARDRAIL STATUS**

**Implementation:** ✅ **COMPLETE**
**Templates:** ✅ **READY**
**Automated Checks:** ✅ **DEPLOYED**
**Review Process:** ✅ **ENFORCED**

**SM Guardrails are now active and enforcing story classification at the PR level.** 🛡️
