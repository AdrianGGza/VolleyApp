import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type RutinaEjercicio = Database["public"]["Tables"]["rutina_ejercicios"]["Row"];
export type NuevaRutinaEjercicio = Database["public"]["Tables"]["rutina_ejercicios"]["Insert"];
export type ActualizarRutinaEjercicio = Database["public"]["Tables"]["rutina_ejercicios"]["Update"];

/**
 * Ejercicio dentro de una rutina, con los datos del ejercicio incluidos (join).
 */
export type RutinaEjercicioConDetalle = RutinaEjercicio & {
  ejercicios: {
    id_ejercicios: number;
    nombre_ejercicios: string | null;
    categoria_ejercicios: string | null;
    id_entrenador: string | null;
  } | null;
};

/**
 * Obtiene los ejercicios asignados a una rutina, con nombre y categoría del ejercicio.
 * Ordenados por el campo `orden`.
 */
export async function obtenerEjerciciosDeRutina(
  idRutina: number,
): Promise<RutinaEjercicioConDetalle[]> {
  const { data, error } = await supabase
    .from("rutina_ejercicios")
    .select("*, ejercicios(id_ejercicios, nombre_ejercicios, categoria_ejercicios, id_entrenador)")
    .eq("id_rutina", idRutina)
    .order("orden", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as RutinaEjercicioConDetalle[]) ?? [];
}

/**
 * Agrega un ejercicio a una rutina con sus series, repeticiones y orden.
 */
export async function agregarEjercicioARutina(
  datos: NuevaRutinaEjercicio,
): Promise<RutinaEjercicio> {
  const { data, error } = await supabase
    .from("rutina_ejercicios")
    .insert([datos])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza series, repeticiones u orden de un ejercicio dentro de una rutina.
 */
export async function actualizarEjercicioEnRutina(
  idRutina: number,
  idEjercicio: number,
  datos: Omit<ActualizarRutinaEjercicio, "id_rutina" | "id_ejercicios">,
): Promise<RutinaEjercicio> {
  const { data, error } = await supabase
    .from("rutina_ejercicios")
    .update(datos)
    .eq("id_rutina", idRutina)
    .eq("id_ejercicios", idEjercicio)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Quita un ejercicio de una rutina (no elimina el ejercicio en sí).
 */
export async function quitarEjercicioDeRutina(
  idRutina: number,
  idEjercicio: number,
): Promise<void> {
  const { error } = await supabase
    .from("rutina_ejercicios")
    .delete()
    .eq("id_rutina", idRutina)
    .eq("id_ejercicios", idEjercicio);

  if (error) {
    throw error;
  }
}
