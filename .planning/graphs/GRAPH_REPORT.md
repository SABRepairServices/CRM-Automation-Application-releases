# Graph Report - Social-Media-Automation  (2026-08-05)

## Corpus Check
- 136 files · ~78,694 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1591 nodes · 1991 edges · 136 communities (114 shown, 22 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- action-button.tsx
- query
- ApiClient
- Phase 2 Implementation Summary
- Implementation Status - Production Ready Phase 2
- 📦 Complete System Summary
- Setup Guide - Imran Pro Services CRM
- 🚀 START HERE - Next Steps (CRITICAL INSTRUCTIONS)
- Imran Pro Services - CRM & Business Automation Platform
- ✅ IMPLEMENTATION COMPLETE - Ready to Use!
- API Endpoints - Complete Reference
- 👋 READ ME FIRST
- main.js
- compilerOptions
- Desktop/package.json
- 📥 How to Copy All Files to Your D: Drive
- 📖 API Endpoints Reference - All 24 Endpoints
- 📑 Complete File Index - Everything You Have
- 📱 Social Media Automation Platform - Phase 2 Complete
- ⚡ Quick Setup Guide - 10 Minutes to Running
- server.js
- Database Setup Guide - Imran Pro Services
- Quick Start - Phase 2 Social Media Integration (5 Minutes)
- AuthContext.tsx
- 📁 File Organization Guide
- social-posts/page.tsx
- devDependencies
- 🚀 START HERE - Social Media Automation Platform
- dependencies
- dependencies
- whatsappBotService.js
- config/database.js
- devDependencies
- ✅ Installation Checklist
- 🎉 Phase 2 Delivery - Complete Backend Implementation
- quotationService.js
- DO THIS ONLY - COMPLETE INSTRUCTIONS A TO Z
- ✅ COMPLETE FILE CHECKLIST (32 Total)
- 📚 Master Documentation Index
- Where to Get Tokens
- jobRoutes.js
- socialPostService.js
- 📁 Complete Folder Structure & File Locations
- 📖 Documentation by Use Case
- Phase 2 Integration Guide - Backend API + Frontend Client
- ⚡ Quick Start - 5 Minutes
- inspectionRoutes.js
- invoiceRoutes.js
- technicianRoutes.js
- pdfService.js
- dev-launch.js
- 📦 WHAT EACH FOLDER CONTAINS
- 📝 Social Media Posts
- Files Delivered
- invoiceBatchService.js
- API/package.json
- API Design Patterns
- 🚀 SETUP INSTRUCTIONS
- 🛠️ Common Tasks
- 🎯 Quick Navigation
- Phase 2: Social Media Integration - Complete Feature Guide
- Backend API - 24 Working Endpoints
- Routes (`API/app/routes/`)
- scripts
- System Architecture - Imran Pro Services CRM
- 🎯 NEXT ACTIONS
- Services (`API/app/services/`)
- 🚀 Quick Start (5 Minutes)
- scripts
- 🔑 Key Concepts
- 📋 Document Checklist
- 🚀 Getting Started Paths
- 🎯 Project Status
- 🚀 Quick Start Workflow
- 🛠️ How to Use (5-Minute Setup)
- 🆘 Troubleshooting
- 📈 Next Steps
- Web/package.json
- run_migration.mjs
- seed_demo_data.mjs
- Performance Optimization
- Database Schema Design
- Authentication & Authorization
- Testing Strategy (Not Yet Implemented)
- Frontend Architecture
- Scaling Considerations
- Deployment Architecture
- 🔄 FILE DEPENDENCIES
- 🔒 Important Files
- 📥 HOW TO COPY FILES TO YOUR MACHINE
- 📞 Support Resources
- 📊 Analytics & Metrics
- 🛠️ Troubleshooting
- 🔐 Security & Privacy
- 💡 Tips & Best Practices
- 📞 Support & Resources
- 📈 Roadmap (Phase 2 Continuation)
- 💻 Frontend Integration
- 💡 Key Features
- 🎯 Phase 3 Ready (Next Steps)
- 🚨 Error Handling
- 💻 Frontend API Client
- 🧪 Testing the Integration
- Backend Service Layer
- Data Model & Multi-Tenancy
- Error Handling Strategy
- Future Work / Backlog
- 🚀 Deployment Ready
- 📈 Database Operations
- 🔒 Security Best Practices
- 🔌 Connecting Frontend to Backend
- bcryptjs
- compression
- express
- express-async-errors
- helmet
- jsonwebtoken
- node-cron
- pdfkit
- pg
- supabase
- @supabase/supabase-js
- uuid
- smoke_test.mjs
- clsx
- preload.js
- @radix-ui/react-slot
- react-dom
- next.config.js
- next-env.d.ts
- typescript

## God Nodes (most connected - your core abstractions)
1. `query()` - 44 edges
2. `ApiClient` - 33 edges
3. `compilerOptions` - 26 edges
4. `✅ IMPLEMENTATION COMPLETE - Ready to Use!` - 22 edges
5. `📑 Complete File Index - Everything You Have` - 19 edges
6. `🎉 Phase 2 Delivery - Complete Backend Implementation` - 19 edges
7. `📦 Complete System Summary` - 18 edges
8. `Implementation Status - Production Ready Phase 2` - 17 edges
9. `Phase 2 Implementation Summary` - 17 edges
10. `System Architecture - Imran Pro Services CRM` - 16 edges

## Surprising Connections (you probably didn't know these)
- `recordDailyAnalytics()` --calls--> `query()`  [EXTRACTED]
  API/app/services/analyticsService.js → API/app/services/database.js
- `getAccountAnalytics()` --calls--> `query()`  [EXTRACTED]
  API/app/services/analyticsService.js → API/app/services/database.js
- `getDashboardMetrics()` --calls--> `query()`  [EXTRACTED]
  API/app/services/analyticsService.js → API/app/services/database.js
- `recordEngagementMetrics()` --calls--> `query()`  [EXTRACTED]
  API/app/services/analyticsService.js → API/app/services/database.js
- `getTopPerformingPosts()` --calls--> `query()`  [EXTRACTED]
  API/app/services/analyticsService.js → API/app/services/database.js

## Import Cycles
- None detected.

## Communities (136 total, 22 thin omitted)

### Community 0 - "action-button.tsx"
Cohesion: 0.07
Nodes (45): ClientsPage(), ApplianceRecord, JOB_STATUS_COLOR, CustomersPage(), InspectionDocumentPage(), InspectionsPage(), InvoiceDocumentPage(), InvoicesPage() (+37 more)

### Community 1 - "query"
Cohesion: 0.08
Nodes (44): generateRefreshToken(), generateToken(), getAccountAnalytics(), getDashboardMetrics(), getTopPerformingPosts(), recordDailyAnalytics(), recordEngagementMetrics(), createClient() (+36 more)

### Community 2 - "ApiClient"
Cohesion: 0.05
Nodes (9): UseApiState, Analytics, api, ApiClient, ApiResponse, AuthTokens, Post, SocialAccount (+1 more)

### Community 3 - "Phase 2 Implementation Summary"
Cohesion: 0.04
Nodes (47): Analytics (6 endpoints), API Endpoints Implemented, API Reference, ✅ API Routes (6 route handlers), Backend, ✅ Backend Services (6 services), Business Features (18+ endpoints), Credits (+39 more)

### Community 4 - "Implementation Status - Production Ready Phase 2"
Cohesion: 0.04
Nodes (44): Account Management (5 endpoints), Analytics (4 endpoints), 🔧 API Endpoints Summary, API Routes (4 files), Authentication (6 endpoints), ✅ Completed Today (July 31), Core Services (5 files), CRUD Operations Implemented (+36 more)

### Community 5 - "📦 Complete System Summary"
Cohesion: 0.05
Nodes (41): 13 Tables, 24 Working Endpoints, 📂 All 36 Files, All Code Is Production-Quality, Backend (API/ - 13 files), 🔧 Backend API (Express.js), Backend Development, 🆘 Common Questions (+33 more)

### Community 6 - "Setup Guide - Imran Pro Services CRM"
Cohesion: 0.05
Nodes (41): 1. Build Frontend, 1. Create a Test Client, 1. Prerequisites Check, 2. Add Test Customers, 2. Build Backend, 2. Clone & Navigate, 3. Create Test Jobs, 3. Environment Variables (Production) (+33 more)

### Community 7 - "🚀 START HERE - Next Steps (CRITICAL INSTRUCTIONS)"
Cohesion: 0.05
Nodes (41): 24 Working API Endpoints, 32 Complete Files, 🎯 AFTER EVERYTHING WORKS, Always Update, 🚨 COMMON ISSUES & FIXES, 📊 COMPLETE CHECKLIST, 📚 DOCUMENTATION LOCATIONS, Documentation Read ✓ (+33 more)

### Community 8 - "Imran Pro Services - CRM & Business Automation Platform"
Cohesion: 0.05
Nodes (40): Adding a New API Endpoint, API Documentation, Authentication, Backend, Backend (Express), Base URL, Clients, Contributing (+32 more)

### Community 9 - "✅ IMPLEMENTATION COMPLETE - Ready to Use!"
Cohesion: 0.05
Nodes (38): 📋 API Endpoints Available, Backend API Response, ✅ Complete Working Application, Configuration & Setup, Core Application Files, 🎯 Current Status, Database, 🚀 Deployment Ready (+30 more)

### Community 10 - "API Endpoints - Complete Reference"
Cohesion: 0.05
Nodes (38): Account Management, Add Social Account, Analytics Endpoints, API Endpoints - Complete Reference, Authentication, Authentication Endpoints, Common Status Codes, Create Post (+30 more)

### Community 11 - "👋 READ ME FIRST"
Cohesion: 0.05
Nodes (37): 1️⃣ HOW_TO_COPY_FILES.md (READ NOW!), 2️⃣ START_HERE.md (READ NEXT!), 3️⃣ QUICK_START_5MIN.md, 4️⃣ INSTALLATION_CHECKLIST.md, 5️⃣ README_INSTRUCTIONS.md, 6️⃣ API_ENDPOINTS_REFERENCE.md, 7️⃣ COMPLETE_SYSTEM_SUMMARY.md (Reference), 8️⃣ FILE_ORGANIZATION.md (Reference) (+29 more)

### Community 12 - "main.js"
Cohesion: 0.09
Nodes (33): { app }, configPath(), fs, getBackupFolder(), path, readConfig(), setBackupFolder(), writeConfig() (+25 more)

### Community 13 - "compilerOptions"
Cohesion: 0.05
Nodes (36): DOM, DOM.Iterable, ES2020, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+28 more)

