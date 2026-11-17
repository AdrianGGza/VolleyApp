import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type PruebaFisica = Database["public"]["Tables"]["pruebas_fisicas"]["Row"];
export type NuevaPruebaFisica = Omit<
  Database["public"]["Tables"]["pruebas_fisicas"]["Insert"],
  "id_prueba"
>;
export type ActualizarPruebaFisica = Database["public"]["Tables"]["pruebas_fisicas"]["Update"];

/**
 * Obtiene las pruebas físicas de un jugador.
 */
export async function obtenerPruebasFisicasPorJugador(
  idJugador: number,
): Promise<PruebaFisica[]> {
  const { data, error } = await supabase
    .from("pruebas_fisicas")
    .select("*")
    .eq("id_jugador", idJugador)
    .order("fecha_pruebas", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Registra una nueva prueba física para un jugador.
 */
export async function registrarPruebaFisica(
  datos: NuevaPruebaFisica,
): Promise<PruebaFisica> {
  const { data, error } = await supabase
    .from("pruebas_fisicas")
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza una prueba física existente.
 */
export async function actualizarPruebaFisica(
  idPrueba: number,
  datos: ActualizarPruebaFisica,
): Promise<PruebaFisica> {
  const { data, error } = await supabase
    .from("pruebas_fisicas")
    .update(datos)
    .eq("id_prueba", idPrueba)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina una prueba física.
 */
export async function eliminarPruebaFisica(idPrueba: number): Promise<void> {
  const { error } = await supabase
    .from("pruebas_fisicas")
    .delete()
    .eq("id_prueba", idPrueba);

  if (error) throw error;
}

/**
 * Obtiene todas las pruebas físicas de un entrenador (a través de sus jugadores).
 * Filtra por jugadores del entrenador logueado.
 */
export async function obtenerTodasPruebasFisicas(): Promise<PruebaFisica[]> {
  const { data, error } = await supabase
    .from("pruebas_fisicas")
    .select("*, jugadores(*)")
    .order("fecha_pruebas", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
