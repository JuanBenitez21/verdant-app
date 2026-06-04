import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

const response429 = {
  success: false,
  error: { code: 'RATE_LIMIT', message: 'Demasiados intentos. Intenta más tarde.' },
};

function getIp(req: Request): string {
  return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? '127.0.0.1');
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json(response429),
});

export const dailyReportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.body as { userId?: string })?.userId ?? getIp(req),
  standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json(response429),
});

export const padrinoConfirmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const t = req.params['token'];
    return (Array.isArray(t) ? t[0] : t) ?? getIp(req);
  },
  standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json(response429),
});
