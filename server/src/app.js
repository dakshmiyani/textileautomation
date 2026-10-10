const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('./config/env');
const logger = require('./config/logger');
const apiV1Router = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Trust proxy if running behind reverse proxy / docker
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://192.168.29.106:5173'];
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id', 'X-Tenant-ID']
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID & Logging Middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/api/v1/health')) {
      logger.info(
        {
          requestId: req.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: duration,
          ip: req.ip
        },
        'HTTP Request'
      );
    }
  });

  next();
});

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Versioned API Routes
app.use('/api/v1', apiV1Router);

// Fallback 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