### Community 14 - "Desktop/package.json"
Cohesion: 0.06
Nodes (33): author, build, appId, directories, files, productName, publish, win (+25 more)

### Community 15 - "📥 How to Copy All Files to Your D: Drive"
Cohesion: 0.06
Nodes (33): 🎯 After Files Are Copied, Check Folder Structure, Check Key Files Exist, Count Files, 📥 How to Copy All Files to Your D: Drive, ✅ How to Verify Everything Copied Correctly, 🚨 If Copy Failed, 📱 If Using Google Drive to Copy (+25 more)

### Community 16 - "📖 API Endpoints Reference - All 24 Endpoints"
Cohesion: 0.06
Nodes (32): 10. Update Account, 11. Disconnect Account, 12. List Posts, 13. Create Post, 14. Get Post Details, 15. Update Post, 16. Delete Post, 17. Schedule Post (+24 more)

### Community 17 - "📑 Complete File Index - Everything You Have"
Cohesion: 0.06
Nodes (31): Additional, 💻 BACKEND CODE FILES (13 files in API/ folder), 📊 COMPLETE FILE COUNT, 📑 Complete File Index - Everything You Have, Complete Guides, ⚙️ CONFIGURATION FILES (2 files), 🗄️ DATABASE FILES (1 file), 📖 DOCUMENTATION FILES (16 files) (+23 more)

