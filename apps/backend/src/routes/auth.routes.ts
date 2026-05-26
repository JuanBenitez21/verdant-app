import { Router, Request, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

async function validateInstitutionDomain(email: string): Promise<{ valid: boolean; institutionId?: string }> {
  const domain = email.split('@')[1];
  if (!domain) return { valid: false };

  const { data } = await getSupabase()
    .from('institutions').select('id').eq('domain', domain).eq('active', true).single();

  if (!data) return { valid: false };
  return { valid: true, institutionId: data.id as string };
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name } = req.body as { email?: string; password?: string; full_name?: string };

  if (!email || !password || !full_name) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Correo, contraseña y nombre son requeridos' } });
    return;
  }

  const { valid, institutionId } = await validateInstitutionDomain(email);
  if (!valid) {
    res.status(403).json({ success: false, error: { code: 'DOMAIN_NOT_ALLOWED', message: 'Tu institución aún no está registrada.' } });
    return;
  }

  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: false,
  });

  if (authError || !authData.user) {
    res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: authError?.message ?? 'Error al crear usuario' } });
    return;
  }

  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id, institution_id: institutionId, full_name,
  });

  if (profileError) {
    res.status(500).json({ success: false, error: { code: 'PROFILE_ERROR', message: 'Error al crear perfil' } });
    return;
  }

  const body: ApiResponse<{ userId: string }> = { success: true, data: { userId: authData.user.id } };
  res.status(201).json(body);
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Correo y contraseña son requeridos' } });
    return;
  }

  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    res.status(401).json({ success: false, error: { code: 'LOGIN_FAILED', message: 'Correo o contraseña incorrectos' } });
    return;
  }

  res.json({ success: true, data: { access_token: data.session.access_token, user_id: data.user.id } });
});

export default router;
