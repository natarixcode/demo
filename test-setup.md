# 🧪 Database Testing Setup Guide

## 📋 Quick Start Instructions

### **Step 1: Start Backend Server**
```bash
# Navigate to backend directory
cd backend

# Start the server
npm start
# OR
node server.js
```
**Expected Output:**
```
🚀 Server running on port 5000
📡 API available at: http://localhost:5000
🔗 Frontend URL: http://localhost:3000
🧪 Test database connection: http://localhost:5000/api/test-db
✅ Connected to PostgreSQL successfully!
```

### **Step 2: Start Frontend (New Terminal)**
```bash
# From project root
npm run dev
```
**Expected Output:**
```
VITE v4.5.14  ready in 241 ms
➜  Local:   http://localhost:5173/
```

### **Step 3: Test Database Connection**

#### **Option A: Use the React UI**
1. Open browser: `http://localhost:5173`
2. Click "Test Database Connection" button
3. See real-time status and toast notifications

#### **Option B: Test API Directly**
```bash
# Test the API endpoint
curl "http://localhost:5000/api/test-db"
```

## 🔧 **Current Configuration**
- **Database**: `notorix`
- **User**: `postgres` 
- **Password**: `admin`
- **Host**: `localhost`
- **Port**: `5432`
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:5173`

## ✅ **Success Indicators**
- Backend shows: `✅ Connected to PostgreSQL successfully!`
- API returns: `{"status": "success", "message": "Database connection successful!"}`
- Frontend button shows: Green success toast with connection time
- Auto-retry works when enabled

## ❌ **Troubleshooting**
- **Password authentication failed**: Ensure PostgreSQL user `postgres` has password `admin`
- **Database not found**: Create database `notorix` in PostgreSQL
- **CORS errors**: Check backend is running on port 5000
- **Frontend errors**: Ensure dependencies are installed with `npm install`

## 🎯 **Features to Test**
1. **Basic Connection**: Click test button, see success/failure
2. **Auto-retry**: Toggle auto-retry, simulate failure, watch retries
3. **Toast Notifications**: Success (green) and error (red) toasts
4. **Real-time Status**: Connection details, timing, pool info
5. **API Documentation**: Visit `http://localhost:5000` for API info

## 🚀 **Ready to Test!**
Your database connectivity testing system is now configured and ready to use! 