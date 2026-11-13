import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { type ExerciseApiExercise } from "@/types/exerciseapi.types";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View, Pressable } from "react-native";

/**
 * Componente reutilizable para mostrar un ejercicio en listas de búsqueda,
 * variaciones y cualquier otro lugar donde aparezcan ejercicios.
 */
export default function ExerciseCard({
  ejercicio,
  onPress,
  onAddToRutina,
}: {
  ejercicio: ExerciseApiExercise;
  onPress?: () => void;
  onAddToRutina?: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/ejercicio/${ejercicio.id}` as any);
    }
  };

  const primaryMuscle = ejercicio.primaryMuscles?.[0] ?? "";
  const nivel = ejercicio.level.charAt(0).toUpperCase() + ejercicio.level.slice(1);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ejercicio ${ejercicio.name}`}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: theme.text }]}>
            {ejercicio.name}
          </Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.cardMetaItem}>
              <SymbolView
                name={{
                  ios: "dumbbell",
                  android: "fitness_center",
                  web: "fitness_center",
                }}
                size={14}
                tintColor={theme.textSecondary}
              />
              <Text style={[styles.cardMetaValue, { color: theme.textSecondary }]}>
                {ejercicio.equipment ?? "—"}
              </Text>
            </View>
            <View style={styles.cardMetaItem}>
              <SymbolView
                name={{
                  ios: "flame",
                  android: "local_fire_department",
                  web: "local_fire_department",
                }}
                size={14}
                tintColor={theme.textSecondary}
              />
              <Text style={[styles.cardMetaValue, { color: theme.textSecondary }]}>
                {ejercicio.category}
              </Text>
            </View>
            <View style={styles.cardMetaItem}>
              <SymbolView
                name={{
                  ios: "chart.bar",
                  android: "trending_up",
                  web: "trending_up",
                }}
                size={14}
                tintColor={theme.textSecondary}
              />
              <Text style={[styles.cardMetaValue, { color: theme.textSecondary }]}>
                {nivel}
              </Text>
            </View>
          </View>
          {primaryMuscle && (
            <View style={styles.cardMuscleRow}>
              <SymbolView
                name={{
                  ios: "heart.fill",
                  android: "favorite",
                  web: "favorite",
                }}
                size={14}
                tintColor={theme.error}
              />
              <Text style={[styles.cardMuscleText, { color: theme.textSecondary }]}>
                {primaryMuscle}
              </Text>
            </View>
          )}
        </View>

        {/* Botón adicional para agregar a la rutina (cuando viene desde el detalle de una rutina) */}
        {onAddToRutina && (
          <View style={styles.addToRutinaContainer}>
            <Pressable
              onPress={onAddToRutina}
              style={styles.addToRutinaButton}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${ejercicio.name} a la rutina`}
            >
              <SymbolView
                name={{
                  ios: "plus.circle.fill",
                  android: "add_circle",
                  web: "add_circle",
                }}
                size={16}
                tintColor={theme.primary}
              />
              <Text style={[styles.addToRutinaText, { color: theme.primary }]}>
                Agregar a rutina
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  cardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardMetaValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardMuscleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardMuscleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addToRutinaContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E6EE",
  },
  addToRutinaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E6EE",
  },
  addToRutinaText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
