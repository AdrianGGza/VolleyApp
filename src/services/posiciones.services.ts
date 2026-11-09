import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Posicion = Database["public"]["Tables"]["posiciones"]["Row"];

/**
 * Obtiene el catálogo de posiciones de voleibol (solo lectura).
 * IMPORTANTE: No se debe hacer INSERT ni UPDATE sobre esta tabla (restringido por RLS).
 */
export async function obtenerPosiciones(): Promise<Posicion[]> {
  const { data, error } = await supabase
    .from("posiciones")
    .select("*")
    .order("id_posicion", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
