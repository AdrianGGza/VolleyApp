# Memoria

## Cómo leer este archivo

Si este archivo contradice el código o la base, la verdad es el código y la base, y me avisas. Así un dato viejo no te engaña.

## Estado

- Tablas de la base de datos (Terminado, 2026/09/17)
- RLS de las tablas (Terminado, 2026/09/21)
- Tipos regenerados: Terminado
- Auth(A medias, 2026/10/18): Creado, faltan variables `EXPO_PUBLIC`, un listener de `AppState`, login, rutas protegidas y logout, no tocar
- supabase.ts(Ajustes pendientes, 2026/09/24)

## Decisiones

- DEFAULT auth.uid() en id_entrenador: así ningún INSERT lo manda a mano. Razón: RLS ya valida igual
- ejercicios como catálogo híbrido: la tabla necesita contener simultáneamente filas que son catálogo compartido (visibles para todos) y filas que son propiedad de un entrenador específico (visibles solo para él).
- Auth lo escribo yo: Auth está a medias, lo quiero finalizar yo

## Pendientes y orden

- Estas son las fases pendientes del proyecto
  - Setup del proyecto y autenticación del entrenador (a medias)
  - CRUD de jugadores
  - Rutinas y ejercicios
  - Calendarización de rutinas por día
  - Pantallas de captura de datos de sesión (RPE, saltos, bienestar, pruebas físicas)
  - Pulido, documentación y entrega
