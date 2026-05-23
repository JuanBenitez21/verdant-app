# CLAUDE.md — Verdant App

> Este archivo es el contexto maestro del proyecto. Léelo completo antes de escribir cualquier línea de código. Está ubicado en la raíz del repositorio y aplica a todas las sesiones de Cursor y Claude Code.

---

## 1. Qué es Verdant

Verdant es una aplicación móvil de cesación de nicotina con gamificación, diseñada para jóvenes universitarios y empleados corporativos en Colombia y Latinoamérica.

**Propuesta de valor central:** hacer que el bienestar sea la opción de menor resistencia. Cualquier recurso de apoyo debe ser accesible en menos de 15 segundos desde el momento del impulso de consumo.

**Mecanismo core:** una planta virtual que crece con los días de racha del usuario, validada por un "padrino" (peer accountability), con recompensas institucionales reales desbloqueadas por un Score multicapa.

**Modelo de negocio:** B2B — las empresas e instituciones educativas pagan por la plataforma para sus empleados/estudiantes. El ROI es medible: $2.800 USD/empleado/año ahorrado en ausentismo y productividad.

---

## 2. Stack tecnológico

### Frontend — Mobile
```
React Native + Expo SDK 51+
TypeScript (strict mode)
Expo Router v3 (file-based routing)
NativeWind v4 (Tailwind para React Native)
React Query (TanStack) — server state
Zustand — client state (auth, planta, score)
React Native Reanimated 3 — animaciones
Expo Notifications — push notifications
react-native-health (iOS HealthKit)
react-native-health-connect (Android Health Connect)
```

### Backend
```
Node.js 20 LTS
Express 5
TypeScript
Supabase (PostgreSQL + Auth + Storage + Realtime)
SendGrid — correos transaccionales (invitación padrino, activación)
Firebase Cloud Messaging (FCM) — push notifications
```

### Monorepo
```
pnpm workspaces
apps/mobile      → Expo app
apps/backend     → Express API
packages/shared  → Types TypeScript compartidos
```

### Dev Tools
```
ESLint + Prettier
Husky + lint-staged (pre-commit hooks)
GitHub Actions (CI/CD)
```

---

## 3. Estructura de carpetas

```
verdant-app/
├── CLAUDE.md                    ← este archivo
├── package.json                 ← pnpm workspace root
├── pnpm-workspace.yaml
├── .env.example
│
├── apps/
│   ├── mobile/
│   │   ├── app/                 ← Expo Router (file-based)
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   └── onboarding/
│   │   │   │       ├── habito.tsx
│   │   │   │       ├── planta.tsx
│   │   │   │       └── padrino.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx        ← Dashboard principal
│   │   │   │   ├── juegos.tsx
│   │   │   │   ├── logros.tsx
│   │   │   │   └── recursos.tsx
│   │   │   ├── padrino/
│   │   │   │   └── confirmar/[token].tsx  ← vista pública sin login
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── planta/
│   │   │   │   ├── PlantaVisual.tsx
│   │   │   │   ├── PlantaRoadmap.tsx
│   │   │   │   └── PlantaAnimada.tsx
│   │   │   ├── score/
│   │   │   │   ├── ScoreBar.tsx
│   │   │   │   └── ScoreDesglose.tsx
│   │   │   ├── rewards/
│   │   │   │   └── RewardCard.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── BottomSheet.tsx
│   │   │   └── funfact/
│   │   │       └── FunFactSheet.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePlanta.ts
│   │   │   ├── useRacha.ts
│   │   │   ├── useScore.ts
│   │   │   └── useWearable.ts
│   │   ├── services/
│   │   │   ├── supabase.ts
│   │   │   ├── racha.service.ts
│   │   │   ├── score.service.ts
│   │   │   └── wearable.service.ts
│   │   ├── store/
│   │   │   ├── auth.store.ts
│   │   │   └── planta.store.ts
│   │   ├── constants/
│   │   │   ├── colors.ts        ← tokens de color (ver sección 5)
│   │   │   ├── plants.ts        ← config de las 4 plantas
│   │   │   └── funfacts.ts      ← facts por hito de días
│   │   └── utils/
│   │       ├── ahorro.ts        ← cálculo dinero/días/cigarrillos
│   │       └── score.ts         ← lógica del Score Verdant
│   │
│   └── backend/
│       └── src/
│           ├── routes/
│           │   ├── auth.routes.ts
│           │   ├── racha.routes.ts
│           │   ├── padrino.routes.ts
│           │   ├── score.routes.ts
│           │   └── admin.routes.ts
│           ├── services/
│           │   ├── racha.service.ts
│           │   ├── score.service.ts
│           │   ├── email.service.ts
│           │   └── notification.service.ts
│           ├── middleware/
│           │   ├── auth.middleware.ts
│           │   └── institution.middleware.ts
│           └── db/
│               └── schema.sql
│
└── packages/
    └── shared/
        └── src/
            ├── types/
            │   ├── user.types.ts
            │   ├── racha.types.ts
            │   ├── score.types.ts
            │   └── planta.types.ts
            └── constants/
                └── score.constants.ts
```

