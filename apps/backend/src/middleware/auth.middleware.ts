import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../lib/supabase';
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

  const token = header.split(' ')[1]!;

  getSupabase().auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      const body: ApiResponse = { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } };
      res.status(401).json(body);
      return;
    }
    req.userId = data.user.id;
    next();
  }).catch(() => {
    const body: ApiResponse = { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } };
    res.status(401).json(body);
  });
}
