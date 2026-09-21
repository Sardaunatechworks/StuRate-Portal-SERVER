import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server) or from localhost / vercel / custom domains
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route - Welcome & Status
app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    system: "Student Rating Teachers' Effectiveness System (SRTES) API",
    version: '1.0.0',
    documentation: '/api',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Health Checks (at both /health and /api/health)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    system: 'Student Rating Teachers Effectiveness System (SRTES)',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Mount main API at both /api and root level for maximum deployment compatibility
app.use('/api', apiRouter);
app.use(apiRouter);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
