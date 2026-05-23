import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '@verdant/shared';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    const body: ApiResponse = { success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } };
    res.status(401).json(body);
    return;
  }

  const token = header.split(' ')[1];
  try {
    const secret = process.env['JWT_SECRET'] ?? '';
    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    const body: ApiResponse = { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } };
    res.status(401).json(body);
  }
}
