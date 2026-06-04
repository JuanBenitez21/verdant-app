-- ============================================================
-- Verdant — Sprint 4 SQL completo
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- 1. Columnas faltantes en users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS price_per_pack INT DEFAULT 9000;

-- 2. Tabla community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  post_type TEXT NOT NULL DEFAULT 'achievement',
  content TEXT NOT NULL,
  emoji TEXT DEFAULT '🌿',
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla community_likes
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 4. RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts_read"   ON community_posts;
DROP POLICY IF EXISTS "community_posts_insert" ON community_posts;
DROP POLICY IF EXISTS "community_likes_own"    ON community_likes;
DROP POLICY IF EXISTS "community_likes_read"   ON community_likes;
DROP POLICY IF EXISTS "institutions_read"      ON institutions;

CREATE POLICY "community_posts_read"   ON community_posts FOR SELECT USING (true);
CREATE POLICY "community_posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_likes_own"    ON community_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "community_likes_read"   ON community_likes FOR SELECT USING (true);
CREATE POLICY "institutions_read"      ON institutions FOR SELECT USING (active = true);

-- 5. Política admin para leer usuarios de su institución
DROP POLICY IF EXISTS "users_own" ON users;
DROP POLICY IF EXISTS "admins_read_institution_users" ON users;
CREATE POLICY "admins_read_institution_users" ON users FOR SELECT
  USING (
    auth.uid() = id
    OR godparent_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.uid() IN (
      SELECT id FROM users u2 WHERE u2.role = 'admin' AND u2.institution_id = users.institution_id
    )
  );