---

## 4. Base de datos — esquema PostgreSQL (Supabase)

```sql
-- Instituciones habilitadas
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,  -- ej: unisabana.edu.co
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  institution_id UUID REFERENCES institutions(id),
  full_name TEXT NOT NULL,
  -- Perfil de hábito
  cigarettes_per_day INT DEFAULT 10,
  years_smoking NUMERIC(4,1) DEFAULT 1,
  price_per_pack INT DEFAULT 9000,  -- COP
  -- Planta
  plant_type TEXT DEFAULT 'sakura',  -- sakura | clasico | orquidea | cactus
  plant_name TEXT DEFAULT 'Mi planta',
  -- Padrino
  godparent_id UUID REFERENCES users(id),
  godparent_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rachas diarias
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  self_reported BOOLEAN DEFAULT false,
  godparent_confirmed BOOLEAN DEFAULT false,
  godparent_confirmed_at TIMESTAMPTZ,
  relapse BOOLEAN DEFAULT false,
  score_snapshot INT,  -- score calculado ese día
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Logros desbloqueados
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  achievement_key TEXT NOT NULL,  -- 'day_1' | 'day_7' | 'day_30' | etc.
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_key)
);

-- Links de padrino (tokens únicos por día)
CREATE TABLE godparent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streak_id UUID REFERENCES streaks(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,  -- medianoche del mismo día
  used BOOLEAN DEFAULT false,
  friction_answer TEXT  -- respuesta a la pregunta de fricción
);

-- Score Verdant por usuario (calculado nightly)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  -- Componentes del score
  wearable_hr_pts INT DEFAULT 0,       -- max 20
  wearable_steps_pts INT DEFAULT 0,    -- max 15
  wearable_sleep_pts INT DEFAULT 0,    -- max 15
  godparent_pts INT DEFAULT 0,         -- max 25
  self_report_pts INT DEFAULT 0,       -- max 15
  coherence_pts INT DEFAULT 0,         -- max 10
  total_score INT GENERATED ALWAYS AS (
    wearable_hr_pts + wearable_steps_pts + wearable_sleep_pts +
    godparent_pts + self_report_pts + coherence_pts
  ) STORED,
  incoherence_flag BOOLEAN DEFAULT false,
  UNIQUE(user_id, date)
);
```

---

## 5. Sistema de diseño — colores

**Paleta principal (usar siempre desde `constants/colors.ts`):**

```typescript
// constants/colors.ts
export const Colors = {
  // Verdes — identidad de marca
  green900: '#0d2618',   // fondo oscuro principal
  green800: '#163d26',   // fondo oscuro secundario
  green700: '#1e5435',   // superficies oscuras
  green600: '#276945',   // bordes activos
  green500: '#2d7a4f',   // verde principal
  green400: '#3d9e67',   // botones primarios
  green300: '#5ec287',   // acentos, streaks activos
  green200: '#9eddb9',   // texto sobre fondo oscuro
  green100: '#cff0df',   // texto secundario sobre oscuro
  green50:  '#eaf7f1',   // fondos claros, logros earned

  // Neutros cálidos
  cream:    '#f5f2eb',   // fondo claro principal (onboarding, logros)
  warm:     '#ede8de',   // bordes claros, fondos secundarios

  // Texto sobre fondo claro
  textDark: '#0d1f15',   // títulos
  textMid:  '#3a5245',   // cuerpo
  textSoft: '#7a9a87',   // subtextos, labels

  // Semánticos
  amber:      '#d4820a', // rewards intermedio, alertas
  amberLight: '#fdf0d5',
  rose:       '#c4446a', // recaídas, alertas críticas
  roseLight:  '#fce8ef',

  // Siempre
  white: '#ffffff',
} as const;

// Modo claro/oscuro por pantalla
export const ScreenTheme = {
  dark: {  // Login, Dashboard, Juegos
    bg: Colors.green900,
    bgSecondary: Colors.green800,
    surface: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.10)',
    textPrimary: Colors.white,
    textSecondary: Colors.green200,
    textTertiary: Colors.green100,
  },
  light: {  // Onboarding, Logros, Recursos
    bg: Colors.cream,
    bgSecondary: Colors.warm,
    surface: Colors.white,
    border: Colors.warm,
    textPrimary: Colors.textDark,
    textSecondary: Colors.textMid,
    textTertiary: Colors.textSoft,
  },
} as const;
```

