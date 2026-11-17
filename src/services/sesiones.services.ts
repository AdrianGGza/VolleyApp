import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Sesion = Database["public"]["Tables"]["sesiones_entrenamiento"]["Row"];
export type NuevaSesion = Omit<
  Database["public"]["Tables"]["sesiones_entrenamiento"]["Insert"],
  "id_sesion"
>;
export type ActualizarSesion = Database["public"]["Tables"]["sesiones_entrenamiento"]["Update"];
export type AsignacionRutina = Database["public"]["Tables"]["asignaciones_rutina"]["Row"];
export type NuevaAsignacionRutina = Omit<
  Database["public"]["Tables"]["asignaciones_rutina"]["Insert"],
  "id_asignacion"
>;
export type RegistroJugadorSesion = Database["public"]["Tables"]["registro_jugador_sesion"]["Row"];
export type NuevoRegistroJugadorSesion = Omit<
  Database["public"]["Tables"]["registro_jugador_sesion"]["Insert"],
  "id_jugador" | "id_sesion"
>;

/**
 * Obtiene todas las sesiones de entrenamiento del entrenador logueado.
 * RLS filtra por id_equipo del entrenador.
 */
export async function obtenerSesiones(): Promise<Sesion[]> {
  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .select("*")
    .order("fecha_sesion", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene sesiones en un rango de fechas.
 */
export async function obtenerSesionesPorRango(
  fechaInicio: string,
  fechaFin: string,
): Promise<Sesion[]> {
  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .select("*")
    .gte("fecha_sesion", fechaInicio)
    .lte("fecha_sesion", fechaFin)
    .order("fecha_sesion", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene sesiones de un equipo específico.
 */
export async function obtenerSesionesPorEquipo(idEquipo: number): Promise<Sesion[]> {
  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .select("*")
    .eq("id_equipo", idEquipo)
    .order("fecha_sesion", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Crea una nueva sesión de entrenamiento.
 * No se envía id_sesion (autoincrement).
 */
export async function crearSesion(datos: NuevaSesion): Promise<Sesion> {
  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza una sesión existente.
 */
export async function actualizarSesion(
  idSesion: number,
  datos: ActualizarSesion,
): Promise<Sesion> {
  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .update(datos)
    .eq("id_sesion", idSesion)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina una sesión.
 */
export async function eliminarSesion(idSesion: number): Promise<void> {
  const { error } = await supabase
    .from("sesiones_entrenamiento")
    .delete()
    .eq("id_sesion", idSesion);

  if (error) throw error;
}

/**
 * Obtiene las asignaciones de rutina para una fecha específica.
 * Usa asignaciones_rutina.fecha para saber qué rutina se asignó a qué jugador ese día.
 */
export async function obtenerAsignacionesPorFecha(
  fecha: string,
): Promise<AsignacionRutina[]> {
  const { data, error } = await supabase
    .from("asignaciones_rutina")
    .select("*, rutinas(*), jugadores(*)")
    .eq("fecha", fecha);

  if (error) throw error;
  return data ?? [];
}

/**
 * Registra las métricas de un jugador en una sesión (RPE, saltos).
 */
export async function registrarJugadorSesion(
  datos: NuevoRegistroJugadorSesion & { id_jugador: number; id_sesion: number },
): Promise<RegistroJugadorSesion> {
  const { data, error } = await supabase
    .from("registro_jugador_sesion")
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtiene los registros de jugadores para una sesión específica.
 */
export async function obtenerRegistrosPorSesion(
  idSesion: number,
): Promise<RegistroJugadorSesion[]> {
  const { data, error } = await supabase
    .from("registro_jugador_sesion")
    .select("*, jugadores(*)")
    .eq("id_sesion", idSesion);

  if (error) throw error;
  return data ?? [];
}
