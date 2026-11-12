import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Rutina = Database["public"]["Tables"]["rutinas"]["Row"];
export type NuevaRutina = Omit<
  Database["public"]["Tables"]["rutinas"]["Insert"],
  "id_entrenador" | "id_rutina"
>;
export type ActualizarRutina = Database["public"]["Tables"]["rutinas"]["Update"];

/**
 * Obtiene todas las rutinas del entrenador logueado.
 * Las políticas RLS garantizan que solo se devuelvan las rutinas propias.
 */
export async function obtenerRutinas(): Promise<Rutina[]> {
  const { data, error } = await supabase
    .from("rutinas")
    .select("*")
    .order("nombre_rutina", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene una rutina por su ID.
 */
export async function obtenerRutinaPorId(
  idRutina: number,
): Promise<Rutina | null> {
  const { data, error } = await supabase
    .from("rutinas")
    .select("*")
    .eq("id_rutina", idRutina)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Crea una nueva rutina.
 * IMPORTANTE: No se envía id_entrenador; la base de datos lo asigna con auth.uid().
 */
export async function crearRutina(datos: NuevaRutina): Promise<Rutina> {
  const { data, error } = await supabase
    .from("rutinas")
    .insert([datos as unknown as Database["public"]["Tables"]["rutinas"]["Insert"]])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza los datos de una rutina existente.
 */
export async function actualizarRutina(
  idRutina: number,
  datos: ActualizarRutina,
): Promise<Rutina> {
  const { data, error } = await supabase
    .from("rutinas")
    .update(datos)
    .eq("id_rutina", idRutina)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Elimina una rutina.
 */
export async function eliminarRutina(idRutina: number): Promise<void> {
  const { error } = await supabase
    .from("rutinas")
    .delete()
    .eq("id_rutina", idRutina);

  if (error) {
    throw error;
  }
}
