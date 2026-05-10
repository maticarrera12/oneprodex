# PRD — Prode Mundial 2026

## Product Requirements Document

- **Version:** 2.0
- **Author:** Matías Carrera
- **Architecture:** Fullstack Next.js
- **Database & Auth:** Supabase
- **Target Release:** MVP Pre Mundial 2026

---

# 1. Visión General

## Resumen

El producto será una plataforma moderna de prode social para el Mundial 2026, enfocada en:

- grupos de amigos
- realtime
- experiencia mobile-first
- rankings dinámicos
- diseño premium
- interacción social
- experiencia emocional del Mundial

El objetivo NO es crear solamente un sistema de predicciones tradicional, sino una experiencia moderna, rápida y altamente compartible.

---

# 2. Objetivo del Producto

Construir el mejor prode moderno para vivir el Mundial 2026 con amigos.

La plataforma debe sentirse:

- viva
- rápida
- social
- competitiva
- premium

---

# 3. Problema

Los prodes actuales presentan:

- UX antigua
- interfaces lentas
- cero realtime
- diseño pobre
- poca interacción social
- experiencia aburrida
- baja retención

Muchos usuarios terminan usando:

- Excel
- Google Sheets
- WhatsApp

porque las soluciones existentes no generan una experiencia moderna ni divertida.

---

# 4. Oportunidad

El Mundial genera:

- tráfico masivo
- engagement emocional
- competencia social
- consumo diario
- viralidad

Existe una gran oportunidad para construir:

- una experiencia social moderna
- mobile-first
- realtime
- visualmente premium

---

# 5. Público Objetivo

## Público principal

- grupos de amigos
- oficinas
- universidades
- comunidades online

---

## Público secundario

- streamers
- comunidades Discord
- grupos privados
- torneos internos

---

# 6. Objetivos del MVP

## Objetivos principales

Permitir:

- crear grupos
- invitar amigos
- realizar predicciones
- visualizar rankings live
- seguir partidos en tiempo real

---

## Objetivos UX

La aplicación debe sentirse:

- extremadamente rápida
- moderna
- mobile-first
- viva
- interactiva

---

# 7. Filosofía del Producto

## El foco NO está en:

- cientos de features
- estadísticas complejas
- fantasy avanzado

---

## El foco SÍ está en:

- experiencia emocional
- rankings live
- interacción social
- realtime
- UX premium

---

# 8. Diferencial Principal

## El producto se diferencia por:

### 1. Realtime

Los rankings cambian en vivo durante los partidos.

---

### 2. Diseño moderno

Inspiración:

- OneFootball
- Sofascore
- Linear
- gaming UI

---

### 3. Mobile-first

La app será diseñada principalmente para celulares.

---

### 4. Experiencia social

- rankings
- competencia
- actividad amigos
- sharing

---

# 9. Arquitectura General

## Filosofía Arquitectónica

La arquitectura debe priorizar:

- simplicidad
- velocidad de desarrollo
- escalabilidad razonable
- realtime
- claridad de dominio
- modularidad

---

## Importante

NO se utilizarán:

- microservicios
- CQRS complejo
- event sourcing hardcore
- overengineering

---

## Arquitectura elegida

### Monolito modular fullstack con Next.js

---

# 10. Stack Tecnológico

# Frontend + Backend

## Framework principal

- Next.js (App Router)

---

## Lenguaje

- TypeScript

---

## Styling

- Tailwind CSS

---

## UI Components

- shadcn/ui

---

## Animaciones

- Framer Motion

---

## Estado Global UI

- Zustand

---

## Server State

- TanStack Query

---

## Validaciones

- Zod

---

# Database & Auth

## Plataforma principal

- Supabase

---

## Base de datos

- PostgreSQL (Supabase)

---

## Authentication

- Supabase Auth

---

## Login providers

- Google
- Discord

---

## Realtime

- Supabase Realtime
- WebSockets cuando sea necesario

---

# Infraestructura

## Hosting

- Vercel

---

## Database

- Supabase

---

## Cache futura

- Upstash Redis (opcional)

---

# 11. Arquitectura Frontend

## Filosofía

La arquitectura frontend será:

- feature-based
- domain-driven
- modular
- escalable

---

## Estructura principal

```txt
src/
 ├── app/
 ├── features/
 ├── shared/
 ├── components/
 ├── lib/
 ├── providers/
 ├── stores/
 ├── types/
```

---

