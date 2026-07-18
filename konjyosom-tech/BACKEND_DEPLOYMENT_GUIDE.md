# Backend Deployment Guide - Konjyosom Tech Solutions

## Overview
This guide covers deploying the Node.js backend to **Render.com** with **MongoDB Atlas**.

> **Note:** Email (Resend) and image upload (Cloudinary) integrations have been removed from this project. The app runs without them: emails are skipped (logged only) and there is no `/api/upload` endpoint.

---

## Prerequisites

| Tool | Purpose | Link |
|------|---------|------|
| Node.js 18+ | Runtime | [nodejs.org](https://nodejs.org) |
| Git | Version control | [git-scm.com](https://git-scm.com) |
| MongoDB Atlas | Database | [mongodb.com/atlas](https://mongodb.com/atlas) |
| Render account | Hosting | [render.com](https://render.com) |

---

## Step 1: Prepare Your Project

### 1.1 Initialize Git Repository

```bash
cd konjyosom-tech

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Konjyosom Tech Solutions"
```

### 1.2 Create .gitignore

Create `backend/.gitignore`:

```
node_modules/
.env
uploads/
*.log
.DS_Store
```

Create `frontend/.gitignore`:

```
.DS_Store
```

### 1.3 Push to GitHub

```bash
# Create new repository on GitHub (don't initialize with README)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/konjyosom-tech.git
git branch -M main
git push -u origin main
```

---

## Step 2: Setup MongoDB Atlas

### 2.1 Create Cluster

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up / Log in
3. Click **"Create New Cluster"**
4. Choose **M0 (Free Tier)**
5. Select region closest to your users (e.g., **Mumbai (ap-south-1)** for Nepal)
6. Click **Create Cluster** (takes 1-3 minutes)

### 2.2 Create Database User

1. In Atlas dashboard, click **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Authentication: **Password**
4. Username: `konjyosom_admin`
5. Password: Generate strong password (save it!)
6. Privileges: **Read and write to any database**
7. Click **Add User**

### 2.3 Allow Network Access

1. Click **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (0.0.0.0/0)
   - *Note: For production, restrict to Render's IP ranges*
4. Click **Confirm**

### 2.4 Get Connection String

1. Click **Database** → **Clusters** → **Connect**
2. Choose **Connect your application**
3. Driver: **Node.js**
4. Version: **4.1 or later**
5. Copy the connection string:

```
mongodb+srv://konjyosom_admin:<password>@cluster0.xxxxx.mongodb.net/konjyosomtech?retryWrites=true&w=majority
```

6. Replace `<password>` with your actual password

---

## Step 3: Deploy to Render

### Option A: Blueprint (Recommended - Auto)

1. Fork/push your repo to **GitHub**
2. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
3. Click **New Blueprint Instance**
4. Connect your GitHub repo
5. Render reads `render.yaml` and creates:
   - **Web Service** (backend API)
   - **Static Site** (frontend)
6. Click **Apply**
7. Wait for deployment (2-5 minutes)

### Option B: Manual Setup

#### 3.1 Create Web Service (Backend)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `konjyosom-api` |
| Environment | `Node` |
| Region | `Singapore` (closest to Nepal) |
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Plan | `Free` |

5. Click **Advanced** → Add Environment Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | Your frontend URL (set after frontend deploy) |
| `ADMIN_EMAIL` | `admin@konjyosomtech.com` |
| `ADMIN_PASSWORD` | Strong password (change after first login!) |

6. Click **Create Web Service**
7. Wait for build & deploy (2-3 minutes)

#### 3.2 Create Static Site (Frontend)

1. Click **New** → **Static Site**
2. Connect same GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `konjyosom-frontend` |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `echo "Ready"` (no build needed) |
| Publish Directory | `./` |
| Plan | `Free` |

4. Click **Create Static Site**
5. Copy the URL (e.g., `https://konjyosom-frontend.onrender.com`)

#### 3.3 Link Frontend & Backend

1. Go back to **Web Service** → **Environment**
2. Add/update: `FRONTEND_URL` = your static site URL
3. Restart the service

---

## Step 4: Verify Deployment

### 4.1 Health Check

```bash
curl https://konjyosom-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "Konjyosom Tech Solutions API",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4.2 Test Admin Login

```bash
curl -X POST https://konjyosom-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@konjyosomtech.com","password":"<your-admin-password>"}'
```

### 4.3 Test Public Endpoints

```bash
# Get website settings
curl https://konjyosom-api.onrender.com/api/website/settings

# Get hero data
curl https://konjyosom-api.onrender.com/api/website/hero

# Get services
curl https://konjyosom-api.onrender.com/api/website/services
```

---

## Step 5: Post-Deployment Tasks

### 5.1 Change Admin Password

1. Login at `https://your-frontend.onrender.com/login.html`
2. Use default credentials
3. Go to **Profile** → Change password immediately

### 5.2 Configure Website Content

1. Login as admin
2. Go to **Website CMS**
3. Update:
   - Company name, logo, tagline
   - Contact info (phone, email, address)
   - Google Maps URL (your actual location)
   - Social media links
   - Hero typing texts
   - SEO meta tags

### 5.3 Add First Technician

1. Go to **Technicians** → **Add New**
2. Fill name, email, phone, specializations
3. System auto-generates temp password
4. Share the temp password with the technician manually (outgoing email is disabled)

### 5.4 Update Frontend API URL

In `frontend/js/main.js`, update:

```javascript
const API_BASE_URL = 'https://konjyosom-api.onrender.com/api';
```

*(This is already handled by `render.yaml` if using Blueprints)*

---

## Step 6: Custom Domain (Optional)

### 6.1 Buy Domain

Recommended registrars for Nepal:
- [Namecheap](https://namecheap.com)
- [GoDaddy](https://godaddy.com)
- [Hostinger](https://hostinger.com)

### 6.2 Connect to Render

**For Backend (API):**
1. Render Dashboard → Web Service → **Settings** → **Custom Domains**
2. Add domain: `api.konjyosomtech.com`
3. Copy DNS records from Render
4. Add to your domain registrar

**For Frontend (Website):**
1. Render Dashboard → Static Site → **Settings** → **Custom Domains**
2. Add domain: `konjyosomtech.com` and `www.konjyosomtech.com`
3. Copy DNS records
4. Add to registrar

### 6.3 Update Environment Variables

After custom domain setup, update:
- `FRONTEND_URL` → `https://konjyosomtech.com`

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

```bash
# Check IP whitelist in Atlas
# Must include 0.0.0.0/0 or Render's outbound IPs

# Test connection locally:
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(()=>console.log('OK')).catch(e=>console.log(e))"
```

### Issue: "CORS errors in browser"

```bash
# Check FRONTEND_URL env var matches actual frontend domain
# Update in Render dashboard → Web Service → Environment
```

### Issue: "Build failed"

```bash
# Check Render logs for error details
# Common fixes:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Environment Variables Reference

| Variable | Required | Example | Source |
|----------|----------|---------|--------|
| `NODE_ENV` | Yes | `production` | Set manually |
| `PORT` | Yes | `10000` | Render auto-sets |
| `MONGODB_URI` | Yes | `mongodb+srv://...` | MongoDB Atlas |
| `JWT_SECRET` | Yes | `64-char hex` | Generate yourself |
| `JWT_EXPIRE` | No | `7d` | Default: 7d |
| `FRONTEND_URL` | Yes | `https://...` | Your frontend URL |
| `ADMIN_EMAIL` | Yes | `admin@...` | Your choice |
| `ADMIN_PASSWORD` | Yes | `StrongPass123!` | Your choice |

---

## Maintenance

### Update Code

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Render auto-deploys (if auto-deploy enabled)
```

### View Logs

```bash
# Render Dashboard → Web Service → Logs
# Or via CLI:
render logs --service konjyosom-api
```

### Database Backup

```bash
# MongoDB Atlas auto-backs up (M10+ clusters)
# For M0 (free), manual export:
mongodump --uri="your-connection-string" --out=backup-$(date +%Y%m%d)
```

### Monitor Performance

- Render Dashboard → Metrics (CPU, memory, requests)
- MongoDB Atlas → Monitoring (queries, connections)

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (64+ random chars)
- [ ] Enable MongoDB IP whitelist (restrict to Render IPs)
- [ ] Enable HTTPS (Render auto-enables)
- [ ] Add rate limiting (already in code)
- [ ] Review activity logs regularly

---

## Support & Resources

| Service | Documentation | Support |
|---------|--------------|---------|
| Render | [docs.render.com](https://docs.render.com) | [render.com/docs](https://render.com/docs) |
| MongoDB Atlas | [docs.mongodb.com](https://docs.mongodb.com) | [support.mongodb.com](https://support.mongodb.com) |
| Node.js | [nodejs.org/docs](https://nodejs.org/docs) | [github.com/nodejs/help](https://github.com/nodejs/help) |

---

**Deploy Date:** ___________
**Backend URL:** ___________
**Frontend URL:** ___________
**Custom Domain:** ___________

**Notes:**
_________________________________________________________________
_________________________________________________________________