### Community 18 - "📱 Social Media Automation Platform - Phase 2 Complete"
Cohesion: 0.06
Nodes (30): API/ - Backend (Express.js), 📊 API RESPONSE FORMAT, Can't Connect to Backend, 🆘 COMMON ISSUES, ⚙️ CONFIGURATION, Database Connection Error, 📚 DOCUMENTATION FILES, Environment Variables (.env) (+22 more)

### Community 19 - "⚡ Quick Setup Guide - 10 Minutes to Running"
Cohesion: 0.07
Nodes (29): 🚀 5-Minute Quick Start, Add Your API Keys, After Servers Are Running:, 🔗 API Endpoints (Working), Backend Server (Port 5000), 🐛 Common Issues & Fixes, 🔧 Configuration, Frontend Server (Port 3000) (+21 more)

### Community 20 - "server.js"
Cohesion: 0.14
Nodes (16): authenticate(), verifyClientAccess(), router, router, router, router, router, router (+8 more)

### Community 21 - "Database Setup Guide - Imran Pro Services"
Cohesion: 0.07
Nodes (28): Automatic Backups (Supabase), Configs/.env, "Connection refused" error, Database Backup, Database Setup Guide - Imran Pro Services, Documentation, Manual Backup, Next Steps (+20 more)

### Community 22 - "Quick Start - Phase 2 Social Media Integration (5 Minutes)"
Cohesion: 0.09
Nodes (21): 5-Minute Quick Start, Account Connection Fails, Command Line Testing (Optional), Common Next Questions, Connect More Accounts, Full Documentation, Key Features, Next Steps (+13 more)

