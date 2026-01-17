# User Deletion Instructions

## 🎯 **Objective**
Delete the following test users from both the database and auth system so they can register fresh again:

### **Users to Delete:**
1. **vijaydp1980@gmail.com** (ID: 5e744deb-a9b9-49cc-b526-980973e642ae)
2. **deepak.vj017@gmail.com** (ID: 65c69a24-c183-47fb-b17d-50dac3561e5a)
3. **flowtest@example.com** (ID: 6a636568-2ea7-4a37-b0a4-f0f54747131e)
4. **engagehubonline@gmail.com** (ID: dc417536-2f46-475e-98d3-9df101ae80ec)
5. **test@example.com** (ID: fa9314f1-2a68-4c62-850d-7b882b7996c5)

---

## 📋 **Step-by-Step Deletion Process**

### **Step 1: Database Deletion (SQL)**

**Method A: Supabase SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `delete-test-users.sql`
3. Run the script
4. Verify no users are returned in the final SELECT query

**Method B: psql Command Line**
```bash
psql -h [your-host] -U [your-user] -d [your-database] -f delete-test-users.sql
```

### **Step 2: Auth System Deletion**

**Method A: Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → Authentication → Users
2. Find each user by email or ID:
   - `958d819d-b1aa-4899-b4c6-2d9972479a4b` (vijaydp1980@gmail.com)
   - `328cd624-da2a-4138-8a49-c1d77cc0cfe4` (deepak.vj017@gmail.com)
   - `048ff9f9-c1b2-46f8-b5ed-5b852ad9cea5` (flowtest@example.com)
   - `89136bdd-6405-4c6b-bd6e-2b6dd21ec92c` (engagehubonline@gmail.com)
   - `3d7e4d48-c767-451d-a1a3-471bfad0bfcf` (test@example.com)
3. Click the trash icon next to each user
4. Confirm deletion

**Method B: Node.js Script**
1. Set environment variables:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
2. Run the script:
   ```bash
   node delete-auth-users.js
   ```

---

## 🔍 **Verification Steps**

### **After Database Deletion:**
```sql
-- Verify users are deleted from database
SELECT COUNT(*) as remaining_users 
FROM users 
WHERE email IN (
    'vijaydp1980@gmail.com',
    'deepak.vj017@gmail.com', 
    'flowtest@example.com',
    'engagehubonline@gmail.com',
    'test@example.com'
);
-- Should return 0
```

### **After Auth Deletion:**
1. Check Supabase Dashboard → Authentication → Users
2. None of the 5 users should be listed
3. Try to register with one of the emails - should work

---

## ⚠️ **Important Notes**

### **Data Dependencies:**
- **Organizations:** `deepak.vj017@gmail.com` and `engagehubonline@gmail.com` have organizations
- **Articles:** Check if any users have articles before deletion
- **Activities:** User activities will be automatically deleted

### **Safety Precautions:**
1. **Backup First:** Always create a database backup before deletion
2. **Test Environment:** Run in test/staging first if available
3. **Verify Dependencies:** Check for any foreign key constraints
4. **Log Everything:** Keep records of what was deleted

### **Rollback Plan:**
If you need to restore users:
1. Restore from database backup
2. Manually recreate auth users if needed
3. Verify all data integrity

---

## 🚀 **Post-Deletion Testing**

### **Registration Test:**
1. Try to register with `test@example.com`
2. Should receive OTP/verification email
3. Should be able to complete registration
4. Should appear in both users table and auth system

### **Login Test:**
1. Try to login with deleted credentials
2. Should fail with "Invalid credentials"
3. Should not be able to access any data

---

## 📞 **Support Information**

### **If Issues Occur:**
1. **Supabase Logs:** Check Supabase Dashboard → Logs
2. **Database Logs:** Check PostgreSQL logs
3. **Auth Logs:** Check Authentication logs in Supabase

### **Common Issues:**
- **Foreign Key Constraints:** May need to delete in specific order
- **Auth Service Key:** Ensure using service role key for admin operations
- **Permissions:** Verify admin permissions for deletion operations

---

## ✅ **Completion Checklist**

- [ ] Database users deleted via SQL script
- [ ] Auth users deleted via Dashboard or script
- [ ] Verification queries return 0 results
- [ ] Registration test passes for at least one email
- [ ] Login test fails for deleted users
- [ ] No error logs in Supabase Dashboard
- [ ] Documentation updated with deletion records

---

## 📝 **Deletion Record**

**Date:** 2026-01-17 02:34:00 UTC  
**Users Deleted:** 5  
**Method:** SQL + Auth Dashboard  
**Status:** Ready for execution  

**Files Created:**
- `delete-test-users.sql` - Database deletion script
- `delete-auth-users.js` - Auth deletion script
- `USER_DELETION_INSTRUCTIONS.md` - This documentation

---

*This process ensures complete removal of test users while maintaining data integrity and providing clear rollback options.*
