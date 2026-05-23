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

// Verifica si el dominio del correo tiene institución activa
async function validateInstitutionDomain(email: string): Promise<{ valid: boolean; institutionId?: string }> {
  const domain = email.split('@')[1];
  if (!domain) return { valid: false };

  const supabase = getSupabase();
  const { data } = await supabase
    .from('institutions')
    .select('id')
    .eq('domain', domain)
    .eq('active', true)
    .single();

  if (!data) return { valid: false };
  return { valid: true, institutionId: data.id as string };
}

// POST /api/auth/register — registro con correo institucional
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name } = req.body as { email?: string; password?: string; full_name?: string };

  if (!email || !password || !full_name) {
    const body: ApiResponse = { success: false, error: { code: 'MISSING_FIELDS', message: 'Correo, contraseña y nombre son requeridos' } };
    res.status(400).json(body);
    return;
  }

  const { valid, institutionId } = await validateInstitutionDomain(email);
  if (!valid) {
    const body: ApiResponse = {
      success: false,
      error: { code: 'DOMAIN_NOT_ALLOWED', message: 'Tu institución aún no está registrada. Solicita la integración.' },
    };
    res.status(403).json(body);
    return;
  }

  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (authError || !authData.user) {
    const body: ApiResponse = { success: false, error: { code: 'AUTH_ERROR', message: authError?.message ?? 'Error al crear usuario' } };
    res.status(400).json(body);
    return;
  }

  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    institution_id: institutionId,
    full_name,
  });

  if (profileError) {
    const body: ApiResponse = { success: false, error: { code: 'PROFILE_ERROR', message: 'Error al crear perfil' } };
    res.status(500).json(body);
    return;
  }

  const body: ApiResponse<{ userId: string }> = { success: true, data: { userId: authData.user.id } };
  res.status(201).json(body);
});

// POST /api/auth/login — login con Supabase (el cliente maneja tokens directamente)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    const body: ApiResponse = { success: false, error: { code: 'MISSING_FIELDS', message: 'Correo y contraseña son requeridos' } };
    res.status(400).json(body);
    return;
  }

  const supabase = createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    const body: ApiResponse = { success: false, error: { code: 'LOGIN_FAILED', message: 'Correo o contraseña incorrectos' } };
    res.status(401).json(body);
    return;
  }

  const body: ApiResponse<{ access_token: string; user_id: string }> = {
    success: true,
    data: { access_token: data.session.access_token, user_id: data.user.id },
  };
  res.json(body);
});

export default router;
