# OneProdex

Plataforma de predicciones para el **Mundial FIFA 2026**. La app combina prode tradicional, predicciones rápidas por partido, grupos privados, rankings, logros y consenso entre amigos.

## Stack

- **Next.js 16** con App Router y Server Actions.
- **React 19**.
- **TypeScript** en strict mode.
- **Supabase** para Auth, PostgreSQL, storage y service-role server-side.
- **Tailwind CSS 4** con una estética dark "midnight navy".
- **Framer Motion** para microinteracciones.
- **Vitest** para lógica pura, server actions y APIs de feature.
- **pnpm** como único package manager.

## Qué Hace Hoy

- **Onboarding flexible**: modo rápido o modo prode.
- **Modo prode tradicional**: carga resultados de fase de grupos, proyecta grupos y deriva rankings.
- **Modo rápido**: permite predecir partido por partido.
- **Bracket FIFA 2026**: builder de R32 en adelante, con picks persistidos.
- **Awards**: goleador, mejor jugador y mejor joven.
- **Predicción de partidos**: marcador, goleadores, amarillas y rojas en un único guardado.
- **Reglas de goleadores**: `0-0` bloquea todos; `1-0` solo permite goleadores del equipo con gol; tarjetas no dependen del marcador.
- **Consenso de grupo por partido**: muestra predicciones de miembros del grupo, selector si el usuario pertenece a varios grupos y marcador más elegido.
- **Grupos privados**: crear, unirse por código/link, compartir invitación, gestionar/salir/eliminar.
- **Invitaciones**: `/unirse` valida código o link completo y muestra una landing de confirmación.
- **Standings reales y proyectados**: la tabla real usa resultados en vivo/finalizados; la proyectada usa las predicciones del usuario y muestra todos los equipos en cero si no hay picks.
- **Perfil**: puntos de predicciones + logros, champion pick dinámico desde bracket, precisión, racha, últimos 7, historial y logros.
- **Logros**: catálogo, progreso, puntos de achievements y evaluación por acciones.

## Flujos Clave

### Onboarding

El onboarding decide el siguiente paso desde estado persistido:

- Sin modo: selección de `quick` o `prode`.
- Prode incompleto + continuar: salta a awards.
- Prode `72/72`: habilita bracket.
- Bracket completo: awards.
- Awards guardados: marca `users.awards_at` y el usuario entra al home.

Notas importantes:

- `users.awards_at` es el indicador principal de onboarding completo.
- `users.prode_picks_submitted_at` marca que el usuario eligió avanzar desde prode aunque no tenga los 72 resultados.
- Awards navega client-side después de guardar para evitar flashes de `NEXT_REDIRECT`.

### Predicción De Partido

En `/partidos/[id]` el usuario puede:

- Elegir marcador.
- Elegir hasta 3 goleadores.
- Elegir hasta 2 amarillas.
- Elegir hasta 1 roja.
- Guardar todo junto con `Guardar predicción`.

Si el score ya venía del prode tradicional, el marcador queda bloqueado, pero goleadores/tarjetas siguen visibles y editables hasta guardar detalles. Luego quedan visibles pero read-only.

### Grupos e Invitaciones

- Empty state de `/grupo`: landing visual para crear o unirse.
- Modal desde empty state: abre directo en crear o unirse, sin tabs redundantes.
- Modal desde el botón `+` de un grupo existente: mantiene tabs `Crear / Unirme / Gestionar`.
- Unirse con código: acepta código suelto, minúsculas, espacios o URL completa con `?code=`.
- El join pasa por `/unirse` para mostrar validación y confirmación visual antes de insertar membership.

## Rutas Principales

```txt
app/
├── (app)/page.tsx                 # home/dashboard
├── (app)/onboarding/page.tsx      # onboarding quick/prode
├── (app)/partidos/page.tsx        # listado de partidos
├── (app)/partidos/[id]/page.tsx   # detalle y predicción de partido
├── (app)/bracket/page.tsx         # bracket
├── (app)/grupo/page.tsx           # grupos y ranking privado
├── (app)/standings/page.tsx       # standings reales + proyección del usuario
├── (app)/perfil/page.tsx          # perfil
├── (app)/perfil/logros/page.tsx   # logros
├── login/page.tsx                 # login
└── unirse/page.tsx                # aceptar invitación
```

## Estructura

```txt
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
├── standings/
└── shared/

lib/
├── achievements/      # evaluación de logros
├── api-football/      # integración API-Football
└── supabase/          # clients browser/server/service y tipos
```

Convención general: cada feature contiene sus `api`, `actions`, `components`, `hooks`, `types` y `utils` cuando aplica. Las mutaciones de datos viven en Server Actions.

## Datos y Migraciones

Migraciones relevantes recientes:

- `20260610000002_prode_mode.sql`: soporte para modo prode.
- `20260610000003_onboarding_mode_nullable.sql`: modo nullable para onboarding.
- `20260610000004_users_awards_at.sql`: indicador de onboarding completo.
- `20260610000005_users_prode_picks_submitted_at.sql`: avance desde prode incompleto.
- `20260609000000_achievements_catalog.sql`: catálogo de logros.
- `20260609000001_user_achievements.sql`: progreso/logros por usuario.
- `20260609000003_users_achievement_points.sql`: puntos acumulados por logros.
- `20260610000000_leaderboard_correct_count.sql`: conteo para leaderboard.

Para aplicar contra Supabase linkeado se viene usando:

```bash
pnpm dlx supabase db query --linked --file supabase/migrations/<migration>.sql
```

## Setup Local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Variables esperadas:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, solo server-side |
| `API_FOOTBALL_KEY` | API-Football |
| `NEXT_PUBLIC_ONBOARDING_ENABLED` | Feature flag de onboarding |
| `SIMULATED_NOW` | Fecha simulada para estados de partidos en desarrollo |

## Comandos

```bash
pnpm dev          # Next dev con Turbopack
pnpm build        # build
pnpm start        # start producción
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest watch
pnpm test:run     # Vitest run
```

`pnpm-workspace.yaml` permite builds de `msw`, `sharp` y `unrs-resolver`.

## Tests

Hay cobertura enfocada en:

- Onboarding API/actions.
- Slot resolver del bracket.
- Cálculo de standings por predicciones.
- Reglas de predicción de partido.
- Guardado de score + extras.
- Consenso de grupo.
- Perfil y puntos de logros.
- Invitaciones/códigos.
- APIs de home, matches y standings.

Ejemplos útiles:

```bash
pnpm test:run features/onboarding/actions/index.test.ts
pnpm test:run features/predictions/actions/index.test.ts
pnpm test:run features/matches/utils/prediction-flow.test.ts
pnpm test:run features/standings/utils/projected-standings.test.ts
pnpm typecheck
```

## Notas De Producto

- La app privilegia flujos mobile-first.
- Las pantallas de grupo e invitación usan cards centradas con fondo visual cuando el usuario está en estados vacíos.
- Los nombres de grupo nunca deben hardcodearse en textos genéricos; el consenso usa el nombre real del grupo solo cuando existe.
- En flows client-side que llaman Server Actions manualmente, evitar `redirect()` dentro de la action si hay `try/catch` en el cliente. Guardar/revalidar en la action y navegar con router en el cliente.
