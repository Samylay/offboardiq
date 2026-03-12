const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const departureRoutes = require('./routes/departures');
const knowledgeRoutes = require('./routes/knowledge');
const interviewRoutes = require('./routes/interviews');
const transferRoutes = require('./routes/transfers');
const analyticsRoutes = require('./routes/analytics');
const orgRoutes = require('./routes/organizations');
const searchRoutes = require('./routes/search');
const flightRiskRoutes = require('./routes/flightRisk');
const webhookRoutes = require('./routes/webhooks');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limit for auth endpoints
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
}));

// Parsing & logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);

// Protected routes
app.use('/api/organizations', authenticate, orgRoutes);
app.use('/api/departures', authenticate, departureRoutes);
app.use('/api/knowledge', authenticate, knowledgeRoutes);
app.use('/api/interviews', authenticate, interviewRoutes);
app.use('/api/transfers', authenticate, transferRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/search', authenticate, searchRoutes);
app.use('/api/flight-risk', authenticate, flightRiskRoutes);

// Error handling
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`OffboardIQ API running on port ${PORT}`);
});

module.exports = app;
