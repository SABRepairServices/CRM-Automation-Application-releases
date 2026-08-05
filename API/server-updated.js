import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';
import dotenv from 'dotenv';
import { initSupabase, initPostgres } from './app/services/database.js';
import authRoutes from './app/routes/authRoutes.js';
import accountRoutes from './app/routes/accountRoutes.js';
import postRoutes from './app/routes/postRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;
const HOST = process.env.API_HOST || '0.0.0.0';

// ============================================================
// Middleware
// ============================================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// Database Initialization
// ============================================================

console.log('\n📊 Initializing Database...');
console.log(`   URL: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Supabase: ${process.env.SUPABASE_PROJECT_URL ? '✅ Configured' : '❌ Missing'}`);

// Try Supabase first, fallback to PostgreSQL
const supabase = initSupabase();
const pgPool = supabase ? null : initPostgres();

// ============================================================
// Routes
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  const startTime = process.uptime();
  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: parseFloat(startTime.toFixed(3)),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Version endpoint
app.get('/api/version', (req, res) => {
  return res.status(200).json({
    version: '1.0.0',
    name: 'Social Media Automation Platform',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Account routes
app.use('/api/accounts', accountRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Placeholder routes for future features
app.post('/api/analytics/dashboard', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Analytics endpoint not yet implemented',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai/generate-caption', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'AI caption generation not yet implemented',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai/generate-hashtags', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'AI hashtag generation not yet implemented',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);

  return res.status(error.status || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ============================================================
// Server Startup
// ============================================================

app.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Social Media Automation - Backend API                ║');
  console.log('║   Version: 1.0.0                                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📍 Available Endpoints:');
  console.log('   ✅ GET  /api/health                    → Health check');
  console.log('   ✅ GET  /api/version                   → Version info');
  console.log('   ✅ POST /api/auth/register             → Register user');
  console.log('   ✅ POST /api/auth/login                → User login');
  console.log('   ✅ GET  /api/auth/me                   → Get profile');
  console.log('   ✅ PUT  /api/auth/profile              → Update profile');
  console.log('   ✅ GET  /api/auth/preferences          → Get preferences');
  console.log('   ✅ PUT  /api/auth/preferences          → Update preferences');
  console.log('   ✅ GET  /api/accounts                  → List accounts');
  console.log('   ✅ POST /api/accounts                  → Add account');
  console.log('   ✅ GET  /api/accounts/:id              → Get account');
  console.log('   ✅ PUT  /api/accounts/:id              → Update account');
  console.log('   ✅ DELETE /api/accounts/:id            → Remove account');
  console.log('   ✅ GET  /api/posts                     → List posts');
  console.log('   ✅ POST /api/posts                     → Create post');
  console.log('   ✅ GET  /api/posts/:id                 → Get post');
  console.log('   ✅ PUT  /api/posts/:id                 → Update post');
  console.log('   ✅ DELETE /api/posts/:id               → Delete post');
  console.log('   ✅ POST /api/posts/:id/schedule        → Schedule post');
  console.log('   ✅ GET  /api/posts/scheduled/list      → Get scheduled');
  console.log('   ⏳ POST /api/analytics/dashboard       → Analytics (coming)');
  console.log('   ⏳ POST /api/ai/generate-caption       → AI caption (coming)');
  console.log('\n📚 Documentation: See /Docs folder for setup guides');
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🔗 Backend: http://${HOST}:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
