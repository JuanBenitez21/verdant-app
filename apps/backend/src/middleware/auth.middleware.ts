import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { ApiResponse } from '@verdant/shared';

export interface AuthRequest extends Request {
  userId?: string;
}

// Verifica el JWT de Supabase usando el API de auth — no requiere JWT_SECRET local
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    const body: ApiResponse = { success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } };
    res.status(401).json(body);
    return;
  }

  const token = header.split(' ')[1]!;
  const supabase = createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );

  supabase.auth.getUser(token).then(({ data, error }) => {
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
