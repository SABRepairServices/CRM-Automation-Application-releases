# 📥 How to Copy All Files to Your D: Drive

**Simple step-by-step guide - Takes 5 minutes**

---

## 🎯 What You Need to Do

Copy all files from cloud to your D: drive at:
```
D:\Developer Application\Social-Media-Automation\
```

This folder should already exist on your machine.

---

## 📋 Option 1: Drag & Drop (Easiest)

### Step 1: Find Downloaded Files
- Look in your **Downloads** folder
- Or check where you saved the files
- You should see a folder named `Social-Media-Automation` or individual files

### Step 2: Open Two Windows
- **Window 1:** Your Downloads folder (or where files are)
- **Window 2:** Open `D:\Developer Application\Social-Media-Automation\`

### Step 3: Drag & Drop
- Select ALL files from Window 1
- Drag them to Window 2
- Wait for copy to complete (1-2 minutes)

### Step 4: Verify
Open `D:\Developer Application\Social-Media-Automation\` and check:
- [ ] API folder exists
- [ ] Web folder exists
- [ ] Database folder exists
- [ ] Configs folder exists
- [ ] Scripts folder exists
- [ ] .md files visible

**Done!** All files are copied.

---

## 💻 Option 2: Command Line (Windows)

### Step 1: Open Command Prompt
- Press: `Win + R`
- Type: `cmd`
- Press: `Enter`

### Step 2: Copy Files
If files are in Downloads:
```bash
xcopy /E /I /Y "C:\Users\%USERNAME%\Downloads\Social-Media-Automation\*" "D:\Developer Application\Social-Media-Automation\"
```

Or navigate to where files are:
```bash
cd Downloads
xcopy /E /I /Y * "D:\Developer Application\Social-Media-Automation\"
```

### Step 3: Wait
- Command will show `X file(s) copied`
- Takes 1-2 minutes

### Step 4: Verify
```bash
dir "D:\Developer Application\Social-Media-Automation"
```

Should show: API, Web, Database, Configs, Scripts, and .md files

**Done!** All files are copied.

---

## 📁 Option 3: Manual Copy

### Step 1: Create Folders
```bash
# Open Command Prompt
cd D:\Developer Application\Social-Media-Automation

# Create subfolders
mkdir API\app\middleware
mkdir API\app\services
mkdir API\app\routes
mkdir Web\src\app
mkdir Web\src\lib
mkdir Web\src\hooks
mkdir Web\public
mkdir Database\migrations
mkdir Configs
mkdir Scripts
mkdir Docs
```

### Step 2: Copy Files Manually
- Navigate to Downloads
- Copy `API` files into `API` folder
- Copy `Web` files into `Web` folder
- Copy `Database` files into `Database` folder
- Copy `Configs` files into `Configs` folder
- Copy `Scripts` files into `Scripts` folder
- Copy all `.md` files to root folder

### Step 3: Verify
All folders should have files inside.

**Done!** All files are copied.

---

## ✅ How to Verify Everything Copied Correctly

### Check Folder Structure
Run this command:
```bash
dir /s "D:\Developer Application\Social-Media-Automation"
```

You should see (approximately):
```
Directory of D:\Developer Application\Social-Media-Automation

API/
  - server-updated.js
  - package.json
  - app/
    - middleware/auth.js
    - services/[files]
    - routes/[files]

Web/
  - package.json
  - next.config.js
  - src/
    - app/[files]
    - lib/api.ts
    - hooks/useApi.ts

Database/
  - migrations/001_initial_schema.sql

Configs/
  - .env
  - .env.example

Scripts/
  - install-and-run.bat
  - setup.bat
  - [other scripts]

[All .md documentation files]
```

### Count Files
All 36 files should be there:
```bash
dir /s /b "D:\Developer Application\Social-Media-Automation" | find /c ":"
```

Should show: **36** (approximately)

### Check Key Files Exist
```bash
# These should all exist:
dir "D:\Developer Application\Social-Media-Automation\API\server-updated.js"
dir "D:\Developer Application\Social-Media-Automation\Web\package.json"
dir "D:\Developer Application\Social-Media-Automation\Scripts\install-and-run.bat"
dir "D:\Developer Application\Social-Media-Automation\START_HERE.md"
```

If all of these show "file found", you're good! ✅

---

## 🚨 If Copy Failed

### Problem: Files Won't Copy
**Solution:**
- Right-click source folder → "Copy"
- Right-click destination → "Paste as"
- Wait for copy to complete

### Problem: Permission Denied
**Solution:**
- Right-click Command Prompt → "Run as administrator"
- Try copy command again

### Problem: Not Enough Space
**Solution:**
- Check D: drive has at least 1GB free
- Use: `dir D:\` to see available space
- Delete unnecessary files if needed

### Problem: Files Already Exist
**Solution:**
- It's OK to overwrite
- Right-click → "Copy"
- Click "Replace all" when asked

---

## 📱 If Using Google Drive to Copy

### Step 1: Download Files
1. Open Google Drive
2. Find Social-Media-Automation folder
3. Right-click → Download
4. Save to Downloads (or any location)

### Step 2: Extract (If Zipped)
- File appears as `.zip`
- Right-click → Extract All
- Choose destination: Downloads

### Step 3: Copy to D: Drive
- Follow "Option 1: Drag & Drop" above
- Or use "Option 2: Command Line"

### Step 4: Verify
- Check all 36 files are there
- Check folder structure is intact

---

## ⏱️ Time Guide

| Method | Time | Difficulty |
|--------|------|------------|
| Drag & Drop | 5 min | Easy ⭐ |
| Command Line | 3 min | Medium ⭐⭐ |
| Manual Copy | 15 min | Hard ⭐⭐⭐ |

**Recommended:** Use Drag & Drop (Option 1) - it's easiest!

---

## 🎯 After Files Are Copied

Once all files are at `D:\Developer Application\Social-Media-Automation\`:

1. **Read:** START_HERE.md
2. **Read:** QUICK_START_5MIN.md
3. **Run:** Scripts\install-and-run.bat
4. **Test:** http://localhost:3000 and http://localhost:5000/api/health

That's it! System will start automatically.

---

## ✨ You're Done!

When you see all 36 files in `D:\Developer Application\Social-Media-Automation\`:

✅ Files copied successfully  
✅ Folder structure complete  
✅ Ready for installation  

**Next:** Run START_HERE.md for the final 3 steps!

---

**Version:** 1.0.0  
**Date:** July 30, 2026  
**Difficulty:** ⭐ Easy
