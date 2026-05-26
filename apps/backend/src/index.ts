import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import rachaRoutes from './routes/racha.routes';
import padrinoRoutes from './routes/padrino.routes';
import scoreRoutes from './routes/score.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Log de cada request para debugging
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString('es-CO')}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/rachas', rachaRoutes);
app.use('/api/padrino', padrinoRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/admin', adminRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Verdant backend corriendo en:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Red:     http://192.168.20.35:${PORT}`);
  console.log(`  Health:  http://localhost:${PORT}/health`);
});

export default app;
