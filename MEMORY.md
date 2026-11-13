# Memoria

## Cómo leer este archivo

Si este archivo contradice el código o la base, la verdad es el código y la base, y me avisas. Así un dato viejo no te engaña.

## Estado

Ultima revision: 2026/11/11
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
- Paleta «Court & Ball»: Amber Volt (#FFB800), Court Blue (#1D63FF), fondos oscuros #0D111A / claros #F8F9FC. Skill de diseño: `design-taste-frontend`.

## Pendientes y orden

- Estas son las fases del proyecto:
  - [x] Setup del proyecto y autenticación del entrenador (Terminado)
  - [x] CRUD de Equipos y Jugadores (Terminado): Dashboard de equipos con crear/eliminar, detalle de equipo con plantilla de jugadores (crear/editar/eliminar), selector de posiciones, métricas físicas. Corrección de schema: `estatura_jugador` y `peso_jugador` cambiados a `NUMERIC(5,2)` en Supabase.
  - [x] Rutinas y ejercicios (Fase 3, excepto 1D opcional): servicios 1A/1B/1C ya existían; tab "Rutinas" nuevo en `src/app/(app)/(tabs)/rutinas.tsx` (listado, crear/eliminar, vacío, pull-to-refresh, modal creación); `app-tabs.tsx` tercer tab agregado; `_layout.tsx` ruta `rutina/[id]` registrada; detalle `src/app/(app)/rutina/[id].tsx` con editar/eliminar rutina, lista ejercicios asignados (nombre, categoría, badge Global/Personal, series×repeticiones), editar/quitar ejercicio, agregar ejercicio con buscador; Opción A: crear ejercicio personalizado dentro del modal de agregar. 1D (rutinas-posicion) pospuesto para pulido.
  - [x] Biblioteca de ejercicios (exerciseapi.dev): servicio con caché 24h (AsyncStorage), pantalla de búsqueda con filtros categoría/músculo y debounce 250ms, pantalla de detalle con overview/instrucciones/tips/errores comunes/seguridad/variaciones, manejo de errores con hint/docs_url. Botón "Biblioteca" movido al detalle de la rutina (rutina/[id]) para agregar ejercicios desde la biblioteca a una rutina específica. Flujo de agregar: crear ejercicio en Supabase (crearEjercicio) para obtener id_ejercicios real, luego insertar en rutina_ejercicios. Textos UI traducidos al español (nivel: Principiante/Intermedio/Avanzado). Fondos de músculos y variaciones mejorados para mejor legibilidad. Opción B: biblioteca separada, sin vincular a rutina_ejercicios directamente más que por FK.
  - [ ] Calendarización de rutinas por día
  - [ ] Pantallas de captura de datos de sesión (RPE, saltos, bienestar, pruebas físicas)
  - [ ] Pulido, documentación y entrega
