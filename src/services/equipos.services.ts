import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Equipo = Database["public"]["Tables"]["equipos"]["Row"];
export type NuevoEquipo = Omit<
  Database["public"]["Tables"]["equipos"]["Insert"],
  "id_entrenador" | "id_equipo"
>;
export type ActualizarEquipo = Database["public"]["Tables"]["equipos"]["Update"];

/**
 * Obtiene todos los equipos del entrenador logueado.
 * Las políticas RLS de Supabase garantizan que solo se devuelvan los equipos propios.
 */
export async function obtenerEquipos(): Promise<Equipo[]> {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .order("nombre_equipo", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene un equipo por su ID.
 */
export async function obtenerEquipoPorId(idEquipo: number): Promise<Equipo | null> {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .eq("id_equipo", idEquipo)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Crea un nuevo equipo.
 * IMPORTANTE: No se envía id_entrenador; la base de datos lo asigna automáticamente con auth.uid().
 */
export async function crearEquipo(datos: NuevoEquipo): Promise<Equipo> {
  const { data, error } = await supabase
    .from("equipos")
    .insert([datos as unknown as Database["public"]["Tables"]["equipos"]["Insert"]])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza los datos de un equipo existente.
 */
export async function actualizarEquipo(
  idEquipo: number,
  datos: ActualizarEquipo,
): Promise<Equipo> {
  const { data, error } = await supabase
    .from("equipos")
    .update(datos)
    .eq("id_equipo", idEquipo)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Elimina un equipo.
 */
export async function eliminarEquipo(idEquipo: number): Promise<void> {
  const { error } = await supabase
    .from("equipos")
    .delete()
    .eq("id_equipo", idEquipo);

  if (error) {
    throw error;
  }
}
