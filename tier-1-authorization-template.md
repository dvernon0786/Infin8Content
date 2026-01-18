# Tier-1 Authorization Request Template

## 🔐 **AUTHORITATIVE TIER-1 GATE**

**Before any database migrations, new services, or RLS changes:**
1. **Explicitly name the domain gap**
2. **Prove existing schema cannot express it**
3. **Get approval before writing SQL**

---

## 📋 **TIER-1 AUTHORIZATION REQUEST**

### **Story Information**
**Story:** [X.Y] - [Story Title]
**Requester:** [Name/Team]
**Date:** [YYYY-MM-DD]
**Priority:** [Critical/High/Medium/Low]

### **🔍 Domain Gap Analysis**

#### **Current Domain Truth**
**Existing Capabilities:**
- [List current domain capabilities]
- [Existing data structures]
- [Current business logic]
- [Available system contracts]

**Current Schema Limitations:**
- [Specific limitation #1 with examples]
- [Specific limitation #2 with examples]
- [Specific limitation #3 with examples]

#### **Required New Domain Truth**
**New Fundamental Data Structures:**
- [New table(s) required]
- [New relationships needed]
- [New ownership patterns]

**New Core Business Logic:**
- [New business rules]
- [New invariants required]
- [New lifecycle management]

**New System Contracts:**
- [New API contracts]
- [New service interfaces]
- [New data access patterns]

**New Ownership/Lifecycle/Invariants:**
- [New ownership models]
- [New lifecycle requirements]
- [New invariant enforcement]

### **🚫 Proof of Necessity**

#### **Existing Schema Cannot Express**
**Limitation #1:**
- **Current Approach:** [Describe existing method]
- **Why It Fails:** [Specific reason with examples]
- **Gap:** [What cannot be expressed]

**Limitation #2:**
- **Current Approach:** [Describe existing method]
- **Why It Fails:** [Specific reason with examples]
- **Gap:** [What cannot be expressed]

**Limitation #3:**
- **Current Approach:** [Describe existing method]
- **Why It Fails:** [Specific reason with examples]
- **Gap:** [What cannot be expressed]

#### **Alternative Approaches Considered & Rejected**
**Alternative #1: [Description]**
- **Approach:** [How it would work]
- **Why It Fails:** [Specific limitation]
- **Complexity:** [Why it's not viable]

**Alternative #2: [Description]**
- **Approach:** [How it would work]
- **Why It Fails:** [Specific limitation]
- **Complexity:** [Why it's not viable]

**Alternative #3: [Description]**
- **Approach:** [How it would work]
- **Why It Fails:** [Specific limitation]
- **Complexity:** [Why it's not viable]

### **📊 Impact Analysis**

#### **Without This Change**
**Business Impact:**
- [What business capability is missing]
- [What user problems remain unsolved]
- [What competitive disadvantage exists]

**Technical Impact:**
- [What technical debt accumulates]
- [What workarounds are required]
- [What scalability issues exist]

#### **With This Change**
**Business Value:**
- [New business capabilities enabled]
- [User problems solved]
- [Competitive advantages gained]

**Technical Benefits:**
- [Architecture improvements]
- [Scalability enhancements]
- [Maintainability improvements]

### **🎯 Implementation Scope**

#### **Database Changes**
**New Tables:**
- [Table name]: [Purpose, columns, relationships]
- [Table name]: [Purpose, columns, relationships]

**Schema Modifications:**
- [Existing table]: [Changes required]
- [Existing table]: [Changes required]

**RLS Policies:**
- [New policies required]
- [Existing policies to modify]

#### **Service Changes**
**New Services:**
- [Service name]: [Purpose, interface]
- [Service name]: [Purpose, interface]

**Service Modifications:**
- [Existing service]: [Changes required]
- [Existing service]: [Changes required]

#### **API Changes**
**New Endpoints:**
- [Endpoint]: [Purpose, contract]
- [Endpoint]: [Purpose, contract]

**API Modifications:**
- [Existing endpoint]: [Changes required]
- [Existing endpoint]: [Changes required]

### **✅ Authorization Decision**

#### **Technical Review**
**Reviewed By:** [Technical Lead/Architect]
**Review Date:** [YYYY-MM-DD]
**Technical Assessment:**
- [ ] Domain gap is valid
- [ ] Existing schema cannot express requirement
- [ ] Proposed solution is appropriate
- [ ] Implementation scope is minimal
- [ ] Alternatives properly considered

#### **Business Review**
**Reviewed By:** [Product Manager/Business Stakeholder]
**Review Date:** [YYYY-MM-DD]
**Business Assessment:**
- [ ] Business value is clear
- [ ] Priority is appropriate
- [ ] Impact justifies investment
- [ ] User need is validated

#### **Final Authorization**
**Approved:** [ ] Yes [ ] No [ ] Conditional
**Approver:** [Name/Role]
**Authorization Date:** [YYYY-MM-DD]
**Authorization Reference:** [AUTH-XXX]

**Conditions (if applicable):**
- [Condition #1]
- [Condition #2]
- [Condition #3]

**Expiration (if applicable):**
- [Date/Time limit if authorization expires]

---

## 🚨 **REJECTION CRITERIA**

**AUTOMATIC REJECTION IF:**
- Domain gap not clearly defined
- Existing schema can express requirement
- No proof of necessity provided
- Alternatives not properly considered
- Implementation scope exceeds necessity
- Business value not justified

**REJECTION REASONS:**
- [ ] Domain gap is ambiguous or undefined
- [ ] Existing schema can express requirement
- [ ] Insufficient proof of necessity
- [ ] Viable alternatives exist
- [ ] Implementation scope is excessive
- [ ] Business value is unclear
- [ ] Priority is inappropriate

---

## 📋 **AUTHORIZATION CHECKLIST**

### **Before Submission**
- [ ] Domain gap clearly identified
- [ ] Existing schema limitations documented
- [ ] Alternative approaches considered
- [ ] Implementation scope minimized
- [ ] Business value justified
- [ ] Technical feasibility confirmed

### **During Review**
- [ ] Technical review completed
- [ ] Business review completed
- [ ] All questions answered
- [ ] Concerns addressed
- [ ] Conditions documented

### **After Authorization**
- [ ] Authorization reference recorded
- [ ] Conditions tracked
- [ ] Implementation begins
- [ ] Progress monitored
- [ ] Completion verified

---

## 🔐 **AUTHORITY REFERENCES**

**All Tier-1 authorizations must reference:**
- Domain gap proof
- Existing schema limitations
- Alternative approach analysis
- Business value justification
- Technical feasibility assessment

**No authorization → No implementation.**
