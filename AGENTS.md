# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# AGENTS.md - Aplicación de Voleibol

App Mobile creada para que un entrenador de voleibol pueda gestionar a sus equipos, jugadores y rutinas de entrenamiento. El código debe de poder ser entendible para alguien que empieza a programar en entornos Mobile

## Stack y estructura

- React Native + Expo, con Expo Router (typed routes activado) — NO uso Node/Express, Supabase cubre la API directamente
- Supabase (Postgres) como base de datos y autenticación
- TypeScript, con tipos generados automáticamente desde el esquema real vía `npx supabase gen types typescript --project-id clnmsoxaarpxcnqhqvrq --schema public > src/types/database.types.ts`
- Leer la documentación de Expo con el siguiente URL `https://docs.expo.dev/versions/v57.0.0/`

## Convenciones

- Textos de la interfaz en español.
- La convención de los nombres en la base de datos y los campos que vienen de supabase va a ser en snake_case
- Para React Native, usa PascalCase para los componentes y camelCase para variables y funciones
- El cliente de supabase se crea solo en `src/services/supabase.ts`
- Un `*.services.ts` por entidad, crearlo en `src/services/`, aquí van los archivos de servicio por entidad de negocio
- Idioma de los identificadores del código: español para los nombres de dominio e inglés para palabras del framework

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
- Explica por qué, no solo que

## Límites

- 🚫 Nunca: Modificar una policy RLS o una tabla para "hacer que funcione", solo proponerlas
- 🚫 Nunca: Instalar una dependencia sin avisarme
- 🚫 Nunca: Poner una llave de supabase en el código a excepción de la URL y la llave publica (anon), que van en variables de entorno (En expo, las publicas empiezan con `EXPO_PUBLIC_`)
- 🚫 Nunca: Hardcodear llaves, `service_role` no debe de aparecer jamás; `.env.local` no se sube a la repo
- 🚫 Nunca: Editar `database.types.ts` a mano en vez de regenerarlo, se encuentra en `src/types/database.types.ts`
- ⚠️ Preguntar antes: Modificar sesión y rutas protegidas
- ✅ Siempre: Actualizar la memoria `MEMORY.md` al cerrar una feature o una decisión

## Reglas de dominio y trampas

- Las filas de `ejercicios` con `id_entrenador` NULL son globales: cualquier entrenador las lee, ninguno las edita ni las borra (`UPDATE` o `DELETE` regresa 0 filas sin error)
- no mandes globales desde la app: un `INSERT` con `id_entrenador` NULL falla con error de RLS. Los globales se siembran por SQL
- Cuando RLS te bloquea, `INSERT` falla con error, y `SELECT`, `UPDATE` o `DELETE` regresan vacío o 0 filas sin error
- Las tablas raíz `equipos` y `rutinas` se relacionan con el entrenador mediante su id `id_entrenador`
- En los `INSERT` de `equipos`, `rutinas` y `ejercicios`, no mandes`id_entrenador`, porque lo pone la base con `auth.uid()`, mandarlo distinto causa un error de RLS
- Los nombres exactos de tablas y columnas salen de `src/types/database.types.ts`: léelo, no los adivines.
- Las dos excepciones reales, con sus nombres: `ejercicios` (`id_ejercicios`, `nombre_ejercicios`, `categoria_ejercicios`) y `pruebas_fisicas` (sufijo `_pruebas`).
- Las tablas hijas no llevan `id_entrenador`, no mandes `INSERT`
- Las tablas hijas heredan la propiedad por FK del entrenador de `equipos` a excepción de `rutina_ejercicios` y `rutinas_posicion`, estas dos apuntan a la tabla `rutinas`
- `asignaciones_rutina` tiene dos padres, `jugadores` y `rutinas`, ambos del entrenador
- Para cumplir un `INSERT` en las tablas hijas, la fila debe apuntar a un padre que sea del entrenador logueado
- `posiciones` es solo lectura, no hagas `INSERT`: truena con error de RLS. Un `UPDATE` o `DELETE` no cambia nada y regresa 0 filas, sin error

## Verificación

- Revisa que TypeScript pase sin errores, usa el comando `npx tsc --noEmit`
- Dime qué pasos probar con tus dos entrenadores de prueba
- Si una consulta regresa vacío o un `INSERT` falla con RLS, revisa en este orden:
  - ¿Hay sesión activa en ese momento o todavía no cargó?
  - ¿El `id_entrenador` que se envía es el del usuario logueado?
  - ¿Esos datos pertenecen a ese entrenador o al otro entrenador de prueba?
- Si después de esto sigues sospechando de la policy, propón un cambio, no lo ejecutes

## Plan

- Espera mi aprobación del plan antes de realizar algún cambio

## Memoria

- Leer `MEMORY.md` al empezar
- Mantenerlo corto
- Nunca guardar secretos
