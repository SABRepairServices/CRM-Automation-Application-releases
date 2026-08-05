# ⚡ Quick Setup Guide - 10 Minutes to Running

**Social Media Automation Platform**

---

## 📋 Prerequisites Check

Before starting, verify you have:

```powershell
# Check Node.js (must be v18+)
node --version

# Check npm
npm --version

# Check Git (optional)
git --version
```

If any are missing:
- **Node.js:** Download from https://nodejs.org/ (18.0.0+)
- **npm:** Comes with Node.js
- **Git:** Download from https://git-scm.com/ (optional)

---

## 🚀 5-Minute Quick Start

### Step 1: Navigate to Project
```bash
cd "D:\Developer Application\Social-Media-Automation"
```

### Step 2: Run the Setup & Start Script
```bash
cd Scripts
install-and-run.bat
```

This will:
- ✅ Install frontend dependencies (~2 min)
- ✅ Install backend dependencies (~1 min)
- ✅ Start frontend server on port 3000
- ✅ Start backend server on port 5000

### Step 3: Access the Application

Open your browser:
- **Frontend:** http://localhost:3000
- **Backend Health:** http://localhost:5000/api/health

**Done! 🎉**

---

## 📝 Manual Setup (If Script Doesn't Work)

### Terminal 1: Start Frontend

```bash
cd "D:\Developer Application\Social-Media-Automation\Web"
npm install
npm run dev
```

Expected output:
```
> next dev
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  ✓ Ready in 3.2s
```

### Terminal 2: Start Backend

```bash
cd "D:\Developer Application\Social-Media-Automation\API"
npm install
npm run dev
```

Expected output:
```
╔════════════════════════════════════════════════════════╗
║   Social Media Automation - Backend API                ║
║   Version: 1.0.0                                       ║
╚════════════════════════════════════════════════════════╝

✅ Server running on http://0.0.0.0:5000
```

---

## 🔧 Configuration

### Add Your API Keys

1. Open: `D:\Developer Application\Social-Media-Automation\Configs\.env`

2. Add required keys:

```env
# Must have (minimum)
ANTHROPIC_API_KEY=sk-ant-your-key-here
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Add social platforms you need
INSTAGRAM_ACCESS_TOKEN=your_token
TWITTER_BEARER_TOKEN=your_token
FACEBOOK_ACCESS_TOKEN=your_token
```

Get keys from:
- **Anthropic:** https://console.anthropic.com/
- **Supabase:** https://supabase.io/
- **Instagram:** https://developers.facebook.com/
- **Twitter:** https://developer.twitter.com/
- **Facebook:** https://developers.facebook.com/
- **TikTok:** https://developer.tiktok.com/
- **YouTube:** https://console.cloud.google.com/

### Verify Configuration

Check that `.env` file exists:
```bash
ls Configs\.env
```

Should show: `Configs\.env` (if missing, check Configs folder)

---

## ✅ Verification Checklist

After starting both servers, verify:

- [ ] Frontend loads at http://localhost:3000
  - [ ] Page shows "Social Media Automation"
  - [ ] No console errors (F12 to check)

- [ ] Backend responds at http://localhost:5000/api/health
  - [ ] Shows JSON: `{"status":"OK",...}`

- [ ] Check frontend console (F12)
  - [ ] No red errors
  - [ ] Shows "Backend: ✅ Connected" or "❌ Not Available"

- [ ] Check backend terminal
  - [ ] Shows: "✅ Server running on http://0.0.0.0:5000"
  - [ ] No error messages

---

## 🐛 Common Issues & Fixes

### Issue: "Port 3000 already in use"

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID 1234 /F

# Change port in package.json (Web folder):
# Add to scripts: "dev": "next dev -p 3001"
```

### Issue: "npm: command not found"

```powershell
# Node.js not installed or not in PATH
# Download: https://nodejs.org/
# Install and restart terminal/computer

# Verify:
node --version
npm --version
```

### Issue: "Module not found" error

```bash
# Delete node_modules and reinstall
cd Web
rmdir /s node_modules
npm install

cd ../API
rmdir /s node_modules
npm install
```

### Issue: "ENOENT: no such file or directory"

```bash
# File or folder missing
# Make sure you're in the right directory:
cd "D:\Developer Application\Social-Media-Automation"

# Check folders exist:
dir Web
dir API
dir Configs
```

### Issue: Backend won't start

```bash
# Check if Redis needed but not running
# Try without Redis first (will show errors)

# Install Redis (optional):
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL2 + Linux Redis
```

---

## 📊 What's Running

### Frontend Server (Port 3000)
- **Framework:** Next.js 14
- **Language:** TypeScript + React
- **Styling:** Tailwind CSS
- **Auto-reload:** Yes (changes reflect immediately)

### Backend Server (Port 5000)
- **Framework:** Express.js
- **Language:** JavaScript (Node.js)
- **Routes:** REST API endpoints
- **Auto-reload:** No (restart needed for changes)

---

## 🔗 API Endpoints (Working)

Test these in your browser:

```
GET  http://localhost:5000/api/health
     → Returns: {"status":"OK",...}

GET  http://localhost:5000/api/version
     → Returns: {"version":"1.0.0",...}

POST http://localhost:5000/api/auth/register
     → Status: 501 (not implemented yet)

POST http://localhost:5000/api/posts
     → Status: 501 (not implemented yet)
```

---

## 📁 Project Folders

```
D:\Developer Application\Social-Media-Automation\
├── Web/                    ← Frontend (React/Next.js)
│   ├── src/app/           ← Pages & routes
│   └── src/components/    ← React components
├── API/                    ← Backend (Express.js)
│   └── app/               ← API routes & logic
├── Database/               ← SQL migrations
├── Configs/
│   └── .env               ← Your API keys
├── Docs/                   ← Documentation
└── Scripts/
    └── install-and-run.bat ← Run this to start
```

---

## 🎯 Next Steps

### After Servers Are Running:

1. **Explore Dashboard**
   - Visit http://localhost:3000
   - Check frontend status

2. **Test API**
   - Visit http://localhost:5000/api/health
   - Should show OK status

3. **Configure Database**
   - Create Supabase account
   - Get credentials
   - Update .env with DATABASE_URL

4. **Start Building**
   - Add API endpoints in API/app/api/
   - Build UI components in Web/src/components/
   - Connect to database

5. **Deploy**
   - Frontend to Vercel
   - Backend to Railway
   - Database on Supabase

---

## 📞 Need Help?

- **Read:** `/Docs/SETUP.md` for detailed setup
- **Check:** `/Docs/ARCHITECTURE.md` for system design
- **Review:** `/Docs/TROUBLESHOOTING.md` for common issues
- **Contact:** imran.it.support@gmail.com

---

## ⏱️ Typical Startup Times

- **npm install (first time):** 5-10 minutes
- **Frontend startup:** 3-5 seconds
- **Backend startup:** 1-2 seconds
- **Total time to ready:** ~10-15 minutes (first time)

Next time: Just run `install-and-run.bat` → 1-2 minutes!

---

## ✨ You're All Set!

Your Social Media Automation Platform is now running locally.

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:5000

Happy building! 🚀

---

**Created with ❤️ by Claude**  
**Muhammad Imran - Imran Pro Services**