# 12. Feature-Based Architecture

## Estructura recomendada

```txt
features/
 ├── auth/
 ├── groups/
 ├── matches/
 ├── predictions/
 ├── standings/
 ├── rankings/
 ├── profile/
 ├── realtime/
```

---

## Ejemplo interno

```txt
features/matches/
 ├── components/
 ├── hooks/
 ├── api/
 ├── store/
 ├── types/
 ├── utils/
 ├── schemas/
```

---

# 13. Separación de Estado

## Server State

Utilizar TanStack Query para:

- matches
- standings
- rankings
- predictions
- fixtures

---

## UI State

Utilizar Zustand para:

- modals
- drawers
- selected match
- UI interactions
- filters
- animations

---

## Regla importante

NO mezclar:
- server state
- UI state

---

# 14. Arquitectura Event-Driven

## Filosofía central

La aplicación debe funcionar orientada a eventos.

---

## Ejemplo de flujo

```txt
GOAL_SCORED
↓
UPDATE_MATCH
↓
RECALCULATE_POINTS
↓
UPDATE_RANKING
↓
EMIT_REALTIME_EVENT
↓
REFRESH_UI
```

---

# 15. Realtime Architecture

## Realtime Layer

Toda la lógica realtime debe estar centralizada.

---

## Estructura

```txt
features/realtime/
```

---

## Responsabilidades

- subscriptions
- realtime handlers
- reconnect logic
- ranking updates
- live match updates

---

# 16. API Architecture

## Regla principal

NO hacer fetch directamente en componentes.

---

## Crear API Layer

```txt
features/*/api/
```

---

## Ejemplo

```ts
matchesApi.getLiveMatches()
groupsApi.getGroup()
predictionsApi.submitPrediction()
```

---

# 17. Domain Modeling

## Muy importante

NO utilizar payloads crudos de API-Football.

---

## Crear tipos internos

```txt
shared/types/domain/
```

---

## Ejemplos

```txt
Match
Team
Standing
Prediction
RankingEntry
Group
UserStats
```

---

# 18. Integración Deportiva

## API Principal

- API-Football (API oficial para fixtures, resultados y eventos live)

---

## Información obtenida

- fixtures
- scores
- standings
- live events
- knockout brackets
- goals
- match status

---

# 19. Polling Inteligente

## Antes del partido

Cada 5 minutos.

---

## Partido live

Cada 15 segundos.

---

## Entretiempo

Cada 30 segundos.

---

## Partido finalizado

Detener polling.

---

# 20. Background Jobs

## Importante

Las tareas pesadas NO deben ejecutarse en requests UI.

---

## Jobs principales

```txt
sync-live-matches
recalculate-rankings
update-standings
sync-fixtures
```

---

# 21. Funcionalidades MVP

# 21.1 Authentication

## Login providers

- Google
- Discord

---

## Objetivo

Onboarding extremadamente rápido.

---

# 21.2 Grupos

## Funcionalidades

- crear grupo
- unirse mediante link
- ranking grupal

---

# 21.3 Predicciones

## Usuarios podrán

- predecir resultado exacto
- elegir ganador
- elegir campeón del torneo
- elegir mejor jugador del torneo
- elegir mejor jugador joven del torneo
- elegir goleador del torneo
- predecir goleadores por partido
- predecir si cada equipo termina con arco en 0
- predecir tarjetas por jugador

---

## Restricción

Las predicciones se bloquean al iniciar el partido.

---

# 21.4 Fixtures

## Mostrar

- partidos
- horarios
- estado
- fase
- grupo

---

# 21.5 Live Matches

## Mostrar

- score live
- minuto
- estado
- eventos

---

# 21.6 Ranking Realtime

## Core emocional del producto

Cuando ocurre:

- gol
- penal
- finalización

El ranking:
- cambia live
- se recalcula
- se actualiza automáticamente

---

# 21.7 Standings

## Mostrar

- puntos
- diferencia de gol
- clasificados

---

## Live updates

Las tablas cambian en tiempo real.

---

# 21.8 Bracket

## Mostrar

- octavos
- cuartos
- semifinales
- final

---

# 21.9 Perfil Usuario

## Información

- puntos
- precisión
- historial
- ranking

---

# 21.10 Sharing

## Compartir

- rankings
- posiciones
- resultados
- actividad

---

# 22. Sistema de Puntos

## MVP

### Resultado exacto

5 pts

---

### Ganador correcto

2 pts

---

### Incorrecto

0 pts

---

## Predicciones de torneo

### Campeón correcto

10 pts

---

### Mejor jugador correcto

8 pts

---

### Mejor jugador joven correcto

8 pts

---

### Goleador correcto

8 pts

---

## Predicciones de partido (detalle)

### Goleador por jugador acertado

3 pts por jugador acertado

---

### Arco en 0 por equipo acertado

2 pts por equipo acertado

---

### Tarjetas por jugador acertadas

1 pt por tarjeta acertada

---

## Reglas de acumulación

- los puntos se acumulan entre resultado, goleadores, arco en 0 y tarjetas
- el puntaje final del usuario es la suma de todos los partidos + predicciones de torneo

---

# 23. UX/UI

# Filosofía Visual

## Inspiraciones

- OneFootball
- Sofascore
- Linear
- gaming UI

---

# Estilo

## Dark mode principal

---

## Color principal

- Lime de shadcn/ui

---

## Sensación buscada

- moderna
- deportiva
- premium
- energética
- realtime

---

# 24. Motion Design

## Muy importante

### Animaciones

- ranking changes
- goal updates
- live pulses
- transitions
- hover states

---

# 25. Mobile-First

## Prioridad máxima

La app será utilizada principalmente desde:

- celulares
- sillón
- viewing parties
- grupos de amigos

---

## UI esperada

- bottom navbar
- app-like feel
- smooth transitions
- thumb-friendly UX

---

# 26. Performance

## Objetivos

La app debe sentirse:

- instantánea
- fluida
- ligera

---

## Estrategias

- lazy loading
- streaming
- cache
- optimistic UI
- route prefetching

---

# 27. Seguridad

## Features

- Supabase Auth
- RLS policies
- rate limiting
- validaciones backend
- predicción locking

---

# 28. Analytics

## Métricas importantes

- DAU
- Retención
- Tiempo sesión
- Grupos creados
- Predicciones realizadas

---

# 29. Monetización Futura

## Inicialmente

NO monetizar agresivamente.

---

## Objetivo inicial

- crecimiento
- retención
- viralidad
- grupos activos

---

## Monetización futura

### Premium Groups

- analytics
- badges
- customización

---

### Sponsors

- rankings patrocinados
- eventos especiales

---

### White Label

- empresas
- streamers
- comunidades

---

# 30. Roadmap

# Fase 1 — MVP

## Objetivo

Producto premium y usable.

---

## Incluye

- auth
- grupos
- predicciones
- rankings
- live scores
- standings
- bracket
- realtime básico

---

# Fase 2

## Features

- gamificación
- badges
- streaks
- social feed

---

# Fase 3

## Features

- creator mode
- overlays OBS
- stream integrations

---

# 31. Riesgos

## Riesgo principal

Scope explosion.

---

## Riesgos secundarios

- realtime spaghetti
- overengineering
- demasiadas features
- inconsistencias UI

---

# 32. Filosofía de Desarrollo

## Prioridades

1. UX
2. Realtime
3. Simplicidad
4. Performance
5. Polish

---

## Evitar

- complejidad innecesaria
- feature bloat
- arquitectura enterprise innecesaria

---

# 33. Estrategia de Desarrollo con IA

La IA será utilizada para acelerar:

- CRUD
- componentes
- UI
- realtime boilerplate
- hooks
- schemas
- layouts
- forms

---

## El foco humano será

- producto
- UX
- arquitectura
- experiencia emocional

---

# 34. Definición de Éxito MVP

## El MVP será exitoso si:

### Usuarios

- crean grupos
- vuelven diariamente
- revisan rankings constantemente
- comparten resultados
- sienten emoción usando la app

---

## La app se siente

- viva
- moderna
- premium
- rápida
- adictiva

---

# 35. Visión Final

Convertirse en:

## la mejor experiencia social para vivir eventos deportivos con amigos.

---

## Inicialmente

- Mundial 2026

---

## Futuro

- Champions
- Libertadores
- Copa América
- NBA
- Fórmula 1
- esports

---

# 36. Conclusión

El producto no busca ser:
“otro prode”.

Busca convertirse en:

- una experiencia social
- competitiva
- realtime
- moderna
- emocional

aprovechando:

- diseño premium
- realtime
- mobile-first
- UX moderna
- interacción social
- velocidad

para construir una plataforma altamente compartible y adictiva durante el Mundial 2026.