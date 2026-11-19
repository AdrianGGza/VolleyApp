import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Bienestar = Database["public"]["Tables"]["bienestar"]["Row"];
export type NuevaBienestar = Omit<
  Database["public"]["Tables"]["bienestar"]["Insert"],
  "id_bienestar"
>;
export type ActualizarBienestar = Database["public"]["Tables"]["bienestar"]["Update"];

/**
 * Obtiene los registros de bienestar de un jugador.
 */
export async function obtenerBienestarPorJugador(
  idJugador: number,
): Promise<Bienestar[]> {
  const { data, error } = await supabase
    .from("bienestar")
    .select("*")
    .eq("id_jugador", idJugador)
    .order("fecha_bienestar", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Registra un nuevo registro de bienestar para un jugador en una sesión.
 */
export async function registrarBienestar(
  datos: NuevaBienestar,
): Promise<Bienestar> {
  const { data, error } = await supabase
    .from("bienestar")
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza un registro de bienestar existente.
 */
export async function actualizarBienestar(
  idBienestar: number,
  datos: ActualizarBienestar,
): Promise<Bienestar> {
  const { data, error } = await supabase
    .from("bienestar")
    .update(datos)
    .eq("id_bienestar", idBienestar)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un registro de bienestar.
 */
export async function eliminarBienestar(idBienestar: number): Promise<void> {
  const { error } = await supabase
    .from("bienestar")
    .delete()
    .eq("id_bienestar", idBienestar);

  if (error) throw error;
}
