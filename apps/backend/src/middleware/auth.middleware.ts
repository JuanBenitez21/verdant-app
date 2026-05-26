import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../lib/supabase';
import type { ApiResponse } from '@verdant/shared';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    const body: ApiResponse = { success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } };
    res.status(401).json(body);
    return;
  }

  const token = header.split(' ')[1]!;

  getSupabase().auth.getUser(token).then(async ({ data, error }) => {
    if (error || !data.user) {
      const body: ApiResponse = { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } };
      res.status(401).json(body);
      return;
    }
    req.userId = data.user.id;

    // Cargar rol del usuario desde la tabla users
    const { data: profile } = await getSupabase()
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    req.userRole = (profile?.role as string | null) ?? 'user';

    next();
  }).catch(() => {
    const body: ApiResponse = { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } };
    res.status(401).json(body);
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    const body: ApiResponse = { success: false, error: { code: 'FORBIDDEN', message: 'Acceso restringido a administradores' } };
    res.status(403).json(body);
    return;
  }
  next();
}
