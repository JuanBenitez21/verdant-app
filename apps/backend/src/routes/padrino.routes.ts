import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

function getSupabase() {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

// PATCH /api/padrino/confirmar/:token — padrino confirma el día (sin login)
router.patch('/confirmar/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { frictionAnswer } = req.body as { frictionAnswer?: string };

  if (!frictionAnswer?.trim()) {
    const body: ApiResponse = { success: false, error: { code: 'MISSING_ANSWER', message: 'La respuesta de confirmación es requerida' } };
    res.status(400).json(body);
    return;
  }

  const supabase = getSupabase();

  const { data: tokenData } = await supabase
    .from('godparent_tokens')
    .select('*, streaks(*)')
    .eq('token', token)
    .single();

  if (!tokenData) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_NOT_FOUND', message: 'Enlace no válido' } };
    res.status(404).json(body);
    return;
  }

  if (tokenData.used) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_USED', message: 'Este enlace ya fue usado' } };
    res.status(409).json(body);
    return;
  }

  if (new Date(tokenData.expires_at as string) < new Date()) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_EXPIRED', message: 'El enlace expiró a medianoche' } };
    res.status(410).json(body);
    return;
  }

  await supabase
    .from('godparent_tokens')
    .update({ used: true, friction_answer: frictionAnswer })
    .eq('token', token);

  await supabase
    .from('streaks')
    .update({ godparent_confirmed: true, godparent_confirmed_at: new Date().toISOString() })
    .eq('id', (tokenData.streaks as { id: string }).id);

  const body: ApiResponse<{ confirmed: true }> = { success: true, data: { confirmed: true } };
  res.json(body);
});

export default router;