### Community 23 - "AuthContext.tsx"
Cohesion: 0.13
Nodes (16): inter, metadata, LoginPage(), RegisterPage(), AuthGuard(), Header(), PAGE_TITLES, links (+8 more)

### Community 24 - "📁 File Organization Guide"
Cohesion: 0.08
Nodes (23): Backend API Files (13 files in API/ folder), 📋 Complete File List (32 Files), Configuration Files (2 files in Configs/ folder), DATABASE, Database Files (1 file in Database/ folder), DOCUMENTATION, Documentation Files (Top Level - 7 files), 📁 File Organization Guide (+15 more)

### Community 25 - "social-posts/page.tsx"
Cohesion: 0.17
Nodes (11): SocialAccountsPage(), SocialPostsPage(), AdvancedStats(), kpis, InteractiveHoverButton, InteractiveHoverButtonProps, SocialAccount, useSocialAccounts() (+3 more)

### Community 26 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, eslint-config-next, postcss, tailwindcss, @types/react, @types/react-dom, devDependencies, autoprefixer (+11 more)

### Community 27 - "🚀 START HERE - Social Media Automation Platform"
Cohesion: 0.11
Nodes (18): 🎯 After Setup Works, Backend Only, 🆘 Common Issues, 📋 Configuration (.env), 📂 File Locations, Frontend Only, 🎯 Next 3 Steps, ⚡ Quick Reference (+10 more)

### Community 28 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, axios, bull, cors, dotenv, joi, morgan, nodemailer (+9 more)

### Community 29 - "dependencies"
Cohesion: 0.12
Nodes (17): class-variance-authority, lucide-react, next, react, tailwind-merge, @tanstack/react-query, dependencies, axios (+9 more)

### Community 30 - "whatsappBotService.js"
Cohesion: 0.28
Nodes (15): getInvoice(), APPROVE_WORDS, createQuotationDirect(), getClientById(), handleCustomerReply(), handleTechnicianDone(), handleTechnicianMessage(), isDoneMessage() (+7 more)

### Community 31 - "config/database.js"
Cohesion: 0.31
Nodes (9): router, findTechnicianByPhone(), graphUrl(), isConfigured(), logMessage(), sendDocument(), sendText(), __dirname (+1 more)

### Community 32 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, nodemon, prettier, @types/express, @types/node, typescript, eslint (+5 more)

### Community 33 - "✅ Installation Checklist"
Cohesion: 0.15
Nodes (12): 🎊 ALL DONE!, ✅ FINAL CHECK, 🆘 If Something Breaks, ✅ Installation Checklist, 📥 STEP 1: Copy Files to D: Drive, 🔧 STEP 2: Install Dependencies, 🚀 STEP 3: Start Servers, ✔️ STEP 4: Verify System Works (+4 more)

### Community 34 - "🎉 Phase 2 Delivery - Complete Backend Implementation"
Cohesion: 0.15
Nodes (12): 📊 Code Statistics, 📚 Documentation Included, 📋 Integration Checklist, 🎯 Next Actions, 🎉 Phase 2 Delivery - Complete Backend Implementation, 📈 Project Timeline, ✨ Quality Assurance, 🔗 Quick Links (+4 more)

### Community 35 - "quotationService.js"
Cohesion: 0.38
Nodes (8): generateInvoiceForApprovedQuotation(), computeTotals(), createQuotation(), deleteQuotation(), getQuotation(), getQuotationStats(), listQuotations(), updateQuotation()

### Community 36 - "DO THIS ONLY - COMPLETE INSTRUCTIONS A TO Z"
Cohesion: 0.20
Nodes (9): DO THIS ONLY - COMPLETE INSTRUCTIONS A TO Z, IMPORTANT NOTES, STEP 1: COPY FILES, STEP 2: RUN INSTALLER, STEP 3: TEST, THAT'S IT, WHAT'S NEXT AFTER IT WORKS, WHAT YOU HAVE (+1 more)

