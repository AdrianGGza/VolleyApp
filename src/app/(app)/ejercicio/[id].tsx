import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { obtenerEjercicioApi, type ExerciseApiError } from "@/services/exerciseapi.services";
import type { ExerciseApiExercise } from "@/types/exerciseapi.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EjercicioDetalleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [ejercicio, setEjercicio] = useState<ExerciseApiExercise | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<ExerciseApiError | null>(null);

  const cargarEjercicio = useCallback(async () => {
    if (!id) return;

    setCargando(true);
    setError(null);
    try {
      const data = await obtenerEjercicioApi(id);
      setEjercicio(data);
    } catch (err) {
      const apiError = err as ExerciseApiError;
      setError(apiError);
      if (apiError.code === "NOT_FOUND") {
        Alert.alert(
          "Ejercicio no encontrado",
          apiError.hint ?? "Este ejercicio ya no está disponible.",
        );
      } else {
        Alert.alert(
          "Error",
          apiError.hint ?? "No se pudo cargar el ejercicio.",
        );
      }
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarEjercicio();
  }, [cargarEjercicio]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarEjercicio();
  };

  const navegarAVariacion = (nombreVariacion: string) => {
    router.push(`/ejercicios?q=${encodeURIComponent(nombreVariacion)}`);
  };

  if (!id) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.errorCentered}>
          <Text style={[styles.errorTitle, { color: theme.error }]}>
            ID de ejercicio no válido
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Estado de carga */}
        {cargando && !ejercicio && !error ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando ejercicio…
            </Text>
          </View>
        ) : null}

        {/* Estado de error */}
        {error && !ejercicio ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: theme.error }]}>
              Error al cargar
            </Text>
            <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
              {error.hint ?? error.message}
            </Text>
          </View>
        ) : null}

        {/* Contenido del ejercicio */}
        {ejercicio && (
          <>
            {/* Header con nombre y metadata */}
            <View style={styles.header}>
              <Text style={[styles.kicker, { color: theme.primary }]}>
                EJERCICIO
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {ejercicio.name}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                    CATEGORÍA
                  </Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>
                    {ejercicio.category}
                  </Text>
                </View>
                <View style={[styles.metaItem, { borderLeftColor: theme.border }]}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                    NIVEL
                  </Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>
                    {ejercicio.level === "beginner"
                      ? "Principiante"
                      : ejercicio.level === "intermediate"
                      ? "Intermedio"
                      : "Avanzado"}
                  </Text>
                </View>
                <View style={[styles.metaItem, { borderLeftColor: theme.border }]}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                    EQUIPAMIENTO
                  </Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>
                    {ejercicio.equipment ?? "—"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Overview */}
            {ejercicio.overview && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Descripción
                </Text>
                <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                  {ejercicio.overview}
                </Text>
              </View>
            )}

            {/* Músculos */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Músculos trabajados
              </Text>
              <View style={styles.musclesRow}>
                {ejercicio.primaryMuscles.length > 0 && (
                  <View style={styles.muscleGroup}>
                    <Text style={[styles.muscleLabel, { color: theme.textSecondary }]}>
                      PRIMARIOS
                    </Text>
                    <View style={styles.musclesList}>
                      {ejercicio.primaryMuscles.map((m, i) => (
                        <Text
                          key={i}
                          style={[styles.muscleChip, { color: theme.text }]}
                        >
                          {m}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
                {ejercicio.secondaryMuscles.length > 0 && (
                  <View style={styles.muscleGroup}>
                    <Text style={[styles.muscleLabel, { color: theme.textSecondary }]}>
                      SECUNDARIOS
                    </Text>
                    <View style={styles.musclesList}>
                      {ejercicio.secondaryMuscles.map((m, i) => (
                        <Text
                          key={i}
                          style={[styles.muscleChip, { color: theme.text }]}
                        >
                          {m}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Instrucciones */}
            {ejercicio.instructions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Instrucciones
                </Text>
                {ejercicio.instructions.map((step, i) => (
                  <View key={i} style={styles.instructionItem}>
                    <Text style={[styles.instructionNumber, { color: theme.primary }]}>
                      {i + 1}
                    </Text>
                    <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips */}
            {ejercicio.exerciseTips.length > 0 && (
              <View style={[styles.callout, { backgroundColor: "rgba(29, 99, 255, 0.1)" }]}>
                <Text style={[styles.calloutTitle, { color: theme.accent }]}>
                  💡 Consejos de técnica
                </Text>
                {ejercicio.exerciseTips.map((tip, i) => (
                  <Text key={i} style={[styles.calloutItem, { color: theme.textSecondary }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}

            {/* Errores comunes */}
            {ejercicio.commonMistakes.length > 0 && (
              <View style={[styles.callout, { backgroundColor: "rgba(255, 59, 48, 0.1)" }]}>
                <Text style={[styles.calloutTitle, { color: theme.error }]}>
                  ⚠️ Errores comunes
                </Text>
                {ejercicio.commonMistakes.map((mistake, i) => (
                  <Text key={i} style={[styles.calloutItem, { color: theme.textSecondary }]}>
                    • {mistake}
                  </Text>
                ))}
              </View>
            )}

            {/* Seguridad */}
            {ejercicio.safetyInfo && (
              <View style={[styles.callout, { backgroundColor: "rgba(224, 158, 0, 0.1)" }]}>
                <Text style={[styles.calloutTitle, { color: theme.primary }]}>
                  🛡️ Seguridad
                </Text>
                <Text style={[styles.calloutItem, { color: theme.textSecondary }]}>
                  {ejercicio.safetyInfo}
                </Text>
              </View>
            )}

            {/* Variaciones */}
            {ejercicio.variations.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Variaciones relacionadas
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.variationsScroll}
                >
                  {ejercicio.variations.map((variacion) => (
                    <Pressable
                      key={variacion}
                      onPress={() => navegarAVariacion(variacion)}
                      style={styles.variationCard}
                    >
                      <Text style={[styles.variationName, { color: theme.text }]}>
                        {variacion}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.five,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E6EE",
    paddingTop: 12,
  },
  metaItem: {
    flex: 1,
    paddingRight: 12,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  musclesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  muscleGroup: {
    flex: 1,
    minWidth: 140,
  },
  muscleLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  musclesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  muscleChip: {
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: "#EDF1F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E6EE",
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: "800",
    width: 24,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  callout: {
    padding: 14,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  calloutItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  variationsScroll: {
    gap: 10,
    paddingRight: 4,
  },
  variationCard: {
    backgroundColor: "#EDF1F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E6EE",
  },
  variationName: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: Spacing.six,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
  },
  errorContainer: {
    paddingVertical: Spacing.six,
    alignItems: "center",
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.two,
  },
  errorCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.five,
  },
});
