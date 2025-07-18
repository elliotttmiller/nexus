require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const plaidRoutes = require('./routes/plaid');
const cardRankRoutes = require('./routes/cardrank');
const interestKillerRoutes = require('./routes/interestkiller');
const testRoutes = require('./routes/test');
const authenticateToken = require('./middleware/authenticateToken');
const Sentry = require('./utils/sentry');

const app = express();
app.use(cors());
app.use(express.json());
app.use(Sentry.Handlers.requestHandler());

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/plaid', authenticateToken, plaidRoutes);
app.use('/api/cardrank', authenticateToken, cardRankRoutes);
app.use('/api/interestkiller', authenticateToken, interestKillerRoutes);
app.use('/api/test', testRoutes);

app.get('/', (req, res) => res.send('Nexus API Running'));

app.use(Sentry.Handlers.errorHandler());

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));