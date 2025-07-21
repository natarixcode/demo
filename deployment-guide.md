# 🚀 Notorix Deployment Guide

## 📋 Overview
This guide will help you deploy your Notorix full-stack application to various hosting platforms.

## 🏗️ Application Structure
- **Frontend**: React + Vite (port 5173/5174)
- **Backend**: Express.js + PostgreSQL (port 3001)  
- **Database**: PostgreSQL

---

## 🌐 Hosting Options

### Option 1: Free Hosting (Recommended for Development)
- **Frontend**: Vercel or Netlify
- **Backend**: Railway or Render
- **Database**: Supabase or ElephantSQL

### Option 2: Cloud Platforms
- **AWS**: EC2 + RDS
- **Google Cloud**: Compute Engine + Cloud SQL
- **Azure**: App Service + Azure Database

### Option 3: VPS/Dedicated Server
- **DigitalOcean Droplet**
- **Linode**
- **Vultr**

---

## 🚀 Quick Deploy - Free Tier

### Step 1: Deploy Database (Supabase)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note the connection details
4. Run this SQL to create tables:

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Deploy Backend (Railway)
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect GitHub repo
4. Deploy backend folder
5. Add environment variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `NODE_ENV`: production
   - `PORT`: 3001

### Step 3: Deploy Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your Railway backend URL

---

## 🔧 Production Configuration Files

### Backend Production Environment
```env
# Production .env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://username:password@host:5432/dbname
JWT_SECRET=your-super-secure-jwt-secret-here
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

### Frontend Production Build
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true
  },
  server: {
    port: 5173
  }
})
```

---

## 🐳 Docker Deployment

### Full Stack Docker Setup
```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
EXPOSE 3001
CMD ["node", "server.js"]
```

```dockerfile
# Dockerfile.frontend  
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:admin@db:5432/notorix
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=notorix
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=admin
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## ⚡ Performance Optimizations

### Backend Optimizations
- Enable gzip compression
- Use connection pooling
- Add caching with Redis
- Implement rate limiting

### Frontend Optimizations  
- Code splitting
- Image optimization
- Bundle analysis
- CDN for static assets

---

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secrets
- [ ] Configure CORS properly
- [ ] Sanitize user inputs
- [ ] Use environment variables for secrets
- [ ] Set up proper error logging
- [ ] Configure firewall rules
- [ ] Regular security updates

---

## 📊 Monitoring & Analytics

### Recommended Tools
- **Backend**: Winston + LogRocket
- **Frontend**: Google Analytics + Sentry
- **Database**: PostgreSQL logs
- **Infrastructure**: Uptime monitoring

---

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Update CORS_ORIGINS in backend
2. **Database Connection**: Check DATABASE_URL format
3. **Build Failures**: Verify Node.js versions
4. **404 Errors**: Configure routing properly

### Debugging Tips
- Check server logs
- Verify environment variables
- Test API endpoints
- Monitor database connections

---

## 📞 Support

If you need help with deployment:
1. Check the logs for specific errors
2. Verify all environment variables
3. Test locally before deploying
4. Use platform-specific documentation

---

**Ready to deploy your Notorix application! 🎉** 