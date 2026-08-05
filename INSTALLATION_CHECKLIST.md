# ✅ Installation Checklist

**Check off each step as you complete it**

---

## 📥 STEP 1: Copy Files to D: Drive

- [ ] Files are in: `D:\Developer Application\Social-Media-Automation\`
- [ ] Verify folder contains:
  - [ ] `API/` folder with server.js
  - [ ] `Web/` folder with package.json
  - [ ] `Database/` folder with schema.sql
  - [ ] `Configs/` folder with .env
  - [ ] `Scripts/` folder with install-and-run.bat
  - [ ] Documentation files (README, QUICK_START, etc.)

**Verify with command:**
```bash
dir D:\Developer Application\Social-Media-Automation
```

Should show: API, Web, Database, Configs, Scripts, and .md files

---

## 🔧 STEP 2: Install Dependencies

Open Command Prompt:

```bash
cd D:\Developer Application\Social-Media-Automation\Web
npm install
```

- [ ] Frontend installation completed (check for "added X packages")

```bash
cd ..\API
npm install
```

- [ ] Backend installation completed (check for "added X packages")

---

## 🚀 STEP 3: Start Servers

Open TWO Command Prompt windows:

**Window 1 - Frontend:**
```bash
cd D:\Developer Application\Social-Media-Automation\Web
npm run dev
```
- [ ] Shows "Local: http://localhost:3000"
- [ ] No errors in output

**Window 2 - Backend:**
```bash
cd D:\Developer Application\Social-Media-Automation\API
npm run dev
```
- [ ] Shows "Server running on http://localhost:5000"
- [ ] No errors in output

---

## ✔️ STEP 4: Verify System Works

### Test Frontend
Open browser: http://localhost:3000

- [ ] Page loads (shows dashboard or main screen)
- [ ] No red errors in console (F12)
- [ ] Connects to backend (check Network tab in F12)

### Test Backend Health Check
Open browser: http://localhost:5000/api/health

- [ ] Shows JSON response
- [ ] Status is "OK"
- [ ] Has timestamp

**Example response:**
```json
{
  "status": "OK",
  "timestamp": "2026-07-30T10:00:00Z",
  "uptime": 123.45,
  "environment": "development"
}
```

---

## 📚 STEP 5: Read Documentation

- [ ] Read: `START_HERE.md` (this folder)
- [ ] Read: `QUICK_START_5MIN.md`
- [ ] Read: `README_INSTRUCTIONS.md`
- [ ] Read: `API_ENDPOINTS_REFERENCE.md`

---

## 🎯 STEP 6: Update Configuration

Edit: `Configs/.env`

- [ ] Set DATABASE_URL (if using remote database)
- [ ] Set NEXT_PUBLIC_API_URL (if different from localhost:5000)
- [ ] Set JWT_SECRET (random string for security)
- [ ] Add API keys when needed (Anthropic, Instagram, etc.)

---

## ✅ FINAL CHECK

- [ ] Frontend running on http://localhost:3000 ✅
- [ ] Backend running on http://localhost:5000 ✅
- [ ] /api/health returns OK ✅
- [ ] No error messages ✅
- [ ] Documentation files read ✅
- [ ] Configuration updated ✅

---

## 🎊 ALL DONE!

When all checkmarks are complete:

✅ Your system is fully installed and working  
✅ Both servers are running  
✅ Frontend dashboard is accessible  
✅ Backend API is responding  
✅ You've read all documentation  
✅ Configuration is set up  

**Next:** Start building Phase 3 features or customize the dashboard!

---

## 🆘 If Something Breaks

**Frontend won't start:**
- Check Node.js installed: `node --version`
- Delete `Web/node_modules` and run `npm install` again
- Check for port 3000 in use

**Backend won't start:**
- Check Node.js installed: `node --version`
- Delete `API/node_modules` and run `npm install` again
- Check for port 5000 in use
- Check `.env` file exists in `Configs/`

**Can't reach localhost:3000 or 5000:**
- Both terminals should be running (check both windows)
- Wait 10 seconds after starting (compilation takes time)
- Check firewall isn't blocking ports

**See troubleshooting in README_INSTRUCTIONS.md for more help**

---

**Status:** Ready to Install  
**Version:** 1.0.0  
**Date:** July 30, 2026
