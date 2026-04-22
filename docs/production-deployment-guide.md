# Production Deployment Guide

**Workflow Engine v1.0.0 - Production-Solid Infrastructure**  
**Date**: February 14, 2026  
**Status**: ✅ Ready for Production Deployment

---

## 🎯 Overview

This guide covers the deployment of the production-solid workflow engine with enterprise audit capabilities and drift-proof state management.

---

## 📋 Pre-Deployment Checklist

### ✅ Infrastructure Validation
- [ ] Database is backed up
- [ ] Environment variables are configured
- [ ] Supabase connection is working
- [ ] Redis/cache services are running (if used)

### ✅ Code Validation
- [ ] All tests passing locally
- [ ] TypeScript compilation clean
- [ ] Production freeze verification passed
- [ ] Enterprise stress tests passed

### ✅ Security Validation
- [ ] Authentication is properly configured
- [ ] RLS policies are in place
- [ ] API keys are secure
- [ ] Audit logging is enabled

---

## 🚀 Deployment Steps

### Git Workflow: Direct Production Deployment

**Key Rule:** Any push to `test-main-all` = Production deployment on Vercel. Any other branch = Preview deployment. No PRs needed for production — merge locally and push directly.

```bash
# 1. Start from clean test-main-all
git checkout test-main-all
git pull origin test-main-all

# 2. Create topic branch
git checkout -b fix/your-feature-name

# 3. Make changes, then commit
git add .
git commit -m "fix: description of change"

# 4. Push topic branch
git push -u origin fix/your-feature-name

# 5. Merge directly to test-main-all (triggers Production on Vercel)
git checkout test-main-all
git merge fix/your-feature-name
git push origin test-main-all
```

### Additional Steps (Optional)

1. Tag the release, e.g.:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin --tags
```

### 2. Deploy Application
```bash
# Deploy using your preferred method
# Example: Vercel, Railway, Docker, etc.

# Monitor deployment logs for:
# - "Workflow graph validation: true"
# - No startup errors
# - All modules loaded successfully
```

### 3. Database Migration (if needed)
```sql
-- Verify workflow state enum is present
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'intent_workflows' AND column_name = 'state';

-- Verify audit logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'workflow_transition_audit';
```

---

## 🔍 Post-Deployment Verification

### 1. Startup Validation
```bash
# Check application logs for:
✅ "Workflow graph validation: true"
❌ "Workflow graph validation failed" (if present, deployment failed)
```

### 2. Basic Functionality Test
```bash
# Create a test workflow
# Verify it starts at step 1 (CREATED state)
# Verify audit log entry is created
```

### 3. Audit Logging Verification
```sql
-- Check audit logs are being created
SELECT * FROM workflow_transition_audit 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify all required fields are present
SELECT workflow_id, previous_state, new_state, transitioned_at 
FROM workflow_transition_audit 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### 4. Concurrency Safety Test
```bash
# Simulate 5 concurrent transition requests
# Verify only 1 succeeds
# Verify only 1 audit entry is created
```

---

## 📊 Monitoring Setup

### Key Metrics to Monitor
1. **Error Rate**: Should be near 0%
2. **Audit Log Creation**: Every transition should create 1 entry
3. **State Transition Success Rate**: Should be 100% for legal transitions
4. **Startup Validation**: Should pass on every deployment

### Alert Configuration
```yaml
alerts:
  - name: "Workflow Audit Logging Failure"
    condition: "audit_log_creation_rate < transition_rate"
    severity: "critical"
    
  - name: "Workflow Graph Validation Failure"
    condition: "startup_validation_failed = true"
    severity: "critical"
    
  - name: "High Concurrency Failures"
    condition: "transition_failure_rate > 10%"
    severity: "warning"
```

---

## 🚨 Troubleshooting

### Startup Validation Failed
**Symptoms**: Application crashes on startup
**Causes**: Invalid workflow graph configuration
**Solutions**:
```bash
# Check graph validation errors in logs
# Verify WORKFLOW_STEPS array is valid
# Check for duplicate state assignments
# Fix configuration and redeploy
```

### Audit Logging Not Working
**Symptoms**: Transitions succeed but no audit entries
**Causes**: Database connection issues, table missing
**Solutions**:
```sql
-- Verify audit table exists
SELECT * FROM workflow_transition_audit LIMIT 1;

-- Check database permissions
-- Verify Supabase client configuration
```

### Concurrency Issues
**Symptoms**: Multiple transitions succeeding simultaneously
**Causes**: Atomic WHERE clause not working
**Solutions**:
```sql
-- Verify state field has proper index
CREATE INDEX IF NOT EXISTS idx_intent_workflows_state ON intent_workflows(state);

-- Check for direct state updates bypassing engine
```

---

## 📈 Performance Considerations

### Expected Performance
- **State Transitions**: < 100ms
- **Audit Logging**: < 50ms
- **Graph Validation**: < 10ms (startup only)
- **Concurrent Requests**: Safe up to 100+ simultaneous

### Scaling Recommendations
1. **Database**: Ensure proper indexing on state field
2. **Application**: Horizontal scaling is safe
3. **Audit Logs**: Consider archival for high volume
4. **Monitoring**: Set up alerts for anomaly detection

---

## 🔄 Rollback Plan

### Immediate Rollback
```bash
# Roll back to previous version
git checkout previous-stable-tag
# Redeploy
```

### Database Rollback
```bash
# No schema changes were made in production freeze
# Rollback is safe and requires no database changes
```

### Verification After Rollback
- [ ] Application starts successfully
- [ ] Existing workflows continue working
- [ ] No data corruption
- [ ] Performance is acceptable

---

## 🎯 Success Criteria

### Deployment Success
- ✅ Application starts without errors
- ✅ Graph validation passes
- ✅ Audit logging is working
- ✅ Basic workflow functionality works

### Production Readiness
- ✅ All monitoring is active
- ✅ Alerts are configured
- ✅ Rollback plan is tested
- ✅ Team is trained on new architecture

---

## 📞 Support

### Common Issues
1. **Startup validation fails** - Check configuration
2. **Audit logging not working** - Check database connectivity
3. **Performance issues** - Check database indexing

### Escalation Path
1. **Level 1**: Check logs and basic configuration
2. **Level 2**: Database and infrastructure issues
3. **Level 3**: Architecture and code issues

---

## 🏆 Deployment Complete

**When all verification steps pass:**

✅ **Production deployment successful**  
✅ **Enterprise workflow infrastructure active**  
✅ **Audit trail operational**  
✅ **Drift-proof state management enabled**  

**Next Steps:**
- Monitor production performance
- Train team on new architecture
- Focus on product feature development
- Plan future enhancements based on usage patterns

---

*Production deployment guide for workflow engine v1.0.0*  
*Status: Production-Ready* ✅  
*Date: February 14, 2026* 🚀
