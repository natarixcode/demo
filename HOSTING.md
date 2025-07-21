# 🚀 Notorix Hosting Quick Start

## 🎯 Choose Your Hosting Method

### 🔥 **Option 1: One-Click Docker Deploy (Recommended)**
```bash
# Clone and deploy
git clone <your-repo>
cd notorix
chmod +x deploy.sh
./deploy.sh
```
**Access:** http://localhost (Frontend) | http://localhost:3001 (Backend)

---

### ☁️ **Option 2: Free Cloud Hosting**

#### **Step 1: Database (Supabase)**
1. Go to [supabase.com](https://supabase.com) → New Project
2. Save the connection URL: `postgresql://postgres:[password]@[host]:5432/postgres`
3. In SQL Editor, run:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Step 2: Backend (Railway)**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → GitHub Repo
3. Select `backend` folder as root
4. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase URL
   - `NODE_ENV`: production
   - `PORT`: 3001
   - `JWT_SECRET`: your-secret-key
5. Deploy → Get your backend URL

#### **Step 3: Frontend (Vercel)**
1. Go to [vercel.com](https://vercel.com) → New Project → GitHub Repo
2. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Environment Variables:
   - `VITE_API_URL`: Your Railway backend URL
4. Deploy → Get your frontend URL

---

### 🖥️ **Option 3: VPS/Server Deploy**

#### **Requirements:**
- Ubuntu 20.04+ server
- Domain name (optional)
- SSH access

#### **Install Dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot
sudo reboot
```

#### **Deploy Application:**
```bash
# Clone repository
git clone <your-repo-url>
cd notorix

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

#### **Configure Domain (Optional):**
```bash
# Install Nginx
sudo apt install nginx

# Configure SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 **Environment Configuration**

### **Development (.env)**
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:admin@localhost:5432/notorix
JWT_SECRET=development-secret
CORS_ORIGINS=http://localhost:5173
```

### **Production (.env)**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=super-secure-production-secret-here
CORS_ORIGINS=https://your-domain.com
```

---

## 📊 **Monitoring & Maintenance**

### **Check Application Status:**
```bash
# Docker logs
docker-compose logs -f

# Service status
docker-compose ps

# Database status
docker-compose exec db pg_isready -U postgres
```

### **Update Application:**
```bash
# Pull latest changes
git pull origin main

# Restart services
docker-compose down
docker-compose up -d --build
```

### **Backup Database:**
```bash
# Create backup
docker-compose exec db pg_dump -U postgres notorix > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres notorix < backup.sql
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**503 Service Unavailable**
- Check if backend is running: `curl http://localhost:3001/api/health`
- Verify database connection
- Check Docker logs

**CORS Errors**
- Update `CORS_ORIGINS` in backend environment
- Ensure frontend URL is correct

**Database Connection Failed**
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Test connection manually

**Build Failures**
- Check Node.js version (>=18)
- Clear npm cache: `npm cache clean --force`
- Remove node_modules and reinstall

---

## 📞 **Support**

### **Health Check URLs:**
- Frontend: `http://your-domain/`
- Backend API: `http://your-domain:3001/api/health`
- Database: Port 5432

### **Logs:**
- Frontend: Browser Developer Tools
- Backend: `docker-compose logs backend`
- Database: `docker-compose logs db`

---

## 🎉 **Success!**

Your Notorix application should now be hosted and accessible! 

**Next Steps:**
1. Set up monitoring (Uptime Robot, etc.)
2. Configure automated backups
3. Set up CI/CD pipeline
4. Add SSL certificate for HTTPS
5. Configure CDN for better performance

**Happy hosting! 🚀** 