### Community 37 - "✅ COMPLETE FILE CHECKLIST (32 Total)"
Cohesion: 0.20
Nodes (10): Android/ (1 file), API/ Backend (13 files), ✅ COMPLETE FILE CHECKLIST (32 Total), Configs/ (2 files), Database/ (1 file), Docs/ Folder (4 files), Documentation (11 files), Root Files (1 file) (+2 more)

### Community 38 - "📚 Master Documentation Index"
Cohesion: 0.20
Nodes (9): Documentation Files, 📊 Documentation Statistics, 📁 File Organization, 📚 Master Documentation Index, 🚀 Next Steps, Source Code Files, Status: 🟢 COMPLETE & PRODUCTION READY, ✨ Summary (+1 more)

### Community 39 - "Where to Get Tokens"
Cohesion: 0.20
Nodes (10): Connecting an Account, Facebook, Instagram, LinkedIn, Managing Accounts, 🔗 Social Media Accounts, TikTok, Twitter/X (+2 more)

### Community 40 - "jobRoutes.js"
Cohesion: 0.39
Nodes (7): router, createJob(), deleteJob(), getJob(), getJobStats(), listJobs(), updateJob()

### Community 42 - "📁 Complete Folder Structure & File Locations"
Cohesion: 0.22
Nodes (8): 📋 COMPLETE FILE LISTING (32 Files Total), 📁 Complete Folder Structure & File Locations, Currently in Cloud Environment, 📊 FILE SIZE Estimate, ✨ Summary, 🎯 WHERE ARE YOUR FILES RIGHT NOW?, 🎯 WHERE SHOULD THESE FILES GO?, Your Local Machine Structure (What You Need to Create)

### Community 43 - "📖 Documentation by Use Case"
Cohesion: 0.22
Nodes (9): 📖 Documentation by Use Case, "I just want to get it running", "I need to add database features", "I need to build React components", "I need to deploy this", "I need to develop the API", "I want all the details", "I want to understand the system" (+1 more)

### Community 44 - "Phase 2 Integration Guide - Backend API + Frontend Client"
Cohesion: 0.22
Nodes (8): 🔧 Configuration, 📚 Documentation Files, Environment Variables, 📋 Overview, Phase 2 Integration Guide - Backend API + Frontend Client, 📞 Support, ✅ Verification Checklist, 🎊 You're Ready!

### Community 45 - "⚡ Quick Start - 5 Minutes"
Cohesion: 0.22
Nodes (8): 📚 NEXT: Read These Files, 🆘 PROBLEMS?, ⚡ Quick Start - 5 Minutes, STEP 1: Install (2 minutes), STEP 2: Start Frontend (1 minute), STEP 3: Start Backend (1 minute), STEP 4: Test (1 minute), ✅ YOU'RE DONE!

### Community 46 - "inspectionRoutes.js"
Cohesion: 0.46
Nodes (6): createInspectionReport(), deleteInspectionReport(), getInspectionReport(), listInspectionReports(), updateInspectionReport(), generateQuotationForFinalizedInspection()

### Community 47 - "invoiceRoutes.js"
Cohesion: 0.43
Nodes (6): router, createInvoice(), deleteInvoice(), getInvoiceStats(), listInvoices(), updateInvoice()

### Community 48 - "technicianRoutes.js"
Cohesion: 0.43
Nodes (6): router, createTechnician(), deleteTechnician(), getTechnician(), listTechnicians(), updateTechnician()

### Community 49 - "pdfService.js"
Cohesion: 0.68
Nodes (7): buildPdf(), customerBlock(), generateInspectionPdf(), generateInvoicePdf(), generateQuotationPdf(), header(), money()

### Community 50 - "dev-launch.js"
Cohesion: 0.25
Nodes (6): API_DIR, apiProcess, path, { spawn }, WEB_DIR, webProcess

### Community 51 - "📦 WHAT EACH FOLDER CONTAINS"
Cohesion: 0.25
Nodes (8): Android/, API/ - Backend Server, Configs/, Database/, Docs/, Scripts/, Web/ - Frontend Application, 📦 WHAT EACH FOLDER CONTAINS

### Community 52 - "📝 Social Media Posts"
Cohesion: 0.25
Nodes (8): Creating a Post, Deleting Posts, Editing Posts, Post Statuses, Publish Immediately, Publishing Options, Schedule for Later, 📝 Social Media Posts

