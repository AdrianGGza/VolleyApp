/**
 * Tipos generados a partir del esquema de exerciseapi.dev (llms.txt).
 * Estos tipos describen la respuesta de la API REST pública.
 */

export interface ExerciseApiVideo {
  url: string;
  format: string;
  resolution: string;
  aspectRatio: string;
  durationSeconds: number;
  generatedWith: string;
  generatedAt: string;
}

export interface ExerciseApiExercise {
  id: string;
  name: string;
  keywords: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  force: "push" | "pull" | "static" | null;
  level: "beginner" | "intermediate" | "advanced";
  mechanic: "compound" | "isolation" | null;
  category: string;
  instructions: string[];
  exerciseTips: string[];
  commonMistakes: string[];
  safetyInfo: string;
  overview: string;
  variations: string[];
  images: string[];
  videos: ExerciseApiVideo[];
}

export interface ExerciseApiCategory {
  category: string;
  count: number;
  description: string;
}

export interface ExerciseApiMuscleGroup {
  displayGroup: string;
  muscles: string[];
}