---

## 6. Tipografía

```typescript
// Fuentes (cargar con expo-google-fonts)
// @expo-google-fonts/dm-serif-display
// @expo-google-fonts/dm-sans

export const Typography = {
  // Display — solo para logo, títulos de pantalla
  displayLarge: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 36,
    lineHeight: 40,
  },
  displayMedium: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
  },
  displaySmall: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    lineHeight: 28,
  },

  // Body — todo el resto de la UI
  bodyLarge: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },

  // Labels — buttons, caps, badges
  labelLarge: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontFamily: 'DMSans_300Light',
    fontSize: 11,
    lineHeight: 16,
  },
} as const;
```

---

## 7. Componentes UI — reglas de diseño

### Border radius
```typescript
export const Radius = {
  sm:  12,   // inputs, pills pequeñas
  md:  18,   // cards internas, botones
  lg:  24,   // cards principales
  xl:  32,   // bottom sheets, modales
  full: 999, // avatares, badges redondas
} as const;
```

### Spacing (múltiplos de 4)
```typescript
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;
```

### Botones — jerarquía

| Variante | Uso | Estilo |
|---|---|---|
| `primary` | Acción principal (Reportar, Confirmar) | `bg: green400`, `text: white`, `radius: md` |
| `primaryDark` | Sobre fondo claro (Plantar semilla) | `bg: green800`, `text: white` |
| `ghost` | Acciones secundarias | `bg: transparent`, `border: green600`, `text: green300` |
| `danger` | Recaída, Dudar | `bg: transparent`, `border: roseLight`, `text: rose` |
| `google` | OAuth | `bg: rgba(255,255,255,0.06)`, `border: rgba(255,255,255,0.12)` |

### Principios de diseño (NO negociar)

1. **Fricción mínima:** cualquier acción crítica en ≤ 3 toques desde pantalla principal
2. **Recompensa inmediata:** cada acción positiva dispara feedback visual/sonoro al instante
3. **Empatía sin juicio:** mensajes de recaída usan lenguaje de apoyo, nunca culpa
4. **La planta es el hero:** siempre el elemento más prominente visualmente en el dashboard
5. **Bordes redondeados siempre:** nunca ángulos agudos en la UI — transmiten seguridad

---

## 8. La planta — configuración y etapas

```typescript
// constants/plants.ts

export type PlantType = 'sakura' | 'clasico' | 'orquidea' | 'cactus';

export const PLANT_STAGES = [
  { key: 'semilla',   day: 1,   emoji: '🌰', label: 'Semilla plantada',   nextDays: 2 },
  { key: 'brote',     day: 3,   emoji: '🌱', label: 'Brote',              nextDays: 4 },
  { key: 'plantula',  day: 7,   emoji: '🌿', label: 'Plántula',           nextDays: 8 },
  { key: 'joven',     day: 15,  emoji: '🪴', label: 'Bonsai joven',       nextDays: 15 },
  { key: 'flor',      day: 30,  emoji: '🌸', label: 'Primera flor',       nextDays: 30 },
  { key: 'plena',     day: 60,  emoji: '🌺', label: 'Plena floración',    nextDays: null },
] as const;

export const PLANTS: Record<PlantType, {
  name: string;
  description: string;
  tag: string;
  tagColor: string;
  bloomDay: number;
}> = {
  sakura:   { name: 'Bonsai Sakura',  description: 'Delicado y poderoso. Florece al día 30.', tag: 'Favorito',   tagColor: '#fce8ef', bloomDay: 30 },
  clasico:  { name: 'Bonsai clásico', description: 'Sabiduría y paciencia. Crece fuerte.',    tag: 'Zen',        tagColor: '#eaf7f1', bloomDay: 45 },
  orquidea: { name: 'Orquídea',       description: 'Elegante y exótica. Florece en día 21.',  tag: 'Exótica',    tagColor: '#f0e8ff', bloomDay: 21 },
  cactus:   { name: 'Cactus',         description: 'Resiliente. Sobrevive todo con poco.',    tag: 'Resistente', tagColor: '#fdf0d5', bloomDay: 60 },
};

// Obtener etapa actual según días de racha
export function getPlantStage(streakDays: number) {
  const stages = [...PLANT_STAGES].reverse();
  return stages.find(s => streakDays >= s.day) ?? PLANT_STAGES[0];
}
```

