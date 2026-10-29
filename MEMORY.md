# Memoria

## Cómo leer este archivo

Si este archivo contradice el código o la base, la verdad es el código y la base, y me avisas. Así un dato viejo no te engaña.

## Estado

Ultima revision: 2026/10/17
Fecha limite de entrega: 2026/11/23

- Tablas de la base de datos (Terminado)
- RLS de las tablas (Terminado)
- Tipos regenerados: Terminado
- Auth (A medias): Creado, falta login, `onAuthStateChange`,rutas protegidas, logout, esto lo escribo yo porque me interesa entender como funciona la sesión antes de delegar, yo mismo marco cuando haya finalizado
- `supabase.ts` (Terminados):las variables se encuentran en `.env.local`

## Decisiones

- DEFAULT auth.uid() en id_entrenador: así ningún INSERT lo manda a mano. Razón: RLS ya valida igual
- `ejercicios` como catálogo híbrido: Los entrenadores pueden elegir entre una lista de ejercicios pero tambien pueden crear ejercicios personalizados, asi son libres de personalizar al completo su rutina

## Pendientes y orden

- Estas son las fases pendientes del proyecto
  - Setup del proyecto y autenticación del entrenador (a medias)
  - CRUD de jugadores
  - Rutinas y ejercicios
  - Calendarización de rutinas por día
  - Pantallas de captura de datos de sesión (RPE, saltos, bienestar, pruebas físicas)
  - Pulido, documentación y entrega
