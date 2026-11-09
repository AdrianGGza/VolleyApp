import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Jugador = Database["public"]["Tables"]["jugadores"]["Row"];
export type NuevoJugador = Omit<
  Database["public"]["Tables"]["jugadores"]["Insert"],
  "id_jugador"
>;
export type ActualizarJugador = Database["public"]["Tables"]["jugadores"]["Update"];

export type JugadorConPosicion = Jugador & {
  posiciones?: {
    id_posicion: number;
    nombre_posicion: string | null;
  } | null;
};

/**
 * Obtiene todos los jugadores de un equipo específico con su posición.
 * La política RLS valida que el equipo pertenezca al entrenador logueado.
 */
export async function obtenerJugadoresPorEquipo(
  idEquipo: number,
): Promise<JugadorConPosicion[]> {
  const { data, error } = await supabase
    .from("jugadores")
    .select("*, posiciones(id_posicion, nombre_posicion)")
    .eq("id_equipo", idEquipo)
    .order("nombre_jugador", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as JugadorConPosicion[]) ?? [];
}

/**
 * Obtiene un jugador específico por su ID.
 */
export async function obtenerJugadorPorId(
  idJugador: number,
): Promise<JugadorConPosicion | null> {
  const { data, error } = await supabase
    .from("jugadores")
    .select("*, posiciones(id_posicion, nombre_posicion)")
    .eq("id_jugador", idJugador)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as unknown as JugadorConPosicion) ?? null;
}

/**
 * Registra un nuevo jugador en un equipo.
 * IMPORTANTE: No lleva id_entrenador; la pertenencia se hereda por FK de id_equipo.
 */
export async function crearJugador(datos: NuevoJugador): Promise<Jugador> {
  const { data, error } = await supabase
    .from("jugadores")
    .insert([datos])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza los datos de un jugador.
 */
export async function actualizarJugador(
  idJugador: number,
  datos: ActualizarJugador,
): Promise<Jugador> {
  const { data, error } = await supabase
    .from("jugadores")
    .update(datos)
    .eq("id_jugador", idJugador)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Elimina un jugador de un equipo.
 */
export async function eliminarJugador(idJugador: number): Promise<void> {
  const { error } = await supabase
    .from("jugadores")
    .delete()
    .eq("id_jugador", idJugador);

  if (error) {
    throw error;
  }
}