### Community 53 - "Files Delivered"
Cohesion: 0.25
Nodes (8): API Routes (4 files), API Services (5 files), Documentation (3 files), Files Delivered, Frontend Integration (2 files), Middleware (1 file), Updated Server (1 file), 📊 What You're Getting

### Community 54 - "invoiceBatchService.js"
Cohesion: 0.57
Nodes (5): getTransporter(), isConfigured(), sendPdfEmail(), isWithinLastThreeDaysOfMonth(), runMonthEndContractorBatch()

### Community 55 - "API/package.json"
Cohesion: 0.29
Nodes (6): description, main, name, private, type, version

### Community 56 - "API Design Patterns"
Cohesion: 0.29
Nodes (7): API Architecture, API Design Patterns, Multi-Client Query Parameter, Pagination, Request/Response Flow, Soft Deletes, Standard Response Format

### Community 57 - "🚀 SETUP INSTRUCTIONS"
Cohesion: 0.29
Nodes (7): 🚀 SETUP INSTRUCTIONS, Step 1: Create Main Folder, Step 2: Copy All Files, Step 3: Verify Structure, Step 4: Install Dependencies, Step 5: Run Installer, Step 6: Verify

### Community 58 - "🛠️ Common Tasks"
Cohesion: 0.29
Nodes (7): Add API Keys, 🛠️ Common Tasks, Configure Database, Deploy, Develop Features, Setup & Installation, Test Endpoints

### Community 59 - "🎯 Quick Navigation"
Cohesion: 0.29
Nodes (7): For API Development, For Database, For Deployment, For Development, For Frontend Development, For Setup & Installation, 🎯 Quick Navigation

### Community 60 - "Phase 2: Social Media Integration - Complete Feature Guide"
Cohesion: 0.29
Nodes (7): 🔄 API Reference, ✅ Checklist for First Post, 📱 Overview, Phase 2: Social Media Integration - Complete Feature Guide, Posts Endpoints, Social Accounts Endpoints, What's New

### Community 61 - "Backend API - 24 Working Endpoints"
Cohesion: 0.29
Nodes (7): Account Management (5 endpoints), Analytics (4 endpoints), Authentication (6 endpoints), Backend API - 24 Working Endpoints, Post Management (7 endpoints), System (2 endpoints), 🔧 What's Implemented

### Community 62 - "Routes (`API/app/routes/`)"
Cohesion: 0.29
Nodes (7): Account Routes, Analytics Routes, Authentication Routes, 📚 Backend API Structure, Middleware (`API/app/middleware/auth.js`), Post Routes, Routes (`API/app/routes/`)

### Community 63 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, format, lint, start

### Community 64 - "System Architecture - Imran Pro Services CRM"
Cohesion: 0.33
Nodes (6): Core Principles, Documentation Maps, Overview, Security Audit Checklist, System Architecture - Imran Pro Services CRM, Technology Stack Decision Matrix

### Community 65 - "🎯 NEXT ACTIONS"
Cohesion: 0.33
Nodes (6): 🎯 NEXT ACTIONS, Step 1: Verify You Have All Files, Step 2: Copy All Files to D: Drive, Step 3: Run Setup, Step 4: Test Everything, Step 5: Read Documentation

### Community 66 - "Services (`API/app/services/`)"
Cohesion: 0.33
Nodes (6): Analytics Service, Database Service, Post Service, Services (`API/app/services/`), Social Account Service, User Service

### Community 67 - "🚀 Quick Start (5 Minutes)"
Cohesion: 0.33
Nodes (6): 🚀 Quick Start (5 Minutes), Step 1: Copy API Files, Step 2: Replace Backend Server, Step 3: Copy Frontend Files, Step 4: Install Dependencies (if needed), Step 5: Start Servers

### Community 68 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, format, lint, start

### Community 69 - "🔑 Key Concepts"
Cohesion: 0.40
Nodes (5): API Endpoints, Authentication, Database, Frontend, 🔑 Key Concepts

### Community 70 - "📋 Document Checklist"
Cohesion: 0.40
Nodes (5): Code Documentation (Embedded in Files), 📋 Document Checklist, Essential (Read First), Important (Read Before Development), Reference (Consult as Needed)

### Community 71 - "🚀 Getting Started Paths"
Cohesion: 0.40
Nodes (5): 🚀 Getting Started Paths, Path 1: Quick Start (15 Minutes), Path 2: Full Setup (45 Minutes), Path 3: Development Setup (60 Minutes), Path 4: Production Deployment

