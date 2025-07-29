# 🔐 AUTHENTICATION 401 ERROR - QUICK FIX

## 🚨 **Problem: 401 Unauthorized on Login**

The login endpoint is returning `401 Unauthorized` because the demo users either don't exist or have different passwords than expected.

## ✅ **Quick Solution**

### **Step 1: Restart Backend Server**
```bash
# From project root
cd backend
node start-server-stable.js
```

### **Step 2: Create Demo Users**
Open your browser and go to:
```
http://localhost:3001/api/auth/create-demo-users
```

Or use PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/create-demo-users" -Method POST -Body "{}" -ContentType "application/json"
```

### **Step 3: Use These Credentials**
After creating demo users, you can login with:

- **Email**: `demo@notorix.com` | **Password**: `demo123`
- **Email**: `admin@notorix.com` | **Password**: `admin123`  
- **Email**: `test@notorix.com` | **Password**: `test123`

## 🎯 **Alternative: Manual Login Test**

Test login directly via API:
```powershell
$body = @{ email = 'demo@notorix.com'; password = 'demo123' } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

## 🔧 **Root Cause**

The 401 error happens because:
1. Demo users weren't properly created in the database
2. Password mismatch between frontend expectations and database
3. User table might have been reset or modified

## ✅ **Verification**

After fixing, you should be able to:
1. ✅ Login successfully without 401 errors
2. ✅ Access protected routes and features
3. ✅ See user profile and community features

**🎉 Your authentication should now work perfectly!** 