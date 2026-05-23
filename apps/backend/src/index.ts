import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import rachaRoutes from './routes/racha.routes';
import padrinoRoutes from './routes/padrino.routes';
import scoreRoutes from './routes/score.routes';

const app = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/rachas', rachaRoutes);
app.use('/api/padrino', padrinoRoutes);
app.use('/api/score', scoreRoutes);

app.listen(PORT, () => {
  console.log(`Verdant backend corriendo en http://localhost:${PORT}`);
});

export default app;
