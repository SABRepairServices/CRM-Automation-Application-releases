import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Routes
import authRoutes from './app/routes/authRoutes.js';
import clientRoutes from './app/routes/clientRoutes.js';
import customerRoutes from './app/routes/customerRoutes.js';
import jobRoutes from './app/routes/jobRoutes.js';
import quotationRoutes from './app/routes/quotationRoutes.js';
import invoiceRoutes from './app/routes/invoiceRoutes.js';
import inspectionRoutes from './app/routes/inspectionRoutes.js';
import technicianRoutes from './app/routes/technicianRoutes.js';
import socialAccountRoutes from './app/routes/socialAccountRoutes.js';
import socialPostRoutes from './app/routes/socialPostRoutes.js';
import whatsappRoutes from './app/routes/whatsappRoutes.js';
import callRoutes from './app/routes/callRoutes.js';
import whatsappSimRoutes from './app/routes/whatsappSimRoutes.js';
import cron from 'node-cron';
import { runMonthEndContractorBatch } from './app/services/invoiceBatchService.js';

// Load environment variables from Configs/.env (repo root), falling back to API/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Configs/.env') });
dotenv.config();

const app = express();
// Render (and most PaaS hosts) assign the port via PORT and require the app
// to bind to it — API_PORT stays as the local-dev override.
const PORT = process.env.PORT || process.env.API_PORT || 5000;
const HOST = process.env.API_HOST || '0.0.0.0';

// Behind Render's (or any) reverse proxy, TLS terminates at the edge — the
// app itself only ever sees plain HTTP. Without this, req.protocol always
// reports "http", which breaks the Facebook OAuth callback URL we build
// dynamically in socialAccountRoutes.js (Meta requires an exact https match).
app.set('trust proxy', 1);

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
// Database Connection (Placeholder)
// ============================================================

console.log('📊 Database Configuration:');
console.log(`   URL: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Supabase: ${process.env.SUPABASE_PROJECT_URL ? '✅ Configured' : '❌ Missing'}`);

// ============================================================
// Routes
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Social Media Automation API',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API Routes
// ============================================================

// Authentication
app.use('/api/auth', authRoutes);

// Clients (businesses) — multi-client support
app.use('/api/clients', clientRoutes);

// Customers (CRM) — Blueprint Phase 3
app.use('/api/customers', customerRoutes);

// Repair Jobs workflow
app.use('/api/jobs', jobRoutes);

// Quotations/Pricing
app.use('/api/quotations', quotationRoutes);

// Invoices/Billing
app.use('/api/invoices', invoiceRoutes);

// Inspection Reports
app.use('/api/inspections', inspectionRoutes);

// Technicians
app.use('/api/technicians', technicianRoutes);

// Social Media Accounts — Phase 2
app.use('/api/social-accounts', socialAccountRoutes);

// Social Media Posts — Phase 2
app.use('/api/posts', socialPostRoutes);

// WhatsApp technician bot — no auth middleware, Meta calls these directly
app.use('/api/whatsapp', whatsappRoutes);

// Call log
app.use('/api/calls', callRoutes);

// WhatsApp simulator — drives the real webhook with real Meta-shaped payloads
app.use('/api/whatsapp-sim', whatsappSimRoutes);

// Placeholder routes for future implementation
app.get('/api/analytics/dashboard', (req, res) => {
  res.status(501).json({ message: 'Dashboard analytics not implemented yet' });
});

app.post('/api/ai/generate-caption', (req, res) => {
  res.status(501).json({ message: 'Caption generation not implemented yet' });
});

// ============================================================
// Error Handling
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
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
  console.log('\n📚 Available Endpoints:');
  console.log('   ✓ GET  /api/health              - Health check');
  console.log('   ✓ GET  /api/version             - API version');
  console.log('   ✓ GET  /api/clients             - List clients (businesses)');
  console.log('   ✓ POST /api/clients             - Create client');
  console.log('   ✓ GET  /api/clients/:id         - Get client');
  console.log('   ✓ PUT  /api/clients/:id         - Update client');
  console.log('   ✓ DELETE /api/clients/:id       - Delete client');
  console.log('   ✓ GET  /api/clients/:id/stats   - Client stats');
  console.log('   ✓ GET  /api/customers           - List customers (CRM)');
  console.log('   ✓ POST /api/customers           - Create customer');
  console.log('   ✓ GET  /api/customers/:id       - Get customer');
  console.log('   ✓ PUT  /api/customers/:id       - Update customer');
  console.log('   ✓ DELETE /api/customers/:id     - Delete customer');
  console.log('   ✓ POST /api/customers/bulk      - Bulk import customers');
  console.log('   ✓ GET  /api/jobs                - List repair jobs');
  console.log('   ✓ POST /api/jobs                - Create job');
  console.log('   ✓ GET  /api/quotations          - List quotations');
  console.log('   ✓ POST /api/quotations          - Create quotation');
  console.log('   ✓ GET  /api/invoices            - List invoices');
  console.log('   ✓ POST /api/invoices            - Create invoice');
  console.log('   ✓ GET  /api/technicians         - List technicians');
  console.log('   ✓ POST /api/technicians         - Add technician');
  console.log('   ✓ GET  /api/social-accounts     - List social accounts');
  console.log('   ✓ POST /api/social-accounts     - Connect social account');
  console.log('   ✓ GET  /api/posts               - List social posts');
  console.log('   ✓ POST /api/posts               - Create post');
  console.log('   ✓ POST /api/posts/:id/publish   - Publish post');
  console.log('   ✓ POST /api/posts/:id/schedule  - Schedule post');
  console.log('   ✓ GET  /api/whatsapp/webhook    - Meta verification handshake');
  console.log('   ✓ POST /api/whatsapp/webhook    - Inbound WhatsApp messages');
  console.log('   ✓ GET  /api/calls               - List call log');
  console.log('   ✓ POST /api/calls               - Log a call');
  console.log('   → /api/accounts, /api/analytics, /api/ai (coming soon)\n');
  console.log('📖 Docs: http://localhost:5000/api/docs');
  console.log('🔗 Frontend: http://localhost:3000\n');

  // Daily check for contractor invoices due to go out (last 3 days of month).
  cron.schedule('0 9 * * *', async () => {
    try {
      const result = await runMonthEndContractorBatch(new Date());
      if (result.ran) console.log(`[InvoiceBatch] sent ${result.sent}/${result.total} contractor invoices`);
    } catch (err) {
      console.error('[InvoiceBatch] daily run failed:', err.message);
    }
  });
});

export default app;
