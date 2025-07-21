require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const plaidRoutes = require('./routes/plaid');
const cardRankRoutes = require('./routes/cardrank');
const interestKillerRoutes = require('./routes/interestkiller');
const testRoutes = require('./routes/test');
const insightsRoutes = require('./routes/insights');
const authenticateToken = require('./middleware/authenticateToken');
const Sentry = require('./utils/sentry');

const app = express();

// Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const allowedOrigins = [
  process.env.CORS_ORIGIN, // for production, set in Railway env vars
  'http://localhost:3000', // local web frontend
  'http://192.168.0.50:5000', // local backend (for mobile dev)
  'http://localhost:19006', // Expo Go (React Native dev)
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(Sentry.Handlers.requestHandler());

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/plaid', authenticateToken, plaidRoutes);
app.use('/api/cardrank', authenticateToken, cardRankRoutes);
app.use('/api/interestkiller', authenticateToken, interestKillerRoutes);
app.use('/api/test', testRoutes);
app.use('/api/insights', insightsRoutes);

app.get('/', (req, res) => res.send('Nexus API Running'));

app.use(Sentry.Handlers.errorHandler());

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));