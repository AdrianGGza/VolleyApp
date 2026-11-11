import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { obtenerEquipoPorId, type Equipo } from "@/services/equipos.services";
import {
  actualizarJugador,
  crearJugador,
  eliminarJugador,
  obtenerJugadoresPorEquipo,
  type JugadorConPosicion,
} from "@/services/jugadores.services";
import { obtenerPosiciones, type Posicion } from "@/services/posiciones.services";
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

export default function DetalleEquipoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idEquipo = Number(id);

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [jugadores, setJugadores] = useState<JugadorConPosicion[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Estados del modal de jugador (alta / edición)
  const [modalVisible, setModalVisible] = useState(false);
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState<JugadorConPosicion | null>(null);
  const [nombreJugador, setNombreJugador] = useState("");
  const [posicionSeleccionada, setPosicionSeleccionada] = useState<number | null>(null);
  const [edad, setEdad] = useState("");
  const [estatura, setEstatura] = useState("");
  const [peso, setPeso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (Number.isNaN(idEquipo)) return;

    try {
      const [equipoData, jugadoresData, posicionesData] = await Promise.all([
        obtenerEquipoPorId(idEquipo),
        obtenerJugadoresPorEquipo(idEquipo),
        obtenerPosiciones(),
      ]);

      setEquipo(equipoData);
      setJugadores(jugadoresData);
      setPosiciones(posicionesData);
    } catch {
      Alert.alert(
        "Error",
        "No se pudieron cargar los datos del equipo. Verifica tu conexión a internet.",
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [idEquipo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  const abrirModalCrear = () => {
    setJugadorEnEdicion(null);
    setNombreJugador("");
    setPosicionSeleccionada(null);
    setEdad("");
    setEstatura("");
    setPeso("");
    setErrorModal(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (jugador: JugadorConPosicion) => {
    setJugadorEnEdicion(jugador);
    setNombreJugador(jugador.nombre_jugador ?? "");
    setPosicionSeleccionada(jugador.id_posicion ?? null);
    setEdad(jugador.edad_jugador != null ? String(jugador.edad_jugador) : "");
    setEstatura(jugador.estatura_jugador != null ? String(jugador.estatura_jugador) : "");
    setPeso(jugador.peso_jugador != null ? String(jugador.peso_jugador) : "");
    setErrorModal(null);
    setModalVisible(true);
  };

  const handleGuardarJugador = async () => {
    setErrorModal(null);
    const nombreLimpio = nombreJugador.trim();

    if (!nombreLimpio) {
      setErrorModal("El nombre del jugador es obligatorio.");
      return;
    }

    const edadNum = edad.trim() ? parseInt(edad.trim(), 10) : null;
    const estaturaNum = estatura.trim() ? parseFloat(estatura.trim()) : null;
    const pesoNum = peso.trim() ? parseFloat(peso.trim()) : null;

    if (edadNum !== null && (Number.isNaN(edadNum) || edadNum <= 0)) {
      setErrorModal("Ingresa una edad válida.");
      return;
    }

    if (estaturaNum !== null && (Number.isNaN(estaturaNum) || estaturaNum <= 0)) {
      setErrorModal("Ingresa una estatura válida (en cm).");
      return;
    }

    if (pesoNum !== null && (Number.isNaN(pesoNum) || pesoNum <= 0)) {
      setErrorModal("Ingresa un peso válido (en kg).");
      return;
    }

    setGuardando(true);

    try {
      if (jugadorEnEdicion) {
        // Actualización
        const actualizado = await actualizarJugador(jugadorEnEdicion.id_jugador, {
          nombre_jugador: nombreLimpio,
          id_posicion: posicionSeleccionada,
          edad_jugador: edadNum,
          estatura_jugador: estaturaNum,
          peso_jugador: pesoNum,
        });

        const posicionObj = posiciones.find((p) => p.id_posicion === posicionSeleccionada);
        setJugadores((prev) =>
          prev.map((item) =>
            item.id_jugador === actualizado.id_jugador
              ? { ...item, ...actualizado, posiciones: posicionObj ?? null }
              : item,
          ),
        );
      } else {
        // Creación
        const nuevo = await crearJugador({
          id_equipo: idEquipo,
          nombre_jugador: nombreLimpio,
          id_posicion: posicionSeleccionada,
          edad_jugador: edadNum,
          estatura_jugador: estaturaNum,
          peso_jugador: pesoNum,
        });

        const posicionObj = posiciones.find((p) => p.id_posicion === posicionSeleccionada);
        setJugadores((prev) => [
          { ...nuevo, posiciones: posicionObj ?? null },
          ...prev,
        ]);
      }

      setModalVisible(false);
    } catch {
      setErrorModal("No se pudo guardar la información del jugador.");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarJugador = (jugador: JugadorConPosicion) => {
    Alert.alert(
      "Eliminar jugador",
      `¿Deseas eliminar a "${jugador.nombre_jugador}" de la plantilla?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarJugador(jugador.id_jugador);
              setJugadores((prev) =>
                prev.filter((item) => item.id_jugador !== jugador.id_jugador),
              );
            } catch {
              Alert.alert(
                "Error",
                "No se pudo eliminar al jugador. Intenta nuevamente.",
              );
            }
          },
        },
      ],
    );
  };

  if (Number.isNaN(idEquipo)) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.errorCentered}>
          <Text style={[styles.errorTitle, { color: theme.error }]}>
            Identificador de equipo inválido
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backActionButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.backActionText, { color: theme.primaryText }]}>
              Volver a equipos
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
        {/* Barra superior de navegación */}
        <View style={styles.topNavigation}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver a lista de equipos"
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
              Equipos
            </Text>
          </Pressable>
        </View>

        {/* Encabezado del Equipo («Court & Ball») */}
        <View style={styles.header}>
          <View style={styles.teamHeaderInfo}>
            <Text style={[styles.kicker, { color: theme.accent }]}>
              PLANTILLA OFICIAL
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {equipo?.nombre_equipo ?? "Cargando…"}
            </Text>
            <View style={styles.headerTagsRow}>
              {equipo?.categoria_equipo ? (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                    {equipo.categoria_equipo}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.playerCountBadge, { color: theme.textSecondary }]}>
                {jugadores.length === 1
                  ? "1 atleta registrado"
                  : `${jugadores.length} atletas registrados`}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={abrirModalCrear}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Añadir jugador"
          >
            <SymbolView
              name={{ ios: "person.badge.plus", android: "person_add", web: "person_add" }}
              size={18}
              tintColor={theme.primaryText}
            />
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              Añadir
            </Text>
          </Pressable>
        </View>

        {/* Estado de carga */}
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando atletas…
            </Text>
          </View>
        ) : jugadores.length === 0 ? (
          /* Estado Vacío de Plantilla */
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
                  ios: "figure.volleyball",
                  android: "sports_volleyball",
                  web: "sports_volleyball",
                }}
                size={38}
                tintColor={theme.accent}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Sin atletas en la plantilla
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              Agrega a los jugadores de este equipo para asignarles su posición táctica
              y llevar el seguimiento de sus evaluaciones y rendimiento.
            </Text>
            <Pressable
              onPress={abrirModalCrear}
              style={({ pressed }) => [
                styles.emptyActionButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.emptyActionText, { color: theme.primaryText }]}>
                Añadir primer jugador
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Lista de Jugadores */
          <View style={styles.playersList}>
            {jugadores.map((jugador) => (
              <View
                key={jugador.id_jugador}
                style={[
                  styles.playerCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.playerCardTop}>
                  <View style={styles.playerAvatarBadge}>
                    <Text style={[styles.playerAvatarText, { color: theme.accent }]}>
                      {jugador.nombre_jugador ? jugador.nombre_jugador[0].toUpperCase() : "V"}
                    </Text>
                  </View>

                  <View style={styles.playerMainInfo}>
                    <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
                      {jugador.nombre_jugador}
                    </Text>
                    <View style={styles.positionBadgeRow}>
                      <View
                        style={[
                          styles.positionBadge,
                          {
                            backgroundColor: jugador.posiciones
                              ? "rgba(29, 99, 255, 0.12)"
                              : theme.backgroundElement,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.positionBadgeText,
                            {
                              color: jugador.posiciones ? theme.accent : theme.textSecondary,
                            },
                          ]}
                        >
                          {jugador.posiciones?.nombre_posicion ?? "Sin posición fija"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Acciones de la tarjeta */}
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      onPress={() => abrirModalEditar(jugador)}
                      style={({ pressed }) => [
                        styles.actionIconButton,
                        { opacity: pressed ? 0.5 : 1 },
                      ]}
                      hitSlop={8}
                      accessibilityLabel="Editar jugador"
                    >
                      <SymbolView
                        name={{ ios: "pencil", android: "edit", web: "edit" }}
                        size={17}
                        tintColor={theme.textSecondary}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => confirmarEliminarJugador(jugador)}
                      style={({ pressed }) => [
                        styles.actionIconButton,
                        { opacity: pressed ? 0.5 : 1 },
                      ]}
                      hitSlop={8}
                      accessibilityLabel="Eliminar jugador"
                    >
                      <SymbolView
                        name={{ ios: "trash", android: "delete", web: "delete" }}
                        size={17}
                        tintColor={theme.error}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Métricas físicas del jugador */}
                <View
                  style={[
                    styles.playerMetricsRow,
                    { borderTopColor: theme.border, backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      EDAD
                    </Text>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                      {jugador.edad_jugador != null ? `${jugador.edad_jugador} años` : "—"}
                    </Text>
                  </View>

                  <View style={[styles.metricSeparator, { backgroundColor: theme.border }]} />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      ESTATURA
                    </Text>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                      {jugador.estatura_jugador != null ? `${jugador.estatura_jugador} cm` : "—"}
                    </Text>
                  </View>

                  <View style={[styles.metricSeparator, { backgroundColor: theme.border }]} />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      PESO
                    </Text>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                      {jugador.peso_jugador != null ? `${jugador.peso_jugador} kg` : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Alta / Edición de Jugador */}
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
                  {jugadorEnEdicion ? "ACTUALIZAR FICHA" : "NUEVO ATLETA"}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {jugadorEnEdicion ? "Editar jugador" : "Registrar jugador"}
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

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Campo: Nombre */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Nombre completo *
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
                  placeholder="Ej. Mateo García"
                  placeholderTextColor={theme.textSecondary}
                  value={nombreJugador}
                  onChangeText={setNombreJugador}
                  editable={!guardando}
                />
              </View>

              {/* Selector interactivo de posición de voleibol */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Posición de voleibol
                </Text>
                <View style={styles.positionsSelector}>
                  {posiciones.map((pos) => {
                    const esSeleccionada = posicionSeleccionada === pos.id_posicion;
                    return (
                      <Pressable
                        key={pos.id_posicion}
                        onPress={() =>
                          setPosicionSeleccionada((prev) =>
                            prev === pos.id_posicion ? null : pos.id_posicion,
                          )
                        }
                        style={[
                          styles.positionChip,
                          {
                            backgroundColor: esSeleccionada
                              ? theme.primary
                              : theme.backgroundElement,
                            borderColor: esSeleccionada ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.positionChipText,
                            {
                              color: esSeleccionada ? theme.primaryText : theme.text,
                              fontWeight: esSeleccionada ? "700" : "500",
                            },
                          ]}
                        >
                          {pos.nombre_posicion}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Fila de medidas físicas */}
              <View style={styles.metricsFormRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Edad</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Años"
                    placeholderTextColor={theme.textSecondary}
                    value={edad}
                    onChangeText={setEdad}
                    keyboardType="numeric"
                    editable={!guardando}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Estatura</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="cm"
                    placeholderTextColor={theme.textSecondary}
                    value={estatura}
                    onChangeText={setEstatura}
                    keyboardType="numeric"
                    editable={!guardando}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Peso</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="kg"
                    placeholderTextColor={theme.textSecondary}
                    value={peso}
                    onChangeText={setPeso}
                    keyboardType="numeric"
                    editable={!guardando}
                  />
                </View>
              </View>
            </ScrollView>

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
                onPress={handleGuardarJugador}
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
                    {jugadorEnEdicion ? "Actualizar ficha" : "Guardar atleta"}
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
    paddingTop: Spacing.two,
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
  teamHeaderInfo: {
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
  playerCountBadge: {
    fontSize: 13,
    fontWeight: "500",
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
  playersList: {
    gap: Spacing.three,
  },
  playerCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  playerCardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.four,
    gap: 12,
  },
  playerAvatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(29, 99, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  playerAvatarText: {
    fontSize: 20,
    fontWeight: "800",
  },
  playerMainInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  positionBadgeRow: {
    flexDirection: "row",
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  positionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    padding: 6,
  },
  playerMetricsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: Spacing.four,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  metricSeparator: {
    width: StyleSheet.hairlineWidth,
    height: "100%",
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
    maxHeight: "85%",
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
  positionsSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  positionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  positionChipText: {
    fontSize: 13,
  },
  metricsFormRow: {
    flexDirection: "row",
    gap: 10,
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
