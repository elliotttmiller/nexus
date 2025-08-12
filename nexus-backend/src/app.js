require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import models first to ensure they're registered with Sequelize
const { sequelize } = require('./models');

// Import routes after models are loaded
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const plaidRoutes = require('./routes/plaid');
const cardRankRoutes = require('./routes/cardrank');
const interestKillerRoutes = require('./routes/interestkiller');
const testRoutes = require('./routes/test');
const insightsRoutes = require('./routes/insights');
const authenticateToken = require('./middleware/authenticateToken');
const Sentry = require('./utils/sentry');
const testCardRankRoutes = require('./routes/testcardrank');

// AdminJS (AdminBro) integration
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const formidableMiddleware = require('express-formidable');
AdminJS.registerAdapter(AdminJSSequelize);

const dbModels = require('./models');
const adminJs = new AdminJS({
  databases: [dbModels.sequelize],
  rootPath: '/adminjs',
  branding: {
    companyName: 'Nexus',
    logo: false,
    softwareBrothers: false,
  },
});
const adminRouter = AdminJSExpress.buildRouter(adminJs);
app.use(adminJs.options.rootPath, formidableMiddleware(), adminRouter);

// Initialize the application
const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Session middleware (for admin login)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexus_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24*60*60*1000 }
}));

app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
}));

app.use(express.json());
app.use(Sentry.Handlers.requestHandler());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/plaid', authenticateToken, plaidRoutes);
app.use('/api/cardrank', authenticateToken, cardRankRoutes);
app.use('/api/interestkiller', authenticateToken, interestKillerRoutes);
app.use('/api/test', testRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/transactions', testCardRankRoutes);
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Nexus Backend is healthy.',
    environment: process.env.NODE_ENV,
    ai_service_url: process.env.AI_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000',
    plaid_env: process.env.PLAID_ENV || 'not set'
  });
});

// Debug endpoint for development/testing
app.get('/debug/config', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Debug endpoint not available in production' });
  }
  
  res.status(200).json({
    environment: process.env.NODE_ENV,
    ai_base_url: process.env.AI_BASE_URL || 'not set',
    api_base_url: process.env.API_BASE_URL || 'not set',
    plaid_env: process.env.PLAID_ENV || 'not set',
    plaid_client_id: process.env.PLAID_CLIENT_ID ? 'set' : 'not set',
    plaid_secret: process.env.PLAID_SECRET ? 'set' : 'not set',
    database_url: process.env.DATABASE_URL ? 'set' : 'not set',
    jwt_secret: process.env.JWT_SECRET ? 'set' : 'not set'
  });
});

// Error handling
app.use(Sentry.Handlers.errorHandler());

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

console.log('App started and running...');
setInterval(() => console.log('Heartbeat: still alive'), 10000);

module.exports = server;