-- 6. Política para insertar godparent_tokens desde el cliente
DROP POLICY IF EXISTS "godparent_tokens_insert_own" ON godparent_tokens;
CREATE POLICY "godparent_tokens_insert_own" ON godparent_tokens FOR INSERT
  WITH CHECK (streak_id IN (SELECT id FROM streaks WHERE user_id = auth.uid()));

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_streaks_user_date        ON streaks(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_user_date         ON scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_inst     ON community_posts(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_godparent_tokens_streak  ON godparent_tokens(streak_id);

-- ============================================================
-- FUNCIONES RPC (fallback cuando el backend local no está disponible)
-- ============================================================

-- Función: reportar día limpio directamente desde el cliente
CREATE OR REPLACE FUNCTION report_daily_day(p_date DATE, p_token TEXT, p_expires_at TIMESTAMPTZ)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_str  streaks%ROWTYPE;
  v_days INT;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Sin sesión'); END IF;
  SELECT * INTO v_str FROM streaks WHERE user_id = v_uid AND date = p_date;
  IF FOUND THEN RETURN jsonb_build_object('success', false, 'code', 'ALREADY_REPORTED', 'error', 'Ya reportaste hoy'); END IF;
  INSERT INTO streaks (user_id, date, self_reported, relapse) VALUES (v_uid, p_date, true, false) RETURNING * INTO v_str;
  INSERT INTO godparent_tokens (streak_id, token, expires_at) VALUES (v_str.id, p_token, p_expires_at);
  SELECT COUNT(*) INTO v_days FROM streaks WHERE user_id = v_uid AND godparent_confirmed = true AND relapse = false;
  RETURN jsonb_build_object('success', true, 'streakId', v_str.id, 'daysCount', v_days + 1, 'token', p_token);
END; $$;
GRANT EXECUTE ON FUNCTION report_daily_day(DATE, TEXT, TIMESTAMPTZ) TO authenticated;

-- Función: obtener info del token para el padrino (sin autenticación)
CREATE OR REPLACE FUNCTION get_godparent_token_info(p_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tok  godparent_tokens%ROWTYPE;
  v_str  streaks%ROWTYPE;
  v_usr  users%ROWTYPE;
  v_days INT;
BEGIN
  SELECT * INTO v_tok FROM godparent_tokens WHERE token = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Enlace no válido'); END IF;
  IF v_tok.expires_at < now() THEN RETURN jsonb_build_object('success', false, 'error', 'Este enlace expiró'); END IF;
  IF v_tok.used THEN RETURN jsonb_build_object('success', false, 'error', 'Este enlace ya fue usado'); END IF;
  SELECT * INTO v_str FROM streaks WHERE id = v_tok.streak_id;
  SELECT * INTO v_usr FROM users   WHERE id = v_str.user_id;
  SELECT COUNT(*) INTO v_days FROM streaks WHERE user_id = v_str.user_id AND godparent_confirmed = true AND relapse = false;
  RETURN jsonb_build_object(
    'success', true, 'userName', v_usr.full_name, 'plantName', v_usr.plant_name,
    'plantType', v_usr.plant_type, 'daysCount', v_days + 1,
    'frictionOptions', jsonb_build_array(
      '✅ Estuve con él/ella y no fumó en todo el día',
      '💬 No estuve, pero me confirmó por mensaje',
      '🤔 No tengo certeza hoy'
    )
  );
END; $$;
GRANT EXECUTE ON FUNCTION get_godparent_token_info(TEXT) TO anon, authenticated;

-- Función: confirmar día del padrino (sin autenticación)
CREATE OR REPLACE FUNCTION confirm_godparent_day(p_token TEXT, p_friction_answer TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tok  godparent_tokens%ROWTYPE;
  v_str  streaks%ROWTYPE;
  v_usr  users%ROWTYPE;
  v_days INT;
  v_ach  TEXT := NULL;
  v_ms   INT[] := ARRAY[1,3,7,15,30,60,100];
  v_m    INT;
BEGIN
  SELECT * INTO v_tok FROM godparent_tokens WHERE token = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Enlace no válido'); END IF;
  IF v_tok.used    THEN RETURN jsonb_build_object('success', false, 'error', 'Este enlace ya fue usado'); END IF;
  IF v_tok.expires_at < now() THEN RETURN jsonb_build_object('success', false, 'error', 'El enlace expiró a medianoche'); END IF;
  UPDATE godparent_tokens SET used = true, friction_answer = p_friction_answer WHERE token = p_token;
  IF p_friction_answer = '🤔 No tengo certeza hoy' THEN
    RETURN jsonb_build_object('success', true, 'confirmed', false, 'message', 'Gracias por tu honestidad');
  END IF;
  SELECT * INTO v_str FROM streaks WHERE id = v_tok.streak_id;
  SELECT * INTO v_usr FROM users   WHERE id = v_str.user_id;
  UPDATE streaks SET godparent_confirmed = true, godparent_confirmed_at = now() WHERE id = v_str.id;
  SELECT COUNT(*) INTO v_days FROM streaks WHERE user_id = v_str.user_id AND godparent_confirmed = true AND relapse = false;
  FOREACH v_m IN ARRAY v_ms LOOP
    IF v_days = v_m THEN
      INSERT INTO achievements (user_id, achievement_key) VALUES (v_str.user_id, 'day_' || v_m) ON CONFLICT DO NOTHING;
      IF FOUND THEN
        v_ach := 'day_' || v_m;
        INSERT INTO community_posts (user_id, institution_id, post_type, content, emoji, likes_count)
        VALUES (v_str.user_id, v_usr.institution_id, 'achievement',
          '🏆 ' || v_usr.full_name || ' acaba de completar ' || v_m || CASE WHEN v_m = 1 THEN ' día' ELSE ' días' END || ' sin fumar',
          CASE v_m WHEN 1 THEN '🌱' WHEN 3 THEN '🌿' WHEN 7 THEN '💪' WHEN 15 THEN '🌬️' WHEN 30 THEN '🌸' WHEN 60 THEN '❤️' ELSE '👑' END, 0);
      END IF;
      EXIT;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'confirmed', true, 'daysCount', v_days, 'newAchievement', v_ach);
END; $$;
GRANT EXECUTE ON FUNCTION confirm_godparent_day(TEXT, TEXT) TO anon, authenticated;

-- Función: confirmaciones pendientes del padrino actual
CREATE OR REPLACE FUNCTION get_my_pending_confirmations()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
  v_today DATE := CURRENT_DATE;
  v_res   JSONB;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN '[]'::JSONB; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'token',     gt.token,
    'userName',  u.full_name,
    'plantName', u.plant_name,
    'plantType', u.plant_type,
    'daysCount', (SELECT COUNT(*) + 1 FROM streaks s2 WHERE s2.user_id = u.id AND s2.godparent_confirmed = true AND s2.relapse = false)
  )), '[]'::JSONB) INTO v_res
  FROM users u
  JOIN streaks s ON s.user_id = u.id AND s.date = v_today AND s.self_reported = true AND s.godparent_confirmed = false AND s.relapse = false
  JOIN godparent_tokens gt ON gt.streak_id = s.id AND NOT gt.used AND gt.expires_at > now()
  WHERE u.godparent_email = v_email;
  RETURN v_res;
END; $$;
GRANT EXECUTE ON FUNCTION get_my_pending_confirmations() TO authenticated;

-- ============================================================
-- Activar Realtime en la tabla streaks (hazlo también desde el Dashboard)
-- ============================================================
-- En Supabase Dashboard → Database → Replication → Activar streaks, achievements, community_posts

-- ============================================================
-- PARCHE: RLS para achievements y streaks
-- Si los logros siempre aparecen bloqueados, ejecuta este bloque
-- ============================================================

-- Permitir que cada usuario lea y gestione sus propios logros
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_own" ON achievements;
CREATE POLICY "achievements_own" ON achievements
  FOR ALL USING (auth.uid() = user_id);

-- Permitir que cada usuario lea sus propias rachas
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "streaks_own" ON streaks;
CREATE POLICY "streaks_own" ON streaks
  FOR ALL USING (auth.uid() = user_id);

-- Permitir al padrino confirmar streaks de sus apadrinados (UPDATE)
DROP POLICY IF EXISTS "streaks_godparent_confirm" ON streaks;
CREATE POLICY "streaks_godparent_confirm" ON streaks
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE godparent_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );
