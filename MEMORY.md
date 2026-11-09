# Memoria

## Cómo leer este archivo

Si este archivo contradice el código o la base, la verdad es el código y la base, y me avisas. Así un dato viejo no te engaña.

## Estado

Ultima revision: 2026/11/09
Fecha limite de entrega: 2026/11/23

- Tablas de la base de datos (Terminado)
- RLS de las tablas (Terminado)
- Tipos regenerados: Terminado
- Auth (Terminado): Flujo completo verificado en iPhone. Sesión reactiva con `onAuthStateChange`, rutas protegidas mediante `Stack.Protected` con `redirectTo="/login"`, splash idempotente con `useRef`, diferenciación de error de red vs. credenciales con `isAuthRetryableFetchError`, y logout funcional con `supabase.auth.signOut()`.
- `supabase.ts` (Terminado): Variables en `.env.local`, auto-refresh con AppState verificado y sin logs residuales.

## Decisiones

- DEFAULT auth.uid() en id_entrenador: así ningún INSERT lo manda a mano. Razón: RLS ya valida igual.
- `ejercicios` como catálogo híbrido: Los entrenadores pueden elegir entre una lista de ejercicios pero también pueden crear ejercicios personalizados.
- Rutas protegidas y Splash: `_layout.tsx` raíz unificado. Mientras `sesion === undefined` solo se muestra el splash nativo. Si `getSession()` inicial falla por red o almacenamiento, se degrada a `null` (login) por simplicidad para no congelar el splash ni requerir vistas intermedias.
- Tabs nativas: Migrado a la API estable `expo-router/native-tabs`.

## Pendientes y orden

- Estas son las fases del proyecto:
  - [x] Setup del proyecto y autenticación del entrenador (Terminado)
  - [ ] CRUD de jugadores (Siguiente fase: Equipos y Jugadores)
  - [ ] Rutinas y ejercicios
  - [ ] Calendarización de rutinas por día
  - [ ] Pantallas de captura de datos de sesión (RPE, saltos, bienestar, pruebas físicas)
  - [ ] Pulido, documentación y entrega
