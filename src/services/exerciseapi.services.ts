import type { ExerciseApiExercise } from "@/types/exerciseapi.types";

const BASE_URL = "https://api.exerciseapi.dev/v1";
const API_KEY = process.env.EXPO_PUBLIC_EXERCISE_API_KEY;

if (!API_KEY) {
  throw new Error(
    "Falta la variable EXPO_PUBLIC_EXERCISE_API_KEY en .env.local",
  );
}

const headers = { "X-API-Key": API_KEY } as Record<string, string>;

/**
 * Caché local con TTL de 24 horas usando AsyncStorage.
 * Los datos de ejercicio cambian poco, así que evitamos llamadas redundantes a la API.
 */
const CACHE_KEY_EXERCISES = "exerciseapi:exercises";
const CACHE_KEY_CATEGORIES = "exerciseapi:categories";
const CACHE_KEY_MUSCLES = "exerciseapi:muscles";
const CACHE_KEY_EQUIPMENT = "exerciseapi:equipment";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Si falla el almacenamiento, no bloqueamos la app
  }
}

export interface ExerciseApiError {
  code: string;
  message: string;
  hint: string;
  docs_url: string;
  details: Record<string, unknown>;
}

function buildError(error: unknown): ExerciseApiError {
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    (error as Record<string, unknown>).error
  ) {
    const { error: apiError } = error as Record<
      string,
      {
        code: string;
        message: string;
        hint: string;
        docs_url: string;
        details: Record<string, unknown>;
      }
    >;
    return {
      code: apiError.code,
      message: apiError.message,
      hint: apiError.hint,
      docs_url: apiError.docs_url,
      details: apiError.details,
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: String(error),
    hint: "Revisa tu conexión a internet e intenta nuevamente.",
    docs_url: "",
    details: {},
  };
}

/**
 * Obtiene ejercicios con búsqueda y filtros.
 * Parámetros: q, category, muscle, equipment, level, force, mechanic, limit, offset
 */
export async function obtenerEjerciciosApi(
  params?: {
    q?: string;
    category?: string;
    muscle?: string;
    equipment?: string;
    level?: string;
    force?: string;
    mechanic?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ data: ExerciseApiExercise[]; total?: number | null }> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.muscle) searchParams.set("muscle", params.muscle);
  if (params?.equipment) searchParams.set("equipment", params.equipment);
  if (params?.level) searchParams.set("level", params.level);
  if (params?.force) searchParams.set("force", params.force);
  if (params?.mechanic) searchParams.set("mechanic", params.mechanic);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const url = `${BASE_URL}/exercises?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const body = (await response.json()) as Record<string, unknown>;
      throw buildError(body);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const rawData = result.data;
    const data = (rawData ?? []) as unknown as ExerciseApiExercise[];
    const total = result.total as number | null | undefined;

    return { data, total: total ?? null };
  } catch (error) {
    if ((error as ExerciseApiError).code) {
      throw error;
    }
    throw buildError(error);
  }
}

/**
 * Obtiene un ejercicio por su ID.
 */
export async function obtenerEjercicioApi(
  id: string,
): Promise<ExerciseApiExercise> {
  const url = `${BASE_URL}/exercises/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const body = (await response.json()) as Record<string, unknown>;
      throw buildError(body);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const data = result.data as ExerciseApiExercise;

    return data;
  } catch (error) {
    if ((error as ExerciseApiError).code) {
      throw error;
    }
    throw buildError(error);
  }
}

/**
 * Obtiene el catálogo de categorías (con caché 24h).
 */
export async function obtenerCategoriasApi(): Promise<
  Array<{ category: string; count: number; description: string }>
> {
  const cached = await getCache(CACHE_KEY_CATEGORIES) as Array<{
    category: string;
    count: number;
    description: string;
  }> | null;
  if (cached) return cached;

  const url = `${BASE_URL}/categories`;
  try {
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const body = (await response.json()) as Record<string, unknown>;
      throw buildError(body);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const rawCategories = result.data;
    const data = (rawCategories ?? []) as Array<{
      category: string;
      count: number;
      description: string;
    }>;

    await setCache(CACHE_KEY_CATEGORIES, data);
    return data;
  } catch (error) {
    if ((error as ExerciseApiError).code) {
      throw error;
    }
    throw buildError(error);
  }
}

/**
 * Obtiene grupos musculares y nombres anatómicos (con caché 24h).
 */
export async function obtenerMúsculosApi(): Promise<
  Array<{ displayGroup: string; muscles: string[] }>
> {
  const cached = await getCache(CACHE_KEY_MUSCLES) as Array<{
    displayGroup: string;
    muscles: string[];
  }> | null;
  if (cached) return cached;

  const url = `${BASE_URL}/muscles`;
  try {
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const body = (await response.json()) as Record<string, unknown>;
      throw buildError(body);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const rawMuscles = result.data;
    const data = (rawMuscles ?? []) as Array<{
      displayGroup: string;
      muscles: string[];
    }>;

    await setCache(CACHE_KEY_MUSCLES, data);
    return data;
  } catch (error) {
    if ((error as ExerciseApiError).code) {
      throw error;
    }
    throw buildError(error);
  }
}

/**
 * Obtiene lista de equipamiento (con caché 24h).
 */
export async function obtenerEquipamientoApi(): Promise<string[]> {
  const cached = await getCache(CACHE_KEY_EQUIPMENT) as string[] | null;
  if (cached) return cached;

  const url = `${BASE_URL}/equipment`;
  try {
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const body = (await response.json()) as Record<string, unknown>;
      throw buildError(body);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const rawEquipment = result.data;
    const data = (rawEquipment ?? []) as string[];

    await setCache(CACHE_KEY_EQUIPMENT, data);
    return data;
  } catch (error) {
    if ((error as ExerciseApiError).code) {
      throw error;
    }
    throw buildError(error);
  }
}
