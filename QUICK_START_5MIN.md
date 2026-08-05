# ⚡ Quick Start - 5 Minutes

---

## STEP 1: Install (2 minutes)

Open Command Prompt and run:

```bash
cd "D:\Developer Application\Social-Media-Automation\Web"
npm install

cd "..\API"
npm install
```

---

## STEP 2: Start Frontend (1 minute)

Open new Command Prompt:

```bash
cd "D:\Developer Application\Social-Media-Automation\Web"
npm run dev
```

**Result:** Frontend running at http://localhost:3000

---

## STEP 3: Start Backend (1 minute)

Open another Command Prompt:

```bash
cd "D:\Developer Application\Social-Media-Automation\API"
npm run dev
```

**Result:** Backend running at http://localhost:5000

---

## STEP 4: Test (1 minute)

Open browser and check:

1. **Frontend:** http://localhost:3000
   - Should show: Social Media Automation Dashboard

2. **Backend:** http://localhost:5000/api/health
   - Should show: `{"status":"OK",...}`

---

## ✅ YOU'RE DONE!

Both servers running = System is ready!

---

## 📚 NEXT: Read These Files

1. `README_INSTRUCTIONS.md` - Main guide
2. `API_ENDPOINTS.md` - All 24 endpoints
3. `SETUP_GUIDE.md` - Full setup details

---

## 🆘 PROBLEMS?

**Port 5000 in use:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**npm not found:**
- Download Node.js: https://nodejs.org/
- Restart terminal after install

**Frontend can't reach backend:**
- Check `Configs/.env`
- Verify: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

---

**That's it! System is running!** 🎉