### Community 72 - "🎯 Project Status"
Cohesion: 0.40
Nodes (5): Phase 1: ✅ Complete, Phase 2: ✅ Complete (YOU ARE HERE), Phase 3: ⏳ Ready to Start, Phase 4: ⏳ Future, 🎯 Project Status

### Community 73 - "🚀 Quick Start Workflow"
Cohesion: 0.40
Nodes (5): 1. First Time Setup (5 minutes), 2. Create First Post (2 minutes), 3. Publish Immediately (1 minute), 4. Schedule a Post (2 minutes), 🚀 Quick Start Workflow

### Community 74 - "🛠️ How to Use (5-Minute Setup)"
Cohesion: 0.40
Nodes (5): 🛠️ How to Use (5-Minute Setup), Step 1: Copy Files, Step 2: Update Backend Server, Step 3: Start Servers, Step 4: Test

### Community 75 - "🆘 Troubleshooting"
Cohesion: 0.40
Nodes (5): Backend won't start, Database connection error, Frontend can't reach backend, JWT token invalid, 🆘 Troubleshooting

### Community 76 - "📈 Next Steps"
Cohesion: 0.40
Nodes (5): Immediate (Next Hour), 📈 Next Steps, Next Week, This Week, Today

### Community 77 - "Web/package.json"
Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 78 - "run_migration.mjs"
Cohesion: 0.50
Nodes (3): client, __dirname, sql

### Community 79 - "seed_demo_data.mjs"
Cohesion: 0.67
Nodes (3): __dirname, login(), main()

### Community 80 - "Performance Optimization"
Cohesion: 0.50
Nodes (4): API Level, Database Level, Frontend Level, Performance Optimization

### Community 81 - "Database Schema Design"
Cohesion: 0.50
Nodes (4): Audit Trail, Core Tables Structure, Database Schema Design, Relationships

### Community 82 - "Authentication & Authorization"
Cohesion: 0.50
Nodes (4): Authentication & Authorization, Current Implementation, Future Implementation, RLS Policies

### Community 83 - "Testing Strategy (Not Yet Implemented)"
Cohesion: 0.50
Nodes (4): Backend Tests, Frontend Tests, Integration Tests, Testing Strategy (Not Yet Implemented)

### Community 84 - "Frontend Architecture"
Cohesion: 0.50
Nodes (4): Component Reusability, Frontend Architecture, Hook Pattern, Page Structure

### Community 85 - "Scaling Considerations"
Cohesion: 0.50
Nodes (4): Current Limits (Single Server), Monitoring (Future), Scaling Considerations, Scaling Path

### Community 86 - "Deployment Architecture"
Cohesion: 0.50
Nodes (4): Deployment Architecture, Development, Environment Parity, Production

### Community 87 - "🔄 FILE DEPENDENCIES"
Cohesion: 0.50
Nodes (4): Backend Depends On:, 🔄 FILE DEPENDENCIES, Frontend + Backend Depends On:, Frontend Depends On:

### Community 88 - "🔒 Important Files"
Cohesion: 0.50
Nodes (4): Critical for Operation, 🔒 Important Files, Must Read First, Reference Files

### Community 89 - "📥 HOW TO COPY FILES TO YOUR MACHINE"
Cohesion: 0.50
Nodes (4): 📥 HOW TO COPY FILES TO YOUR MACHINE, Option 1: Manual Download (Easiest), Option 2: Using Git (Recommended), Option 3: Manual Copy (If using device bridge)

### Community 90 - "📞 Support Resources"
Cohesion: 0.50
Nodes (4): Code Examples, Documentation, Getting Help, 📞 Support Resources

### Community 91 - "📊 Analytics & Metrics"
Cohesion: 0.50
Nodes (4): Account Analytics (Coming Phase 2c), 📊 Analytics & Metrics, Dashboard Overview, Post Analytics (Coming Phase 2c)

### Community 92 - "🛠️ Troubleshooting"
Cohesion: 0.50
Nodes (4): Account Connection Issues, Account Disconnection, Post Publishing Issues, 🛠️ Troubleshooting

### Community 93 - "🔐 Security & Privacy"
Cohesion: 0.50
Nodes (4): Best Practices, Data Privacy, 🔐 Security & Privacy, Token Security

### Community 94 - "💡 Tips & Best Practices"
Cohesion: 0.50
Nodes (4): Content Strategy, Multi-Platform Tips, Optimal Posting Times, 💡 Tips & Best Practices

