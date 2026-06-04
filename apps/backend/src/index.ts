import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import rachaRoutes from './routes/racha.routes';
import padrinoRoutes from './routes/padrino.routes';
import scoreRoutes from './routes/score.routes';
import adminRoutes from './routes/admin.routes';
import { authLimiter } from './middleware/rate-limit.middleware';
import { logger } from './utils/logger';
import { getSupabase } from './lib/supabase';
import './jobs/reminders.job';

const app = express();
const PORT = process.env['PORT'] ?? 3001;
const isDev = process.env['NODE_ENV'] !== 'production';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Demasiados intentos. Intenta más tarde.' },
  }),
});

app.use(helmet({
  hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true },
  contentSecurityPolicy: isDev ? false : undefined,
}));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(generalLimiter);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/health', async (_req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: process.env['NODE_ENV'] ?? 'development',
    services: {
      database: 'unknown' as string,
      email: process.env['SENDGRID_API_KEY'] ? 'configured' : 'dev-mode',
    },
  };

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('institutions').select('count').limit(1);
    checks.services.database = error ? 'error' : 'ok';
  } catch {
    checks.services.database = 'error';
  }

  const hasErrors = Object.values(checks.services).includes('error');
  res.status(hasErrors ? 503 : 200).json(checks);
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rachas', rachaRoutes);
app.use('/api/padrino', padrinoRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/admin', adminRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Verdant backend en http://localhost:${PORT}`);
  logger.info(`Health: http://localhost:${PORT}/health`);
});

export default app;
