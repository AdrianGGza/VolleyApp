import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  crearRutina,
  eliminarRutina,
  obtenerRutinas,
  type Rutina,
} from "@/services/rutinas.services";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RutinasScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Estado del modal de creación
  const [modalVisible, setModalVisible] = useState(false);
  const [nombreRutina, setNombreRutina] = useState("");
  const [descripcionRutina, setDescripcionRutina] = useState("");
  const [categoriaRutina, setCategoriaRutina] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarRutinas = useCallback(async () => {
    try {
      const data = await obtenerRutinas();
      setRutinas(data);
    } catch {
      Alert.alert(
        "Error",
        "No se pudieron cargar las rutinas. Verifica tu conexión a internet.",
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarRutinas();
  }, [cargarRutinas]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarRutinas();
  };

  const handleCrearRutina = async () => {
    setErrorModal(null);
    const nombreLimpio = nombreRutina.trim();
    const descripcionLimpia = descripcionRutina.trim();
    const categoriaLimpia = categoriaRutina.trim();

    if (!nombreLimpio) {
      setErrorModal("El nombre de la rutina es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const nueva = await crearRutina({
        nombre_rutina: nombreLimpio,
        descripcion_rutina: descripcionLimpia || null,
        categoria_rutina: categoriaLimpia || null,
      });

      setRutinas((prev) => [nueva, ...prev]);
      setNombreRutina("");
      setDescripcionRutina("");
      setCategoriaRutina("");
      setModalVisible(false);
    } catch {
      setErrorModal("No se pudo crear la rutina. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (rutina: Rutina) => {
    Alert.alert(
      "Eliminar rutina",
      `¿Estás seguro de que deseas eliminar "${rutina.nombre_rutina}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarRutina(rutina.id_rutina);
              setRutinas((prev) =>
                prev.filter((item) => item.id_rutina !== rutina.id_rutina),
              );
            } catch {
              Alert.alert(
                "Error",
                "No se pudo eliminar la rutina. Intenta nuevamente.",
              );
            }
          },
        },
      ],
    );
  };

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
        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.primary }]}>
              ENTRENAMIENTO
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>Rutinas</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {rutinas.length === 1
                ? "1 rutina registrada"
                : `${rutinas.length} rutinas registradas`}
            </Text>
          </View>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Crear nueva rutina"
          >
            <SymbolView
              name={{ ios: "plus", android: "add", web: "add" }}
              size={18}
              tintColor={theme.primaryText}
            />
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              Nueva
            </Text>
          </Pressable>
        </View>

        {/* Estado de carga */}
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando tus rutinas…
            </Text>
          </View>
        ) : rutinas.length === 0 ? (
          /* Estado Vacío */
          <View
            style={[
              styles.emptyStateContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <SymbolView
                name={{
                  ios: "dumbbell",
                  android: "fitness_center",
                  web: "fitness_center",
                }}
                size={36}
                tintColor={theme.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aún no tienes rutinas
            </Text>
            <Text
              style={[styles.emptyDescription, { color: theme.textSecondary }]}
            >
              Crea tu primera rutina de entrenamiento y asigna ejercicios para
              planificar tus sesiones.
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                styles.emptyActionButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyActionText,
                  { color: theme.primaryText },
                ]}
              >
                Crear primera rutina
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Lista de Rutinas */
          <View style={styles.rutinasList}>
            {rutinas.map((rutina) => (
              <Pressable
                key={rutina.id_rutina}
                onPress={() =>
                  router.push(`/rutina/${rutina.id_rutina}` as any)
                }
                style={({ pressed }) => [
                  styles.rutinaCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: pressed ? 0.92 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Ver ejercicios de la rutina ${rutina.nombre_rutina}`}
              >
                <View style={styles.rutinaCardTop}>
                  <View style={styles.rutinaBadgeContainer}>
                    <View
                      style={[
                        styles.rutinaAccentBar,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                    <View style={styles.rutinaInfo}>
                      <Text
                        style={[styles.rutinaName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {rutina.nombre_rutina}
                      </Text>
                      {rutina.categoria_rutina ? (
                        <View
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: theme.backgroundElement },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {rutina.categoria_rutina}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      confirmarEliminar(rutina);
                    }}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                    hitSlop={8}
                    accessibilityLabel="Eliminar rutina"
                  >
                    <SymbolView
                      name={{
                        ios: "trash",
                        android: "delete",
                        web: "delete",
                      }}
                      size={18}
                      tintColor={theme.error}
                    />
                  </Pressable>
                </View>

                {/* Descripción truncada */}
                {rutina.descripcion_rutina ? (
                  <View style={styles.descripcionContainer}>
                    <Text
                      style={[styles.descripcionText, { color: theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {rutina.descripcion_rutina}
                    </Text>
                  </View>
                ) : null}

                {/* Pie de tarjeta con acceso a ejercicios */}
                <View
                  style={[
                    styles.rutinaCardFooter,
                    { borderTopColor: theme.border },
                  ]}
                >
                  <View style={styles.ejerciciosRow}>
                    <SymbolView
                      name={{
                        ios: "dumbbell",
                        android: "fitness_center",
                        web: "fitness_center",
                      }}
                      size={16}
                      tintColor={theme.accent}
                    />
                    <Text
                      style={[
                        styles.ejerciciosText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Ver ejercicios
                    </Text>
                  </View>

                  <View style={styles.cardArrow}>
                    <SymbolView
                      name={{
                        ios: "chevron.right",
                        android: "chevron_right",
                        web: "chevron_right",
                      }}
                      size={14}
                      tintColor={theme.textSecondary}
                    />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Alta de Rutina */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardando) setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              if (!guardando) setModalVisible(false);
            }}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalPretitle, { color: theme.primary }]}>
                  NUEVO REGISTRO
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Crear rutina
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                disabled={guardando}
                hitSlop={8}
              >
                <SymbolView
                  name={{
                    ios: "xmark.circle.fill",
                    android: "close",
                    web: "close",
                  }}
                  size={24}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </View>

            {errorModal ? (
              <View
                style={[
                  styles.modalErrorContainer,
                  { backgroundColor: "rgba(255, 59, 48, 0.1)" },
                ]}
              >
                <Text style={[styles.modalErrorText, { color: theme.error }]}>
                  {errorModal}
                </Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Nombre de la rutina *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ej. Fuerza Core, Resistencia, Explosividad"
                placeholderTextColor={theme.textSecondary}
                value={nombreRutina}
                onChangeText={setNombreRutina}
                editable={!guardando}
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Descripción
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ej. Trabajo de fuerza para la parte media del cuerpo"
                placeholderTextColor={theme.textSecondary}
                value={descripcionRutina}
                onChangeText={setDescripcionRutina}
                editable={!guardando}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Categoría (opcional)
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ej. Fuerza, Resistencia, Técnica"
                placeholderTextColor={theme.textSecondary}
                value={categoriaRutina}
                onChangeText={setCategoriaRutina}
                editable={!guardando}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                disabled={guardando}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCrearRutina}
                disabled={guardando}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: guardando ? 0.6 : 1,
                  },
                ]}
              >
                {guardando ? (
                  <ActivityIndicator size="small" color={theme.primaryText} />
                ) : (
                  <Text
                    style={[
                      styles.confirmButtonText,
                      { color: theme.primaryText },
                    ]}
                  >
                    Guardar rutina
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
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
  emptyStateContainer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.five,
    alignItems: "center",
    marginTop: Spacing.three,
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: Spacing.five,
    paddingHorizontal: Spacing.two,
  },
  emptyActionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: "700",
  },
  rutinasList: {
    gap: Spacing.three,
  },
  rutinaCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  rutinaCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.four,
  },
  rutinaBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  rutinaAccentBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  rutinaInfo: {
    flex: 1,
  },
  rutinaName: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  deleteButton: {
    padding: 8,
  },
  descripcionContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: 4,
  },
  descripcionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  rutinaCardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
  },
  ejerciciosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ejerciciosText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardArrow: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalDismissArea: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.four,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.four,
  },
  modalPretitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  modalErrorContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: Spacing.three,
  },
  modalErrorText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: Spacing.four,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: Spacing.two,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
