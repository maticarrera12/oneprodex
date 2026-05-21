# OneProdex

Plataforma de predicciones para el **Mundial FIFA 2026**. Los usuarios se unen a grupos privados, completan un flujo de onboarding de 4 pasos (fase de grupos → mejores terceros → bracket → premios), y compiten por puntos en tiempo real.

## Stack

- **Next.js 16** — App Router, Server Actions
- **React 19** — con React Compiler
- **TypeScript** — strict mode
- **Supabase** — Auth (Google + Discord OAuth), PostgreSQL, RLS, Realtime
- **Tailwind CSS 4** — con shadcn/ui y Framer Motion
- **Vitest** — unit tests para lógica pura

## Features

- **Onboarding multi-step** — ranking de 12 grupos, selección de mejores terceros, bracket de 32 equipos, predicciones de premios individuales
- **Bracket builder** — slot resolver puro que mapea picks a los 32 slots del formato FIFA 2026
- **Grupos privados** — los usuarios compiten entre sí dentro de grupos con código de invitación
- **Predicciones de partidos** — resultado, goleadores, portero sin goles recibidos
- **Puntuación automática** — score calculado en base a picks almacenados vs. resultados reales
- **Standings y rankings** — tabla de posiciones por grupo con tendencias
- **Perfil** — historial, estadísticas, logros y progresión de nivel
- **Realtime** — actualizaciones en vivo vía Supabase Realtime

## Arquitectura

```
app/
├── (app)/          # rutas protegidas (bracket, groups, home, matches, onboarding, profile, standings)
├── auth/           # callback OAuth
├── login/          # página pública de ingreso
└── unirse/         # flujo de invitación a grupo

features/
├── auth/
├── bracket/
├── groups/
├── home/
├── matches/
├── onboarding/
├── predictions/
├── profile/
├── rankings/
├── realtime/
├── standings/
└── shared/

lib/
├── supabase/       # clients (browser, server, service)
└── api-football/   # integración con API-Football
```

Cada feature encapsula sus propios componentes, acciones, hooks y tipos. Las mutaciones van por Server Actions. La DB usa Row Level Security — cada usuario solo accede a sus propios datos.

## Setup local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
# completar NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Aplicar migraciones
supabase db push

# 4. Dev server
pnpm dev
```

## Tests

```bash
pnpm test        # watch mode
pnpm test:run    # single run
```

Los tests cubren el slot resolver (algoritmo puro de distribución de equipos al bracket) y las server actions de onboarding.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server-side) |
| `API_FOOTBALL_KEY` | Key de API-Football para datos de partidos |
| `NEXT_PUBLIC_ONBOARDING_ENABLED` | Feature flag del flujo de onboarding |