---

## 9. Score Verdant — lógica de cálculo

```typescript
// packages/shared/src/constants/score.constants.ts

export const SCORE_WEIGHTS = {
  wearable: {
    heartRate: 20,  // FC en reposo mejorando
    steps:     15,  // pasos diarios
    sleep:     15,  // calidad del sueño
  },
  godparent:   25,  // aprobación manual del padrino
  selfReport:  15,  // auto-reporte de días sin fumar
  coherence:   10,  // coherencia entre wearable y auto-reporte
} as const;

export const SCORE_LEVELS = [
  { min: 0,  max: 39, level: 'none',         label: 'Sin nivel',        reward: null },
  { min: 40, max: 64, level: 'basic',        label: 'Nivel básico',     reward: 'Café gratuito' },
  { min: 65, max: 84, level: 'intermediate', label: 'Nivel intermedio', reward: 'Almuerzo' },
  { min: 85, max: 100,level: 'premium',      label: 'Nivel premium',    reward: 'Día libre / Bono' },
] as const;

export const INCOHERENCE_THRESHOLD = 35; // puntos de diferencia para generar alerta

// utils/score.ts
export function getScoreLevel(score: number) {
  return SCORE_LEVELS.find(l => score >= l.min && score <= l.max) ?? SCORE_LEVELS[0];
}
```

---

## 10. Épicas y requerimientos funcionales (MVP)

### Épica 1 — Onboarding (Must Have)
- `RF-01` Registro con correo institucional + validación de dominio
- `RF-02` Perfil de hábito (cigarrillos/día, años fumando, precio paquete)
- `RF-03` Selección y nombre de la planta
- `RF-04` Invitación y vinculación del padrino

### Épica 2 — Gamificación (Must Have)
- `RF-05` Reporte de "Día Limpio" (una vez cada 24h)
- `RF-06` Animación de crecimiento de la planta al reportar
- `RF-07` Dashboard con días/ahorro COP/cigarrillos evitados
- `RF-08` Score Verdant visible en dashboard
- `RF-09` Fun Facts contextuales por hito de días
- `RF-10` Gestión de recaídas con mensaje empático

### Épica 3 — Anti-trampa (Must Have)
- `RF-11` Email al padrino con link único que expira a medianoche
- `RF-12` Pregunta de fricción antes de confirmar
- `RF-13` Día no se cuenta sin confirmación del padrino
- `RF-14` Alerta al admin si diferencia score > 35 pts

### Épica 4 — Logros (Must Have)
- `RF-15` Hitos: día 1, 3, 7, 15, 30, 60, 100
- `RF-16` Logros no se pierden con recaída
- `RF-17` QR/código de canje con expiración

### Épica 5 — Comunidad + Educación (Should Have)
- `RF-18` Muro de logros institucional
- `RF-19` Biblioteca: artículos, videos, fun facts
- `RF-20` Invitación de amigos con reward

### Épica 6 — Panel de Admin (Should Have)
- `RF-21` Dashboard institucional con 5 métricas clave
- `RF-22` Score Verdant agregado de la institución
- `RF-23` ROI estimado en COP
- `RF-24` Alertas de incoherencia pendientes

---

## 11. Requerimientos no funcionales

| ID | Requisito | Valor |
|---|---|---|
| RNF-01 | Tiempo máximo para "Reportar Día Limpio" | ≤ 15 segundos desde que abre la app |
| RNF-02 | Tiempo de respuesta del servidor | ≤ 3 segundos por acción |
| RNF-03 | Disponibilidad | 99% en ventana 6am–10pm |
| RNF-04 | Seguridad | Contraseñas hasheadas, tokens firmados JWT |
| RNF-05 | Escalabilidad | Multi-institución sin rediseño estructural |
| RNF-06 | Accesibilidad | Responsive, funcional en iOS y Android |
| RNF-07 | Mantenibilidad | Separación de responsabilidades estricta |

---

## 12. Flujos críticos de negocio