### Community 95 - "📞 Support & Resources"
Cohesion: 0.50
Nodes (4): Documentation, Getting Help, Platform Resources, 📞 Support & Resources

### Community 96 - "📈 Roadmap (Phase 2 Continuation)"
Cohesion: 0.50
Nodes (4): Phase 2b (Next), Phase 2c (Following), Phase 3, 📈 Roadmap (Phase 2 Continuation)

### Community 97 - "💻 Frontend Integration"
Cohesion: 0.50
Nodes (4): Automatic Features, 💻 Frontend Integration, React Hooks, TypeScript API Client

### Community 98 - "💡 Key Features"
Cohesion: 0.50
Nodes (4): Backend, Database, Frontend, 💡 Key Features

### Community 99 - "🎯 Phase 3 Ready (Next Steps)"
Cohesion: 0.50
Nodes (4): Option 1: AI Content Generation (2-3 hours), Option 2: Social Platform APIs (4-5 hours), Option 3: Job Queue (3-4 hours), 🎯 Phase 3 Ready (Next Steps)

### Community 100 - "🚨 Error Handling"
Cohesion: 0.50
Nodes (4): Common Errors, 🚨 Error Handling, Handling in React, Standard Error Response

### Community 101 - "💻 Frontend API Client"
Cohesion: 0.50
Nodes (4): Direct API Calls, 💻 Frontend API Client, Setup, Using React Hooks

### Community 102 - "🧪 Testing the Integration"
Cohesion: 0.50
Nodes (4): In React Component, 🧪 Testing the Integration, Using cURL, Using Postman

### Community 103 - "Backend Service Layer"
Cohesion: 0.67
Nodes (3): Backend Service Layer, Route File Pattern, Service File Pattern

### Community 104 - "Data Model & Multi-Tenancy"
Cohesion: 0.67
Nodes (3): Data Model & Multi-Tenancy, Security Implementation, Tenancy Model: Row-Level Isolation

### Community 105 - "Error Handling Strategy"
Cohesion: 0.67
Nodes (3): Error Handling Strategy, Error Types & Handling, Layers

### Community 107 - "🚀 Deployment Ready"
Cohesion: 0.67
Nodes (3): Current Status, 🚀 Deployment Ready, Ready for Production

### Community 108 - "📈 Database Operations"
Cohesion: 0.67
Nodes (3): 📈 Database Operations, Fully Implemented CRUD, Query Features

### Community 109 - "🔒 Security Best Practices"
Cohesion: 0.67
Nodes (3): Backend, Frontend, 🔒 Security Best Practices

### Community 110 - "🔌 Connecting Frontend to Backend"
Cohesion: 0.67
Nodes (3): 🔌 Connecting Frontend to Backend, Environment Variables, In React Components

## Knowledge Gaps
- **941 isolated node(s):** `router`, `__dirname`, `name`, `version`, `description` (+936 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 2: Social Media Integration - Complete Feature Guide` connect `Phase 2: Social Media Integration - Complete Feature Guide` to `📈 Roadmap (Phase 2 Continuation)`, `Where to Get Tokens`, `🚀 Quick Start Workflow`, `📝 Social Media Posts`, `Quick Start - Phase 2 Social Media Integration (5 Minutes)`, `📊 Analytics & Metrics`, `🛠️ Troubleshooting`, `🔐 Security & Privacy`, `💡 Tips & Best Practices`, `📞 Support & Resources`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `System Architecture - Imran Pro Services CRM` connect `System Architecture - Imran Pro Services CRM` to `Backend Service Layer`, `Data Model & Multi-Tenancy`, `Error Handling Strategy`, `Performance Optimization`, `Database Schema Design`, `Authentication & Authorization`, `Testing Strategy (Not Yet Implemented)`, `Frontend Architecture`, `Scaling Considerations`, `Quick Start - Phase 2 Social Media Integration (5 Minutes)`, `Deployment Architecture`, `API Design Patterns`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `router`, `__dirname`, `name` to the rest of the system?**
  _941 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `action-button.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06997929606625258 - nodes in this community are weakly interconnected._
- **Should `query` be split into smaller, more focused modules?**
  _Cohesion score 0.07767722473604827 - nodes in this community are weakly interconnected._
- **Should `ApiClient` be split into smaller, more focused modules?**
  _Cohesion score 0.04698581560283688 - nodes in this community are weakly interconnected._
- **Should `Phase 2 Implementation Summary` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._