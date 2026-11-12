import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  actualizarRutina,
  eliminarRutina,
  obtenerRutinaPorId,
  type Rutina,
} from "@/services/rutinas.services";
import {
  agregarEjercicioARutina,
  actualizarEjercicioEnRutina,
  obtenerEjerciciosDeRutina,
  quitarEjercicioDeRutina,
  type RutinaEjercicioConDetalle,
} from "@/services/rutina-ejercicios.services";
import {
  crearEjercicio,
  obtenerEjercicios,
  type Ejercicio,
} from "@/services/ejercicios.services";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function DetalleRutinaScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idRutina = Number(id);

  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [ejercicios, setEjercicios] = useState<RutinaEjercicioConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Modal de editar rutina
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [nombreRutina, setNombreRutina] = useState("");
  const [descripcionRutina, setDescripcionRutina] = useState("");
  const [categoriaRutina, setCategoriaRutina] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  // Modal de agregar ejercicio a la rutina
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState<
    Ejercicio[]
  >([]);
  const [ejerciciosEnRutina, setEjerciciosEnRutina] = useState<Set<number>>(
    new Set(),
  );
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<
    Ejercicio | null
  >(null);
  const [series, setSeries] = useState("");
  const [repeticiones, setRepeticiones] = useState("");
  const [orden, setOrden] = useState("");
  const [guardandoAgregar, setGuardandoAgregar] = useState(false);
  const [errorAgregar, setErrorAgregar] = useState<string | null>(null);
  const [modalCrearEjercicioVisible, setModalCrearEjercicioVisible] =
    useState(false);
  const [nombreNuevoEjercicio, setNombreNuevoEjercicio] = useState("");
  const [categoriaNuevoEjercicio, setCategoriaNuevoEjercicio] = useState("");
  const [guardandoNuevoEjercicio, setGuardandoNuevoEjercicio] = useState(false);
  const [errorNuevoEjercicio, setErrorNuevoEjercicio] = useState<
    string | null
  >(null);

  // Modal de editar ejercicio en la rutina
  const [modalEditarEjercicioVisible, setModalEditarEjercicioVisible] =
    useState(false);
  const [ejercicioEnEdicion, setEjercicioEnEdicion] = useState<
    RutinaEjercicioConDetalle | null
  >(null);
  const [seriesEdicion, setSeriesEdicion] = useState("");
  const [repeticionesEdicion, setRepeticionesEdicion] = useState("");
  const [ordenEdicion, setOrdenEdicion] = useState("");
  const [guardandoEdicionEjercicio, setGuardandoEdicionEjercicio] =
    useState(false);
  const [errorEdicionEjercicio, setErrorEdicionEjercicio] = useState<
    string | null
  >(null);

  const cargarDatos = useCallback(async () => {
    if (Number.isNaN(idRutina)) return;

    try {
      const [rutinaData, ejerciciosData] = await Promise.all([
        obtenerRutinaPorId(idRutina),
        obtenerEjerciciosDeRutina(idRutina),
      ]);

      setRutina(rutinaData);
      setEjercicios(ejerciciosData);
    } catch {
      Alert.alert(
        "Error",
        "No se pudieron cargar los datos de la rutina. Verifica tu conexión a internet.",
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [idRutina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  const esGlobal = (ejercicio: RutinaEjercicioConDetalle) =>
    ejercicio.ejercicios?.id_entrenador === null;

  const abrirModalEditarRutina = () => {
    setNombreRutina(rutina?.nombre_rutina ?? "");
    setDescripcionRutina(rutina?.descripcion_rutina ?? "");
    setCategoriaRutina(rutina?.categoria_rutina ?? "");
    setErrorEdicion(null);
    setModalEditarVisible(true);
  };

  const handleGuardarEdicionRutina = async () => {
    setErrorEdicion(null);
    const nombreLimpio = nombreRutina.trim();

    if (!nombreLimpio) {
      setErrorEdicion("El nombre de la rutina es obligatorio.");
      return;
    }

    setGuardandoEdicion(true);
    try {
      const actualizada = await actualizarRutina(idRutina, {
        nombre_rutina: nombreLimpio,
        descripcion_rutina: descripcionRutina.trim() || null,
        categoria_rutina: categoriaRutina.trim() || null,
      });

      setRutina(actualizada);
      setModalEditarVisible(false);
    } catch {
      setErrorEdicion("No se pudo actualizar la rutina. Intenta nuevamente.");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const confirmarEliminarRutina = () => {
    Alert.alert(
      "Eliminar rutina",
      `¿Estás seguro de que deseas eliminar "${rutina?.nombre_rutina}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarRutina(idRutina);
              router.push("/rutinas");
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

  /* ── Modal: Agregar ejercicio a la rutina ── */

  const abrirModalAgregarEjercicio = async () => {
    setEjerciciosEnRutina(
      new Set(
        ejercicios
          .map((e) => e.ejercicios?.id_ejercicios)
          .filter((id): id is number => id !== undefined),
      ),
    );
    setFiltroBusqueda("");
    setEjercicioSeleccionado(null);
    setSeries("");
    setRepeticiones("");
    setOrden("");
    setErrorAgregar(null);
    setModalAgregarVisible(true);
    try {
      const data = await obtenerEjercicios();
      setEjerciciosDisponibles(data);
    } catch {
      Alert.alert(
        "Error",
        "No se pudieron cargar los ejercicios disponibles.",
      );
    }
  };

  const ejerciciosFiltrados = ejerciciosDisponibles.filter((e) => {
    const texto = filtroBusqueda.toLowerCase();
    return (
      (e.nombre_ejercicios?.toLowerCase().includes(texto) ?? false) ||
      (e.categoria_ejercicios?.toLowerCase().includes(texto) ?? false)
    );
  });

  const seleccionarEjercicio = (ejercicio: Ejercicio) => {
    setEjercicioSeleccionado(ejercicio);
    const ordenSiguiente = (ejercicios.length + 1).toString();
    setOrden(ordenSiguiente);
  };

  const handleAgregarEjercicioARutina = async () => {
    setErrorAgregar(null);
    if (!ejercicioSeleccionado) {
      setErrorAgregar("Selecciona un ejercicio.");
      return;
    }

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

    setGuardandoAgregar(true);
    try {
      await agregarEjercicioARutina({
        id_rutina: idRutina,
        id_ejercicios: ejercicioSeleccionado.id_ejercicios,
        series: seriesNum,
        repeticiones: repeticionesNum,
        orden: ordenNum,
      });

      setModalAgregarVisible(false);
      cargarDatos();
    } catch {
      setErrorAgregar("No se pudo agregar el ejercicio a la rutina.");
    } finally {
      setGuardandoAgregar(false);
    }
  };

  const crearEjercicioPersonalizado = async () => {
    setErrorNuevoEjercicio(null);
    const nombreLimpio = nombreNuevoEjercicio.trim();
    const categoriaLimpia = categoriaNuevoEjercicio.trim();

    if (!nombreLimpio) {
      setErrorNuevoEjercicio("El nombre del ejercicio es obligatorio.");
      return;
    }

    setGuardandoNuevoEjercicio(true);
    try {
      const nuevo = await crearEjercicio({
        nombre_ejercicios: nombreLimpio,
        categoria_ejercicios: categoriaLimpia || null,
      });

      setEjerciciosDisponibles((prev) => [nuevo, ...prev]);
      setNombreNuevoEjercicio("");
      setCategoriaNuevoEjercicio("");
      setFiltroBusqueda("");
      setModalCrearEjercicioVisible(false);
      setModalAgregarVisible(true);
    } catch {
      setErrorNuevoEjercicio(
        "No se pudo crear el ejercicio personalizado. Intenta nuevamente.",
      );
    } finally {
      setGuardandoNuevoEjercicio(false);
    }
  };

  /* ── Modal: Editar ejercicio en la rutina ── */

  const abrirModalEditarEjercicio = (
    ejercicio: RutinaEjercicioConDetalle,
  ) => {
    setEjercicioEnEdicion(ejercicio);
    setSeriesEdicion(String(ejercicio.series ?? ""));
    setRepeticionesEdicion(String(ejercicio.repeticiones ?? ""));
    setOrdenEdicion(String(ejercicio.orden ?? ""));
    setErrorEdicionEjercicio(null);
    setModalEditarEjercicioVisible(true);
  };

  const handleGuardarEdicionEjercicio = async () => {
    setErrorEdicionEjercicio(null);
    if (!ejercicioEnEdicion) return;

    const seriesNum = parseInt(seriesEdicion.trim(), 10);
    const repeticionesNum = parseInt(repeticionesEdicion.trim(), 10);
    const ordenNum = parseInt(ordenEdicion.trim(), 10);

    if (Number.isNaN(seriesNum) || seriesNum <= 0) {
      setErrorEdicionEjercicio("Ingresa series válidas.");
      return;
    }
    if (Number.isNaN(repeticionesNum) || repeticionesNum <= 0) {
      setErrorEdicionEjercicio("Ingresa repeticiones válidas.");
      return;
    }

    setGuardandoEdicionEjercicio(true);
    try {
      await actualizarEjercicioEnRutina(idRutina, ejercicioEnEdicion.ejercicios!.id_ejercicios, {
        series: seriesNum,
        repeticiones: repeticionesNum,
        orden: ordenNum ?? ejercicioEnEdicion.orden,
      });

      setModalEditarEjercicioVisible(false);
      cargarDatos();
    } catch {
      setErrorEdicionEjercicio(
        "No se pudo actualizar el ejercicio en la rutina.",
      );
    } finally {
      setGuardandoEdicionEjercicio(false);
    }
  };

  const confirmarQuitarEjercicio = (
    ejercicio: RutinaEjercicioConDetalle,
  ) => {
    Alert.alert(
      "Quitar ejercicio",
      `¿Deseas quitar "${ejercicio.ejercicios?.nombre_ejercicios}" de esta rutina? El ejercicio no se eliminará del catálogo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            try {
              await quitarEjercicioDeRutina(
                idRutina,
                ejercicio.ejercicios!.id_ejercicios,
              );
              cargarDatos();
            } catch {
              Alert.alert(
                "Error",
                "No se pudo quitar el ejercicio de la rutina.",
              );
            }
          },
        },
      ],
    );
  };

  if (Number.isNaN(idRutina)) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.errorCentered}>
          <Text style={[styles.errorTitle, { color: theme.error }]}>
            Identificador de rutina inválido
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backActionButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.backActionText, { color: theme.primaryText }]}>
              Volver a rutinas
            </Text>
          </Pressable>
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
        {/* Barra de navegación */}
        <View style={styles.topNavigation}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver a lista de rutinas"
          >
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "arrow_back",
                web: "arrow_back",
              }}
              size={18}
              tintColor={theme.primary}
            />
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              Rutinas
            </Text>
          </Pressable>
        </View>

        {/* Estado de carga */}
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando rutina…
            </Text>
          </View>
        ) : (
          <>
            {/* Encabezado de la rutina */}
            <View style={styles.header}>
              <View style={styles.rutinaHeaderInfo}>
                <Text style={[styles.kicker, { color: theme.accent }]}>
                  RUTINA DE ENTRENAMIENTO
                </Text>
                <Text style={[styles.title, { color: theme.text }]}>
                  {rutina?.nombre_rutina ?? "Cargando…"}
                </Text>
                <View style={styles.headerTagsRow}>
                  {rutina?.categoria_rutina ? (
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: theme.backgroundElement },
                      ]}
                    >
                      <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                        {rutina.categoria_rutina}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {rutina?.descripcion_rutina ? (
                  <Text style={[styles.descripcion, { color: theme.textSecondary }]}>
                    {rutina.descripcion_rutina}
                  </Text>
                ) : null}
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={abrirModalEditarRutina}
                  style={({ pressed }) => [
                    styles.actionIconButton,
                    { opacity: pressed ? 0.5 : 1 },
                  ]}
                  hitSlop={8}
                  accessibilityLabel="Editar rutina"
                >
                  <SymbolView
                    name={{
                      ios: "pencil",
                      android: "edit",
                      web: "edit",
                    }}
                    size={17}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>

                <Pressable
                  onPress={confirmarEliminarRutina}
                  style={({ pressed }) => [
                    styles.actionIconButton,
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
                    size={17}
                    tintColor={theme.error}
                  />
                </Pressable>
              </View>
            </View>

            {/* Botón agregar ejercicio */}
            <Pressable
              onPress={abrirModalAgregarEjercicio}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Agregar ejercicio"
            >
              <SymbolView
                name={{ ios: "plus", android: "add", web: "add" }}
                size={18}
                tintColor={theme.primaryText}
              />
              <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
                Agregar ejercicio
              </Text>
            </Pressable>

            {/* Lista de ejercicios o estado vacío */}
            {ejercicios.length === 0 ? (
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
                    size={38}
                    tintColor={theme.accent}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Sin ejercicios asignados
                </Text>
                <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                  Agrega ejercicios a esta rutina para diseñar tu entrenamiento.
                </Text>
              </View>
            ) : (
              <View style={styles.ejerciciosList}>
                {ejercicios.map((ejercicio) => (
                  <View
                    key={`${ejercicio.id_rutina}-${ejercicio.id_ejercicios}`}
                    style={[
                      styles.ejercicioCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.ejercicioCardTop}>
                      <View style={styles.ejercicioMainInfo}>
                        <Text
                          style={[styles.ejercicioName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {ejercicio.ejercicios?.nombre_ejercicios ?? "Ejercicio"}
                        </Text>
                        <View style={styles.ejercicioTagsRow}>
                          {ejercicio.ejercicios?.categoria_ejercicios ? (
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
                                {ejercicio.ejercicios.categoria_ejercicios}
                              </Text>
                            </View>
                          ) : null}
                          <View
                            style={[
                              styles.globalBadge,
                              {
                                backgroundColor: esGlobal(ejercicio)
                                  ? "rgba(255, 184, 0, 0.15)"
                                  : "rgba(29, 99, 255, 0.15)",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.globalBadgeText,
                                {
                                  color: esGlobal(ejercicio)
                                    ? theme.primary
                                    : theme.accent,
                                },
                              ]}
                            >
                              {esGlobal(ejercicio) ? "Global" : "Personal"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.seriesRepeticionesRow}>
                        <View style={styles.metricaItem}>
                          <Text style={[styles.metricaLabel, { color: theme.textSecondary }]}>
                            SERIES
                          </Text>
                          <Text style={[styles.metricaValor, { color: theme.text }]}>
                            {ejercicio.series}
                          </Text>
                        </View>
                        <View style={[styles.metricaSeparator, { backgroundColor: theme.border }]} />
                        <View style={styles.metricaItem}>
                          <Text style={[styles.metricaLabel, { color: theme.textSecondary }]}>
                            REPETICIONES
                          </Text>
                          <Text style={[styles.metricaValor, { color: theme.text }]}>
                            {ejercicio.repeticiones}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ejercicioActionsRow}>
                        <Pressable
                          onPress={() => abrirModalEditarEjercicio(ejercicio)}
                          style={({ pressed }) => [
                            styles.actionIconButton,
                            { opacity: pressed ? 0.5 : 1 },
                          ]}
                          hitSlop={8}
                          accessibilityLabel="Editar series y repeticiones"
                        >
                          <SymbolView
                            name={{
                              ios: "pencil",
                              android: "edit",
                              web: "edit",
                            }}
                            size={17}
                            tintColor={theme.textSecondary}
                          />
                        </Pressable>

                        <Pressable
                          onPress={() => confirmarQuitarEjercicio(ejercicio)}
                          style={({ pressed }) => [
                            styles.actionIconButton,
                            { opacity: pressed ? 0.5 : 1 },
                          ]}
                          hitSlop={8}
                          accessibilityLabel="Quitar ejercicio de la rutina"
                        >
                          <SymbolView
                            name={{
                              ios: "trash",
                              android: "delete",
                              web: "delete",
                            }}
                            size={17}
                            tintColor={theme.error}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal: Editar Rutina */}
      <Modal
        visible={modalEditarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardandoEdicion) setModalEditarVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              if (!guardandoEdicion) setModalEditarVisible(false);
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
                  ACTUALIZAR RUTINA
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Editar rutina
                </Text>
              </View>
              <Pressable
                onPress={() => setModalEditarVisible(false)}
                disabled={guardandoEdicion}
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

            {errorEdicion ? (
              <View
                style={[
                  styles.modalErrorContainer,
                  { backgroundColor: "rgba(255, 59, 48, 0.1)" },
                ]}
              >
                <Text style={[styles.modalErrorText, { color: theme.error }]}>
                  {errorEdicion}
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
                placeholder="Ej. Fuerza Core"
                placeholderTextColor={theme.textSecondary}
                value={nombreRutina}
                onChangeText={setNombreRutina}
                editable={!guardandoEdicion}
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
                editable={!guardandoEdicion}
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
                editable={!guardandoEdicion}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalEditarVisible(false)}
                disabled={guardandoEdicion}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleGuardarEdicionRutina}
                disabled={guardandoEdicion}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: guardandoEdicion ? 0.6 : 1,
                  },
                ]}
              >
                {guardandoEdicion ? (
                  <ActivityIndicator size="small" color={theme.primaryText} />
                ) : (
                  <Text style={[styles.confirmButtonText, { color: theme.primaryText }]}>
                    Guardar cambios
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Agregar Ejercicio a la Rutina */}
      <Modal
        visible={modalAgregarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardandoAgregar) setModalAgregarVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              if (!guardandoAgregar) setModalAgregarVisible(false);
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
                  AGREGAR EJERCICIO
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Seleccionar ejercicio
                </Text>
              </View>
              <Pressable
                onPress={() => setModalAgregarVisible(false)}
                disabled={guardandoAgregar}
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

            {/* Buscador */}
            <View style={styles.buscadorContainer}>
              <TextInput
                style={[
                  styles.buscadorInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Buscar ejercicio por nombre o categoría"
                placeholderTextColor={theme.textSecondary}
                value={filtroBusqueda}
                onChangeText={setFiltroBusqueda}
                editable={!guardandoAgregar}
              />
            </View>

            {/* Lista de ejercicios disponibles */}
            <ScrollView
              style={styles.listaEjerciciosScroll}
              showsVerticalScrollIndicator={false}
            >
              {ejerciciosFiltrados.length === 0 ? (
                <View style={styles.emptyBusquedaContainer}>
                  <Text style={[styles.emptyBusquedaText, { color: theme.textSecondary }]}>
                    No se encontraron ejercicios
                  </Text>
                </View>
              ) : (
                ejerciciosFiltrados.map((ejercicio) => {
                  const yaEnRutina = ejerciciosEnRutina.has(
                    ejercicio.id_ejercicios,
                  );
                  return (
                    <Pressable
                      key={ejercicio.id_ejercicios}
                      onPress={() =>
                        yaEnRutina ? null : seleccionarEjercicio(ejercicio)
                      }
                      disabled={yaEnRutina}
                      style={[
                        styles.ejercicioDisponibleItem,
                        {
                          backgroundColor: yaEnRutina
                            ? theme.backgroundElement
                            : theme.card,
                          borderColor: ejercicioSeleccionado?.id_ejercicios ===
                            ejercicio.id_ejercicios
                            ? theme.primary
                            : theme.border,
                          opacity: yaEnRutina ? 0.6 : 1,
                        },
                      ]}
                      hitSlop={8}
                    >
                      <View style={styles.ejercicioDisponibleInfo}>
                        <Text
                          style={[
                            styles.ejercicioDisponibleNombre,
                            {
                              color: yaEnRutina
                                ? theme.textSecondary
                                : theme.text,
                            },
                          ]}
                        >
                          {ejercicio.nombre_ejercicios}
                        </Text>
                        {ejercicio.categoria_ejercicios && (
                          <Text
                            style={[
                              styles.ejercicioDisponibleCategoria,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {ejercicio.categoria_ejercicios}
                          </Text>
                        )}
                        {ejercicio.id_entrenador === null && (
                          <Text
                            style={[
                              styles.ejercicioDisponibleGlobal,
                              { color: theme.primary },
                            ]}
                          >
                            Global
                          </Text>
                        )}
                      </View>
                      {ejercicioSeleccionado?.id_ejercicios === ejercicio.id_ejercicios && (
                        <SymbolView
                          name={{
                            ios: "checkmark.circle.fill",
                            android: "check_circle",
                            web: "check_circle",
                          }}
                          size={20}
                          tintColor={theme.primary}
                        />
                      )}
                      {yaEnRutina && (
                        <Text
                          style={[
                            styles.ejercicioDisponibleYaEnRutina,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Ya está en la rutina
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {/* Formulario de series/repeticiones/orden cuando hay selección */}
            {ejercicioSeleccionado && (
              <View style={styles.formSeleccionContainer}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Ejercicio: {ejercicioSeleccionado.nombre_ejercicios}
                  </Text>
                </View>
                <View style={styles.metricasFormRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
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
                      editable={!guardandoAgregar}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
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
                      editable={!guardandoAgregar}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
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
                      editable={!guardandoAgregar}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Botón crear ejercicio personalizado (Opción A) */}
            <View style={styles.dividerConTexto}>
              <View style={styles.dividerLinea} />
              <Text style={[styles.dividerTexto, { color: theme.textSecondary }]}>
                O crear uno nuevo
              </Text>
              <View style={styles.dividerLinea} />
            </View>

            <Pressable
              onPress={() => {
                setModalAgregarVisible(false);
                setNombreNuevoEjercicio("");
                setCategoriaNuevoEjercicio("");
                setErrorNuevoEjercicio(null);
                setModalCrearEjercicioVisible(true);
              }}
              style={[
                styles.botonCrearEjercicio,
                {
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Crear ejercicio personalizado"
            >
              <SymbolView
                name={{ ios: "plus", android: "add", web: "add" }}
                size={16}
                tintColor={theme.primary}
              />
              <Text style={[styles.botonCrearEjercicioTexto, { color: theme.primary }]}>
                Crear ejercicio personalizado
              </Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalAgregarVisible(false)}
                disabled={guardandoAgregar}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAgregarEjercicioARutina}
                disabled={guardandoAgregar || !ejercicioSeleccionado}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: theme.primary,
                    opacity:
                      guardandoAgregar || !ejercicioSeleccionado ? 0.6 : 1,
                  },
                ]}
              >
                {guardandoAgregar ? (
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

      {/* Modal: Crear Ejercicio Personalizado (Opción A) */}
      <Modal
        visible={modalCrearEjercicioVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardandoNuevoEjercicio) {
            setModalCrearEjercicioVisible(false);
            setModalAgregarVisible(true);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              if (!guardandoNuevoEjercicio) setModalCrearEjercicioVisible(false);
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
                  EJERCICIO PERSONALIZADO
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Crear ejercicio
                </Text>
              </View>
              <Pressable
                onPress={() => setModalCrearEjercicioVisible(false)}
                disabled={guardandoNuevoEjercicio}
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

            {errorNuevoEjercicio ? (
              <View
                style={[
                  styles.modalErrorContainer,
                  { backgroundColor: "rgba(255, 59, 48, 0.1)" },
                ]}
              >
                <Text style={[styles.modalErrorText, { color: theme.error }]}>
                  {errorNuevoEjercicio}
                </Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Nombre del ejercicio *
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
                placeholder="Ej. Sentadilla con barra"
                placeholderTextColor={theme.textSecondary}
                value={nombreNuevoEjercicio}
                onChangeText={setNombreNuevoEjercicio}
                editable={!guardandoNuevoEjercicio}
                autoFocus
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
                placeholder="Ej. Fuerza, Técnica"
                placeholderTextColor={theme.textSecondary}
                value={categoriaNuevoEjercicio}
                onChangeText={setCategoriaNuevoEjercicio}
                editable={!guardandoNuevoEjercicio}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setModalCrearEjercicioVisible(false);
                  setModalAgregarVisible(true);
                }}
                disabled={guardandoNuevoEjercicio}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={crearEjercicioPersonalizado}
                disabled={guardandoNuevoEjercicio}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: guardandoNuevoEjercicio ? 0.6 : 1,
                  },
                ]}
              >
                {guardandoNuevoEjercicio ? (
                  <ActivityIndicator size="small" color={theme.primaryText} />
                ) : (
                  <Text style={[styles.confirmButtonText, { color: theme.primaryText }]}>
                    Guardar ejercicio
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Editar Ejercicio en la Rutina */}
      <Modal
        visible={modalEditarEjercicioVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardandoEdicionEjercicio) setModalEditarEjercicioVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              if (!guardandoEdicionEjercicio) setModalEditarEjercicioVisible(false);
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
                  EDITAR EJERCICIO
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Series y repeticiones
                </Text>
              </View>
              <Pressable
                onPress={() => setModalEditarEjercicioVisible(false)}
                disabled={guardandoEdicionEjercicio}
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

            {errorEdicionEjercicio ? (
              <View
                style={[
                  styles.modalErrorContainer,
                  { backgroundColor: "rgba(255, 59, 48, 0.1)" },
                ]}
              >
                <Text style={[styles.modalErrorText, { color: theme.error }]}>
                  {errorEdicionEjercicio}
                </Text>
              </View>
            ) : null}

            {ejercicioEnEdicion && (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Ejercicio
                  </Text>
                  <Text style={[styles.ejercicioEnEdicionNombre, { color: theme.textSecondary }]}>
                    {ejercicioEnEdicion.ejercicios?.nombre_ejercicios ?? "Ejercicio"}
                  </Text>
                </View>

                <View style={styles.metricasFormRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
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
                      value={seriesEdicion}
                      onChangeText={setSeriesEdicion}
                      keyboardType="numeric"
                      editable={!guardandoEdicionEjercicio}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
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
                      value={repeticionesEdicion}
                      onChangeText={setRepeticionesEdicion}
                      keyboardType="numeric"
                      editable={!guardandoEdicionEjercicio}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Orden
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
                      value={ordenEdicion}
                      onChangeText={setOrdenEdicion}
                      keyboardType="numeric"
                      editable={!guardandoEdicionEjercicio}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalEditarEjercicioVisible(false)}
                disabled={guardandoEdicionEjercicio}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleGuardarEdicionEjercicio}
                disabled={guardandoEdicionEjercicio}
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: guardandoEdicionEjercicio ? 0.6 : 1,
                  },
                ]}
              >
                {guardandoEdicionEjercicio ? (
                  <ActivityIndicator size="small" color={theme.primaryText} />
                ) : (
                  <Text style={[styles.confirmButtonText, { color: theme.primaryText }]}>
                    Guardar cambios
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
  topNavigation: {
    marginBottom: Spacing.three,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.five,
  },
  rutinaHeaderInfo: {
    flex: 1,
    marginRight: 12,
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
  headerTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  descripcion: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconButton: {
    padding: 6,
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
  ejerciciosList: {
    gap: Spacing.three,
  },
  ejercicioCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  ejercicioCardTop: {
    padding: Spacing.four,
  },
  ejercicioMainInfo: {
    flex: 1,
  },
  ejercicioName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  ejercicioTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: Spacing.three,
  },
  globalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  globalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  seriesRepeticionesRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
  },
  metricaItem: {
    flex: 1,
    alignItems: "center",
  },
  metricaLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metricaValor: {
    fontSize: 13,
    fontWeight: "600",
  },
  metricaSeparator: {
    width: StyleSheet.hairlineWidth,
    height: "100%",
  },
  ejercicioActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.two,
  },
  errorCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.five,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  backActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backActionText: {
    fontSize: 15,
    fontWeight: "700",
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
  /* Modal Agregar Ejercicio */
  buscadorContainer: {
    marginBottom: Spacing.three,
  },
  buscadorInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  listaEjerciciosScroll: {
    maxHeight: 260,
    marginBottom: Spacing.three,
  },
  emptyBusquedaContainer: {
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  emptyBusquedaText: {
    fontSize: 14,
  },
  ejercicioDisponibleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  ejercicioDisponibleInfo: {
    flex: 1,
  },
  ejercicioDisponibleNombre: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  ejercicioDisponibleCategoria: {
    fontSize: 12,
    marginBottom: 2,
  },
  ejercicioDisponibleGlobal: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  ejercicioDisponibleYaEnRutina: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  formSeleccionContainer: {
    marginBottom: Spacing.three,
  },
  metricasFormRow: {
    flexDirection: "row",
    gap: 10,
  },
  dividerConTexto: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginVertical: Spacing.three,
  },
  dividerLinea: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#cbd5e1",
  },
  dividerTexto: {
    fontSize: 13,
    fontWeight: "600",
  },
  botonCrearEjercicio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1D63FF",
    marginBottom: Spacing.two,
  },
  botonCrearEjercicioTexto: {
    fontSize: 14,
    fontWeight: "700",
  },
  ejercicioEnEdicionNombre: {
    fontSize: 13,
    marginBottom: Spacing.three,
  },
});