### Flujo 1: Reporte diario y validación del padrino
```
Usuario toca "Reportar Día Limpio"
  → POST /api/rachas/daily { userId, date }
  → Backend crea registro en streaks (self_reported: true)
  → Backend genera token único en godparent_tokens (expira medianoche)
  → Backend envía email al padrino con link /padrino/confirmar/{token}
  → Padrino abre link (sin cuenta) → responde pregunta de fricción
  → PATCH /api/padrino/confirmar/{token} { frictionAnswer }
  → Backend marca streak (godparent_confirmed: true)
  → Si se activa hito → genera logro + notificación push al usuario
  → Si no confirma antes de medianoche → día no suma a la racha
```

### Flujo 2: Cálculo del Score Verdant
```
Job nocturno (cron 23:30)
  → Para cada usuario activo:
    1. Leer datos wearable del día (simulados en POC)
    2. Verificar confirmación del padrino
    3. Verificar auto-reporte
    4. Calcular coherencia entre wearable y auto-reporte
    5. Si diferencia > 35 pts → incoherence_flag = true → notificar admin
    6. INSERT en scores con todos los componentes
```

### Flujo 3: Onboarding
```
Registro con correo institucional
  → Validar dominio contra tabla institutions
  → Si dominio no existe → error con link "solicitar integración"
  → Email de activación (expira 24h)
  → Activar cuenta → completar perfil de hábito (paso 2)
  → Seleccionar planta y nombre (paso 3)
  → Invitar padrino por correo (paso 4)
  → Redirigir a Dashboard
```

---

## 13. Variables de entorno requeridas

```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3001

# apps/backend/.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SENDGRID_API_KEY=
FCM_SERVER_KEY=
JWT_SECRET=
PORT=3001
NODE_ENV=development
```

---

## 14. Convenciones de código

### Naming
```typescript
// Componentes: PascalCase
PlantaVisual.tsx
ScoreBar.tsx

// Hooks: camelCase con prefijo use
useRacha.ts
useScore.ts

// Servicios: camelCase con sufijo .service
racha.service.ts

// Tipos: PascalCase con sufijo Type o interfaz sin sufijo
type PlantType = ...
interface User { ... }

// Constantes: SCREAMING_SNAKE_CASE
SCORE_WEIGHTS
PLANT_STAGES
```

### Estructura de un componente React Native
```typescript
// Siempre en este orden:
// 1. Imports
// 2. Types/interfaces del componente
// 3. Constantes locales
// 4. Componente (función)
// 5. Estilos (StyleSheet.create al final)

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants';

interface PlantaCardProps {
  nombre: string;
  diasRacha: number;
  onPress?: () => void;
}

export function PlantaCard({ nombre, diasRacha, onPress }: PlantaCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Text style={styles.nombre}>{nombre}</Text>
      <Text style={styles.dias}>{diasRacha} días</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  nombre: {
    ...Typography.displaySmall,
    color: Colors.white,
  },
  dias: {
    ...Typography.bodyMedium,
    color: Colors.green200,
  },
});
```

### API responses — formato estándar
```typescript
// Siempre responder con esta estructura:
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 15. Sprint actual — qué estamos construyendo

**Sprint 1 — Setup + Auth + Navegación base**

Objetivos de este sprint:
- [ ] Monorepo inicializado con pnpm workspaces
- [ ] Expo app con TypeScript + Expo Router + NativeWind
- [ ] Supabase conectado (auth + db schema creado)
- [ ] Pantalla Login funcional con validación de correo institucional
- [ ] Pantalla Registro (paso 1 de 4) conectada a Supabase Auth
- [ ] Navegación base: (auth) → (tabs)
- [ ] Variables de entorno configuradas

**Cuando termines una tarea, márcala con [x] y avanza a la siguiente.**

---

## 16. Instrucciones para Claude

- Antes de crear un archivo, verifica si ya existe en la estructura de carpetas de la sección 3.
- Usa siempre TypeScript strict. No usar `any`.
- Los colores vienen exclusivamente de `constants/colors.ts`. Nunca hardcodear hex en componentes.
- Cada componente nuevo debe tener su archivo de tipos si tiene más de 2 props.
- Al crear una pantalla nueva, verifica que el flujo de negocio correspondiente esté en la sección 12.
- Los textos de la UI siempre en español colombiano.
- Al terminar una función, escribe un comentario de una línea explicando qué hace.
- Nunca crear `useEffect` para lógica que puede ir en un event handler.
- Cuando generes código de backend, incluye siempre el manejo de errores.
- Si una tarea requiere una variable de entorno nueva, agrégala a `.env.example` y documéntala en la sección 13.
