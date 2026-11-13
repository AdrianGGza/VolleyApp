import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  obtenerCategoriasApi,
  obtenerEjerciciosApi,
  obtenerMúsculosApi,
  type ExerciseApiError,
} from "@/services/exerciseapi.services";
import {
  agregarEjercicioARutina,
  type NuevaRutinaEjercicio,
} from "@/services/rutina-ejercicios.services";
import { crearEjercicio } from "@/services/ejercicios.services";
import type { ExerciseApiExercise } from "@/types/exerciseapi.types";
import ExerciseCard from "@/components/exercise-card";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
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

const DEBOUNCE_MS = 250;

export default function EjerciciosSearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { idRutina } = useLocalSearchParams<{ idRutina: string }>();

  const [ejercicios, setEjercicios] = useState<ExerciseApiExercise[]>([]);
  const [categorias, setCategorias] = useState<Array<{
    category: string;
    count: number;
    description: string;
  }>>([]);
  const [musculos, setMusculos] = useState<Array<{
    displayGroup: string;
    muscles: string[];
  }>>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<ExerciseApiError | null>(null);

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);
  const [musculoSeleccionado, setMusculoSeleccionado] = useState<
    string | null
  >(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal de agregar ejercicio a la rutina
  const [modalAgregarARutinaVisible, setModalAgregarARutinaVisible] =
    useState(false);
  const [ejercicioParaAgregar, setEjercicioParaAgregar] = useState<
    ExerciseApiExercise | null
  >(null);
  const [series, setSeries] = useState("");
  const [repeticiones, setRepeticiones] = useState("");
  const [orden, setOrden] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorAgregar, setErrorAgregar] = useState<string | null>(null);

  const cargarReferencias = useCallback(async () => {
    try {
      const [cats, muscs] = await Promise.all([
        obtenerCategoriasApi(),
        obtenerMúsculosApi(),
      ]);
      setCategorias(cats);
      setMusculos(muscs);
    } catch (err) {
      const apiError = err as ExerciseApiError;
      Alert.alert(
        "Error",
        `${apiError.hint ?? "No se pudieron cargar los filtros."}`,
      );
    }
  }, []);

  const buscarEjercicios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await obtenerEjerciciosApi({
        q: filtroBusqueda || undefined,
        category: categoriaSeleccionada || undefined,
        muscle: musculoSeleccionado || undefined,
        limit: 20,
        offset: 0,
      });
      setEjercicios(resultado.data);
    } catch (err) {
      const apiError = err as ExerciseApiError;
      setError(apiError);
      Alert.alert(
        "Error",
        `${apiError.hint ?? "No se pudieron cargar los ejercicios."}`,
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [filtroBusqueda, categoriaSeleccionada, musculoSeleccionado]);

  const onRefresh = () => {
    setRefrescando(true);
    buscarEjercicios();
  };

  useEffect(() => {
    cargarReferencias();
  }, [cargarReferencias]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      buscarEjercicios();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filtroBusqueda, categoriaSeleccionada, musculoSeleccionado, buscarEjercicios]);

  const limpiarFiltros = () => {
    setFiltroBusqueda("");
    setCategoriaSeleccionada(null);
    setMusculoSeleccionado(null);
  };

  const abrirModalAgregarARutina = (ejercicio: ExerciseApiExercise) => {
    setEjercicioParaAgregar(ejercicio);
    setSeries("");
    setRepeticiones("");
    setOrden("");
    setErrorAgregar(null);
    setModalAgregarARutinaVisible(true);
  };

  const handleAgregarEjercicioARutina = async () => {
    setErrorAgregar(null);
    if (!ejercicioParaAgregar || !idRutina) return;

    const seriesNum = parseInt(series.trim(), 10);
    const repeticionesNum = parseInt(repeticiones.trim(), 10);
    const ordenNum = parseInt(orden.trim(), 10);

    if (Number.isNaN(seriesNum) || seriesNum <= 0) {
      setErrorAgregar("Ingresa series válidas.");
      return;
    }
    if (Number.isNaN(repeticionesNum) || repeticionesNum <= 0) {
      setErrorAgregar("Ingresa repeticiones válidas.");
      return;
    }
    if (Number.isNaN(ordenNum) || ordenNum <= 0) {
      setErrorAgregar("Ingresa un orden válido.");
      return;
    }

    setGuardando(true);
    try {
      // Paso 1: Crear el ejercicio personalizado en Supabase (obtiene id_ejercicios real)
      const ejercicioCreado = await crearEjercicio({
        nombre_ejercicios: ejercicioParaAgregar.name,
        categoria_ejercicios: ejercicioParaAgregar.category || null,
      });

      // Paso 2: Agregar a la rutina con el id_ejercicios real generado por Supabase
      await agregarEjercicioARutina({
        id_rutina: idRutina as unknown as number,
        id_ejercicios: ejercicioCreado.id_ejercicios,
        series: seriesNum,
        repeticiones: repeticionesNum,
        orden: ordenNum,
      });

      setModalAgregarARutinaVisible(false);
      router.push(`/rutina/${idRutina}`);
    } catch (err) {
      setErrorAgregar("No se pudo agregar el ejercicio a la rutina.");
    } finally {
      setGuardando(false);
    }
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.primary }]}>
              BIBLIOTECA DE EJERCICIOS
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Buscar ejercicios
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {ejercicios.length === 1
                ? "1 ejercicio encontrado"
                : `${ejercicios.length} ejercicios encontrados`}
            </Text>
          </View>
        </View>

        {/* Estado de carga inicial */}
        {cargando && ejercicios.length === 0 && !error ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando biblioteca…
            </Text>
          </View>
        ) : null}

        {/* Estado de error */}
        {error && ejercicios.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: theme.error }]}>
              Error al cargar
            </Text>
            <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
              {error.hint ?? error.message}
            </Text>
            <Pressable
              onPress={buscarEjercicios}
              style={[
                styles.retryButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.retryButtonText, { color: theme.primaryText }]}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Buscador */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
            placeholder="Buscar ejercicio (ej. press, sentadilla…)"
            placeholderTextColor={theme.textSecondary}
            value={filtroBusqueda}
            onChangeText={setFiltroBusqueda}
          />
          <SymbolView
            name={{
              ios: "magnifyingglass",
              android: "search",
              web: "search",
            }}
            size={18}
            tintColor={theme.textSecondary}
            style={styles.searchIcon}
          />
        </View>

        {/* Filtros por categoría */}
        <View style={styles.filtroContainer}>
          <Text style={[styles.filtroLabel, { color: theme.text }]}>
            Categoría
          </Text>
          <View style={styles.chipsRow}>
            <Pressable
              onPress={() => setCategoriaSeleccionada(null)}
              style={[
                styles.chip,
                { borderColor: theme.border },
                categoriaSeleccionada === null && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[
                styles.chipText,
                {
                  color: categoriaSeleccionada === null
                    ? theme.primaryText
                    : theme.textSecondary,
                  fontWeight: categoriaSeleccionada === null ? "700" : "500",
                },
              ]}>
                Todas
              </Text>
            </Pressable>
            {categorias.map((cat) => (
              <Pressable
                key={cat.category}
                onPress={() =>
                  setCategoriaSeleccionada(
                    categoriaSeleccionada === cat.category ? null : cat.category,
                  )
                }
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  categoriaSeleccionada === cat.category && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text style={[
                  styles.chipText,
                  {
                    color: categoriaSeleccionada === cat.category
                      ? theme.primaryText
                      : theme.textSecondary,
                    fontWeight:
                      categoriaSeleccionada === cat.category ? "700" : "500",
                  },
                ]}>
                  {cat.category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Filtros por músculo */}
        <View style={styles.filtroContainer}>
          <Text style={[styles.filtroLabel, { color: theme.text }]}>
            Músculo
          </Text>
          <View style={styles.chipsRow}>
            <Pressable
              onPress={() => setMusculoSeleccionado(null)}
              style={[
                styles.chip,
                { borderColor: theme.border },
                musculoSeleccionado === null && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[
                styles.chipText,
                {
                  color: musculoSeleccionado === null
                    ? theme.primaryText
                    : theme.textSecondary,
                  fontWeight: musculoSeleccionado === null ? "700" : "500",
                },
              ]}>
                Todos
              </Text>
            </Pressable>
            {musculos.map((m) => (
              <Pressable
                key={m.displayGroup}
                onPress={() =>
                  setMusculoSeleccionado(
                    musculoSeleccionado === m.displayGroup
                      ? null
                      : m.displayGroup,
                  )
                }
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  musculoSeleccionado === m.displayGroup && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text style={[
                  styles.chipText,
                  {
                    color: musculoSeleccionado === m.displayGroup
                      ? theme.primaryText
                      : theme.textSecondary,
                    fontWeight:
                      musculoSeleccionado === m.displayGroup ? "700" : "500",
                  },
                ]}>
                  {m.displayGroup}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Botón limpiar filtros si hay alguno activo */}
        {(filtroBusqueda || categoriaSeleccionada || musculoSeleccionado) && (
          <Pressable
            onPress={limpiarFiltros}
            style={styles.clearFiltersButton}
          >
            <Text style={[styles.clearFiltersText, { color: theme.primary }]}>
              Limpiar filtros
            </Text>
          </Pressable>
        )}

        {/* Resultados */}
        {ejercicios.length === 0 && !cargando && !error ? (
          <View style={styles.emptyStateContainer}>
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search_off",
                web: "search_off",
              }}
              size={48}
              tintColor={theme.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No se encontraron ejercicios
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              Intenta con otro término de búsqueda o ajusta los filtros.
            </Text>
          </View>
        ) : (
          <View style={styles.resultadosContainer}>
            {ejercicios.map((ejercicio) => (
              <ExerciseCard
                key={ejercicio.id}
                ejercicio={ejercicio}
                onAddToRutina={
                  idRutina ? () => abrirModalAgregarARutina(ejercicio) : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Agregar ejercicio a la rutina */}
      {idRutina && (
        <Modal
          visible={modalAgregarARutinaVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!guardando) setModalAgregarARutinaVisible(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => {
                if (!guardando) setModalAgregarARutinaVisible(false);
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
                    AGREGAR A RUTINA
                  </Text>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {ejercicioParaAgregar?.name ?? "Ejercicio"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setModalAgregarARutinaVisible(false)}
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

              {errorAgregar ? (
                <View
                  style={[
                    styles.modalErrorContainer,
                    { backgroundColor: "rgba(255, 59, 48, 0.1)" },
                  ]}
                >
                  <Text style={[styles.modalErrorText, { color: theme.error }]}>
                    {errorAgregar}
                  </Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Series *
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
                  placeholder="3"
                  placeholderTextColor={theme.textSecondary}
                  value={series}
                  onChangeText={setSeries}
                  keyboardType="numeric"
                  editable={!guardando}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Repeticiones *
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
                  placeholder="12"
                  placeholderTextColor={theme.textSecondary}
                  value={repeticiones}
                  onChangeText={setRepeticiones}
                  keyboardType="numeric"
                  editable={!guardando}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Orden *
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
                  placeholder="1"
                  placeholderTextColor={theme.textSecondary}
                  value={orden}
                  onChangeText={setOrden}
                  keyboardType="numeric"
                  editable={!guardando}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setModalAgregarARutinaVisible(false)}
                  disabled={guardando}
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAgregarEjercicioARutina}
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
                    <Text style={[styles.confirmButtonText, { color: theme.primaryText }]}>
                      Agregar a la rutina
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
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
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: Spacing.four,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  filtroContainer: {
    marginBottom: Spacing.three,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  clearFiltersButton: {
    alignItems: "center",
    marginVertical: Spacing.two,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultadosContainer: {
    gap: Spacing.three,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: Spacing.six,
    gap: 12,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.two,
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.three,
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
    marginBottom: Spacing.three,
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
    marginTop: Spacing.three,
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
