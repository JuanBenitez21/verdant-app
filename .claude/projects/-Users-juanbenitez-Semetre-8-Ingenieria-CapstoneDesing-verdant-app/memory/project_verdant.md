---
name: project-verdant
description: Estado del proyecto Verdant — sprints completados, decisiones clave de arquitectura
metadata:
  type: project
---

Monorepo React Native + Express + Supabase para cesación de nicotina.

**Sprint 4 completado (2026-06-03):** Comunidad, logros, confirmación del padrino, score, zona recursos.

**Sprint 5 completado (2026-06-03):**
- SendGrid real con HTML completo, Expo Go deep links (`exp+verdant://`)
- Push notifications con expo-notifications + expo-device; job cron 19:00/23:30 Colombia
- EAS distribución: iOS vía Expo Go (sin App Store), Android APK directo
- Supabase producción: migración 005, seed instituciones reales
- Privacidad (Ley 1581) y Términos pantallas + links en login y perfil
- Winston logger en backend
- Health check con verificación real de DB

**Why:** Capstone de ingeniería — no se sube al App Store (costo $99/año iOS). Estrategia: Expo Go para iOS, APK directo para Android.

**How to apply:** Antes de sprint 6 (piloto), hay que reemplazar `REEMPLAZAR_CON_PROJECT_ID` en app.json con el projectId real de EAS una vez que hagan `eas login` + `eas init`.

**Distribución:**
- `pnpm update:prod` → publica update en Expo Go
- `pnpm build:android` → genera APK

**Supabase prod:** Ejecutar en orden: `sprint4_complete.sql` → `005_sprint5_additions.sql` → `seed-production.sql`
