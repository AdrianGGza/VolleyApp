# VolleyApp

App móvil para que un entrenador de voleibol gestione a sus equipos, jugadores, rutinas y sesiones de entrenamiento desde el celular.

Proyecto individual de la materia de aplicaciones móviles (Ingeniería en Tecnologías de Software, UANL FIME).

## ¿Qué problema resuelve?

Llevar el control de un equipo (jugadores, rutinas, sesiones y datos de entrenamiento) suele terminar en hojas de cálculo y mensajes sueltos. VolleyApp centraliza esa información en un solo lugar, de uso exclusivo del entrenador: cada entrenador solo ve y modifica sus propios datos.

## Funcionalidades

- **Equipos:** alta, edición y baja de equipos con su categoría.
- **Jugadores:** registro de plantilla por equipo con nombre, edad, estatura, peso y posición de voleibol.
- **Rutinas:** creación de rutinas de entrenamiento, asignación de ejercicios (globales o personales), series y repeticiones.
- **Biblioteca de ejercicios:** búsqueda de ejercicios desde exerciseapi.dev con filtros por categoría y músculo, para agregar a una rutina.
- **Calendario:** vista mensual de sesiones de entrenamiento, creación de sesiones por equipo y fecha, detalle por día con sesiones y rutinas asignadas por jugador.
- **Captura de datos de sesión:** formulario por jugador con RPE (1-10), saltos, bienestar (sueño, fatiga, molestias, informativo) y pruebas físicas (agilidad, core, salto, navette).

## Tecnologías

- **App:** React Native, Expo SDK 57, Expo Router (navegación por archivos), TypeScript.
- **Backend:** Supabase (PostgreSQL, Auth y Row Level Security).
- **API externa:** exerciseapi.dev (biblioteca de ejercicios).
- **Desarrollo asistido por IA:** el repo incluye `AGENTS.md` con las reglas de trabajo.

## Base de datos

Modelo relacional en PostgreSQL con nombres en `snake_case`. Las tablas raíz (`entrenadores`, `equipos`, `rutinas`, `jugadores`) se relacionan con el entrenador mediante `id_entrenador`. Las tablas hijas heredan la propiedad por clave foránea.

Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `entrenadores` | Usuario autenticado (dueño de los datos) |
| `equipos` | Equipos del entrenador (`id_entrenador`) |
| `jugadores` | Jugadores de un equipo (`id_equipo`) |
| `posiciones` | Posiciones de voleibol (solo lectura) |
| `rutinas` | Rutinas del entrenador (`id_entrenador`) |
| `ejercicios` | Catálogo de ejercicios (globales o del entrenador) |
| `rutina_ejercicios` | Ejercicios asignados a una rutina (series, repeticiones, orden) |
| `sesiones_entrenamiento` | Sesiones creadas por día y equipo |
| `asignaciones_rutina` | Rutina asignada a un jugador en una fecha |
| `registro_jugador_sesion` | RPE y saltos de un jugador en una sesión |
| `pruebas_fisicas` | Agilidad, core, salto y navette de un jugador |

Los tipos de TypeScript se generan a partir del esquema real (`src/types/database.types.ts`).

## Seguridad

Cada tabla raíz tiene una columna `id_entrenador` ligada al usuario de Supabase Auth. Con **Row Level Security (RLS)** activo, cada entrenador solo accede a sus propios registros. El aislamiento se probó con dos entrenadores de prueba.

**Regla importante:** en los `INSERT` de `equipos`, `rutinas` y `ejercicios`, no se envía `id_entrenador`; la base lo asigna automáticamente con `auth.uid()`.

## Variables de entorno

Se requiere un archivo `.env` (no se sube al repo) con las credenciales públicas de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_publica
```

Solo se usan variables con prefijo `EXPO_PUBLIC_`. Nunca se hardcodea la clave `service_role`.

## Cómo correrlo

```bash
npm install
npx expo start
```

Comandos útiles:

```bash
npx tsc --noEmit          # Verifica tipos de TypeScript
npx expo start            # Inicia el servidor de Expo
```

## Guía de uso para el entrenador

### 1. Crear un equipo
Desde la pestaña **Equipos**, toca "Crear primer equipo" o el botón "+ Nuevo". Ingresa el nombre y la categoría (opcional).

### 2. Registrar jugadores
Entra al detalle de un equipo y toca "Añadir primer jugador" o "+ Añadir". Completa nombre, posición, edad, estatura y peso.

### 3. Crear una rutina
Desde la pestaña **Rutinas**, toca "Crear primera rutina" o "+ Nueva". Ingresa nombre, descripción y categoría. Luego entra a la rutina y usa "Agregar ejercicio" para buscar en la biblioteca o crear uno personalizado, definiendo series, repeticiones y orden.

### 4. Crear una sesión de entrenamiento
Desde la pestaña **Rutinas**, toca "Calendario". Luego toca "+ Nueva sesión", selecciona el equipo, la fecha y la duración (opcional).

### 5. Capturar datos de la sesión
En el calendario, selecciona un día con sesiones y toca "Capturar datos" en la sesión deseada. Para cada jugador ingresa:
- **RPE:** esfuerzo percibido de 1 a 10.
- **Saltos:** cantidad de saltos (número positivo).
- **Pruebas físicas:** agilidad, core, salto y navette (números positivos).
- **Bienestar:** sueño, fatiga y molestias se muestran como referencia (no se guardan en la base de datos).

Toca "OK" al finalizar. Los datos se guardan y vuelves al calendario automáticamente.

## Autor

Adrián Galván: [GitHub](https://github.com/AdrianGGza) · [LinkedIn](https://linkedin.com/in/adrian-galvan-5411b7432)
