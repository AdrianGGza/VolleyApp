import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database.types";

export type Ejercicio = Database["public"]["Tables"]["ejercicios"]["Row"];
export type NuevoEjercicio = Omit<
  Database["public"]["Tables"]["ejercicios"]["Insert"],
  "id_entrenador" | "id_ejercicios"
>;
export type ActualizarEjercicio = Database["public"]["Tables"]["ejercicios"]["Update"];

/**
 * Obtiene todos los ejercicios visibles para el entrenador logueado.
 * RLS devuelve los globales (id_entrenador = NULL) y los personalizados del entrenador.
 */
export async function obtenerEjercicios(): Promise<Ejercicio[]> {
  const { data, error } = await supabase
    .from("ejercicios")
    .select("*")
    .order("categoria_ejercicios", { ascending: true })
    .order("nombre_ejercicios", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Crea un ejercicio personalizado del entrenador.
 * IMPORTANTE: No se envía id_entrenador; la base lo asigna con auth.uid().
 * Los ejercicios globales (id_entrenador NULL) se siembran por SQL, no desde la app.
 */
export async function crearEjercicio(datos: NuevoEjercicio): Promise<Ejercicio> {
  const { data, error } = await supabase
    .from("ejercicios")
    .insert([datos as unknown as Database["public"]["Tables"]["ejercicios"]["Insert"]])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza un ejercicio personalizado.
 * Si el ejercicio es global (id_entrenador NULL), RLS devuelve 0 filas sin error.
 */
export async function actualizarEjercicio(
  idEjercicio: number,
  datos: ActualizarEjercicio,
): Promise<Ejercicio> {
  const { data, error } = await supabase
    .from("ejercicios")
    .update(datos)
    .eq("id_ejercicios", idEjercicio)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Elimina un ejercicio personalizado.
 * Si el ejercicio es global (id_entrenador NULL), RLS devuelve 0 filas sin error.
 */
export async function eliminarEjercicio(idEjercicio: number): Promise<void> {
  const { error } = await supabase
    .from("ejercicios")
    .delete()
    .eq("id_ejercicios", idEjercicio);

  if (error) {
    throw error;
  }
}
