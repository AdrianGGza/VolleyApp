import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { obtenerSesiones, crearSesion, obtenerAsignacionesPorFecha } from "@/services/sesiones.services";
import { obtenerEquipos, type Equipo } from "@/services/equipos.services";
import { obtenerRutinas, type Rutina } from "@/services/rutinas.services";
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

export default function CalendarioScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [sesiones, setSesiones] = useState<{
    id_sesion: number;
    fecha_sesion: string | null;
    duracion_sesion: number | null;
    id_equipo: number | null;
    equipos?: { nombre_equipo: string } | null;
  }[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Estado del mes actual para el calendario
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth()); // 0-11

  // Modal de crear sesión
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [idEquipoSeleccionado, setIdEquipoSeleccionado] = useState<number | null>(null);
  const [fechaSesion, setFechaSesion] = useState("");
  const [duracionSesion, setDuracionSesion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Día seleccionado para ver detalle
  const [diaSeleccionado, setDiaSeleccionado] = useState<{ dia: number; mes: number; ano: number } | null>(null);
  const [asignacionesDelDia, setAsignacionesDelDia] = useState<any[]>([]);

  const cargarSesiones = useCallback(async () => {
    try {
      const [sesionesData, equiposData, rutinasData] = await Promise.all([
        obtenerSesiones(),
        obtenerEquipos(),
        obtenerRutinas(),
      ]);
      setSesiones(sesionesData);
      setEquipos(equiposData);
      setRutinas(rutinasData);
    } catch {
      Alert.alert(
        "Error",
        "No se pudieron cargar las sesiones. Verifica tu conexión a internet.",
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarSesiones();
  }, [cargarSesiones]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarSesiones();
  };

  // Obtener días del mes actual
  const obtenerDiasDelMes = () => {
    const primerDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaPrimerDia = primerDia.getDay(); // 0=domingo, 1=lunes, ...

    // Días del mes anterior que se muestran al inicio
    const diasMesAnterior = [];
    for (let i = diaSemanaPrimerDia - 1; i >= 0; i--) {
      diasMesAnterior.push(new Date(ano, mes, -i).getDate());
    }

    // Días del mes actual
    const diasActual = [];
    for (let i = 1; i <= diasEnMes; i++) {
      diasActual.push(i);
    }

    // Días del mes siguiente para completar la cuadrícula
    const totalCeldas = 42; // 6 semanas x 7 días
    const diasMesSiguiente = totalCeldas - diasMesAnterior.length - diasActual.length;

    return { diasMesAnterior, diasActual, diasMesSiguiente };
  };

  const { diasMesAnterior, diasActual, diasMesSiguiente } = obtenerDiasDelMes();

  // Verificar si una fecha tiene sesiones
  const tieneSesionEnFecha = (dia: number, m: number, a: number) => {
    const fechaStr = `${a}-${String(m + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return sesiones.some((s) => s.fecha_sesion === fechaStr);
  };

  // Obtener sesiones de una fecha
  const obtenerSesionesDeFecha = (dia: number, m: number, a: number) => {
    const fechaStr = `${a}-${String(m + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return sesiones.filter((s) => s.fecha_sesion === fechaStr);
  };

  // Obtener nombre del mes
  const nombreMes = new Date(ano, mes).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const cambiarMes = (delta: number) => {
    const nuevaMes = mes + delta;
    if (nuevaMes < 0) {
      setMes(11);
      setAno(ano - 1);
    } else if (nuevaMes > 11) {
      setMes(0);
      setAno(ano + 1);
    } else {
      setMes(nuevaMes);
    }
    setDiaSeleccionado(null);
    setAsignacionesDelDia([]);
  };

  const seleccionarDia = (dia: number, esDiaValido: boolean) => {
    if (!esDiaValido) return;
    const fechaStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setDiaSeleccionado({ dia, mes, ano });
    // Cargar asignaciones de rutina para esa fecha
    obtenerAsignacionesPorFecha(fechaStr).then((data) => {
      setAsignacionesDelDia(data);
    });
  };

  const abrirModalCrear = () => {
    setIdEquipoSeleccionado(null);
    setFechaSesion("");
    setDuracionSesion("");
    setErrorModal(null);
    setModalCrearVisible(true);
  };

  const handleCrearSesion = async () => {
    setErrorModal(null);
    if (!idEquipoSeleccionado) {
      setErrorModal("Selecciona un equipo.");
      return;
    }
    if (!fechaSesion) {
      setErrorModal("Selecciona una fecha.");
      return;
    }

    setGuardando(true);
    try {
      await crearSesion({
        id_equipo: idEquipoSeleccionado,
        fecha_sesion: fechaSesion,
        duracion_sesion: duracionSesion ? parseInt(duracionSesion, 10) : null,
      });
      setModalCrearVisible(false);
      cargarSesiones();
    } catch {
      setErrorModal("No se pudo crear la sesión. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const mesNombreCorto = new Date(ano, mes).toLocaleDateString("es-ES", {
    month: "short",
  });

  // Sesiones del día seleccionado (calculado antes del render)
  let sesionesDelDia: any[] = [];
  if (diaSeleccionado) {
    sesionesDelDia = obtenerSesionesDeFecha(
      diaSeleccionado.dia,
      mes,
      ano,
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.kicker, { color: theme.primary }]}>
              CALENDARIO DE ENTRENAMIENTO
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {mesNombreCorto} {ano}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => cambiarMes(-1)}
              style={styles.navButton}
            >
              <SymbolView
                name={{
                  ios: "chevron.left",
                  android: "arrow_back",
                  web: "arrow_back",
                }}
                size={20}
                tintColor={theme.primary}
              />
            </Pressable>
            <Pressable
              onPress={abrirModalCrear}
              style={styles.primaryButton}
            >
              <SymbolView
                name={{ ios: "plus", android: "add", web: "add" }}
                size={18}
                tintColor={theme.primaryText}
              />
              <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
                Nueva sesión
              </Text>
            </Pressable>
            <Pressable
              onPress={() => cambiarMes(1)}
              style={styles.navButton}
            >
              <SymbolView
                name={{
                  ios: "chevron.right",
                  android: "arrow_forward",
                  web: "arrow_forward",
                }}
                size={20}
                tintColor={theme.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* Estado de carga */}
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando sesiones…
            </Text>
          </View>
        ) : null}

        {/* Grid del calendario */}
        <View style={styles.calendarioWrapper}>
          <View style={styles.calendarioContainer}>
            {/* Días de la semana */}
            <View style={styles.diasSemanaRow}>
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dia) => (
                <Text key={dia} style={[styles.diaSemanaText, { flex: 1 }]}>
                  {dia}
                </Text>
              ))}
            </View>

          {/* Días del mes anterior (placeholder) */}
          {diasMesAnterior.map((dia) => (
            <View key={`prev-${dia}`} style={styles.diaCelda} />
          ))}

          {/* Días del mes actual */}
          {diasActual.map((dia) => {
            const esHoy =
              dia === new Date().getDate() &&
              mes === new Date().getMonth() &&
              ano === new Date().getFullYear();
            const tieneSesion = tieneSesionEnFecha(dia, mes, ano);
            const esSeleccionado =
              diaSeleccionado?.dia === dia &&
              diaSeleccionado.mes === mes &&
              diaSeleccionado.ano === ano;

            return (
              <Pressable
                key={dia}
                onPress={() => seleccionarDia(dia, true)}
                style={[
                  styles.diaCelda,
                  tieneSesion && styles.diaConSesion,
                  esSeleccionado && styles.diaSeleccionado,
                  esHoy && styles.diaHoy,
                ]}
              >
                <Text
                  style={[
                    styles.diaNumero,
                    tieneSesion && { color: "#FFFFFF" },
                    esSeleccionado && { color: "#FFFFFF", fontWeight: "800" },
                    esHoy && { fontWeight: "700" },
                  ]}
                >
                  {dia}
                </Text>
                {tieneSesion && (
                  <View style={styles.puntoSesion} />
                )}
              </Pressable>
            );
          })}

          {/* Días del mes siguiente (placeholder) */}
          {Array.from({ length: diasMesSiguiente }, (_, i) => (
            <View key={`next-${i}`} style={styles.diaCelda} />
          ))}
          </View>
        </View>

        {/* Detalle del día seleccionado */}
        {diaSeleccionado && (
          <View style={styles.detalleDiaContainer}>
            <View style={styles.detalleDiaHeader}>
              <Text style={[styles.detalleDiaTitulo, { color: theme.text }]}>
                {diaSeleccionado.dia} de {mesNombreCorto}, {ano}
              </Text>
              <Pressable
                onPress={() => {
                  setDiaSeleccionado(null);
                  setAsignacionesDelDia([]);
                }}
                style={styles.cerrarDetalle}
              >
                <SymbolView
                  name={{
                    ios: "xmark",
                    android: "close",
                    web: "close",
                  }}
                  size={18}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </View>

            {/* Sesiones del día */}
            <View style={styles.seccion}>
              <Text style={[styles.seccionTitulo, { color: theme.text }]}>
                Sesiones del día
              </Text>
              {sesionesDelDia.length === 0 ? (
                <Text style={[styles.textoVacio, { color: theme.textSecondary }]}>
                  No hay sesiones programadas para este día.
                </Text>
              ) : (
                sesionesDelDia.map((sesion) => (
                  <View
                    key={sesion.id_sesion}
                    style={styles.sesionCard}
                  >
                    <View style={styles.sesionInfo}>
                      <Text style={[styles.sesionTitulo, { color: theme.text }]}>
                        {sesion.equipos?.nombre_equipo ?? "Equipo sin nombre"}
                      </Text>
                      <Text style={[styles.sesionSubtitulo, { color: theme.textSecondary }]}>
                        {sesion.duracion_sesion != null
                          ? `${sesion.duracion_sesion} min`
                          : "Sin duración especificada"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push(`/captura/${sesion.id_sesion}` as any)
                      }
                      style={styles.capturaButton}
                    >
                      <Text style={styles.capturaButtonText}>
                        Capturar datos
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            {/* Asignaciones de rutina del día */}
            <View style={styles.seccion}>
              <Text style={[styles.seccionTitulo, { color: theme.text }]}>
                Rutinas asignadas por jugador
              </Text>
              {asignacionesDelDia.length === 0 ? (
                <Text style={[styles.textoVacio, { color: theme.textSecondary }]}>
                  No hay rutinas asignadas para este día.
                </Text>
              ) : (
                asignacionesDelDia.map((asignacion) => (
                  <View
                    key={asignacion.id_asignacion}
                    style={styles.asignacionCard}
                  >
                    <View style={styles.asignacionInfo}>
                      <Text style={[styles.asignacionNombre, { color: theme.text }]}>
                        {asignacion.jugadores?.nombre_jugador ?? "Jugador sin nombre"}
                      </Text>
                      <Text style={[styles.asignacionRutina, { color: theme.textSecondary }]}>
                        {asignacion.rutinas?.nombre_rutina ?? "Sin rutina asignada"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal: Nueva Sesión */}
      <Modal
        visible={modalCrearVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardando) setModalCrearVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              if (!guardando) setModalCrearVisible(false);
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
                  NUEVA SESIÓN
                </Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Crear sesión de entrenamiento
                </Text>
              </View>
              <Pressable
                onPress={() => setModalCrearVisible(false)}
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
                Equipo *
              </Text>
              <View style={styles.selectContainer}>
                {equipos.map((equipo) => (
                  <Pressable
                    key={equipo.id_equipo}
                    onPress={() => setIdEquipoSeleccionado(equipo.id_equipo)}
                    style={[
                      styles.equipoChip,
                      idEquipoSeleccionado === equipo.id_equipo && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.equipoChipText,
                      {
                        color: idEquipoSeleccionado === equipo.id_equipo
                          ? theme.primaryText
                          : theme.textSecondary,
                        fontWeight: idEquipoSeleccionado === equipo.id_equipo
                          ? "700"
                          : "500",
                      },
                    ]}>
                      {equipo.nombre_equipo}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Fecha *
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
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={fechaSesion}
                onChangeText={setFechaSesion}
                editable={!guardando}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Duración (minutos)
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
                placeholder="90"
                placeholderTextColor={theme.textSecondary}
                value={duracionSesion}
                onChangeText={setDuracionSesion}
                keyboardType="numeric"
                editable={!guardando}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalCrearVisible(false)}
                disabled={guardando}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCrearSesion}
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
                    Crear sesión
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

const createStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
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
    alignItems: "center",
    marginBottom: Spacing.five,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
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
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: theme.backgroundElement,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: theme.primary,
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
  calendarioWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing.five,
  },
  calendarioContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  diasSemanaRow: {
    flexDirection: "row",
    width: "100%",
  },
  diaSemanaText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.textSecondary,
    textAlign: "center",
    width: "14.28%",
    marginBottom: 6,
  },
  diaCelda: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  diaConSesion: {
    backgroundColor: theme.primary,
    borderRadius: 12,
  },
  diaSeleccionado: {
    backgroundColor: theme.primary,
  },
  diaHoy: {
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 12,
  },
  diaNumero: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  puntoSesion: {
    position: "absolute",
    bottom: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
  },
  detalleDiaContainer: {
    marginTop: Spacing.four,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: Spacing.four,
  },
  detalleDiaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  detalleDiaTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
  },
  cerrarDetalle: {
    padding: 6,
  },
  seccion: {
    marginBottom: Spacing.four,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  textoVacio: {
    fontSize: 14,
    fontStyle: "italic",
  },
  sesionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.backgroundElement,
    marginBottom: 8,
  },
  sesionInfo: {
    flex: 1,
  },
  sesionTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
  },
  sesionSubtitulo: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  capturaButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.accent,
  },
  capturaButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.primaryText,
  },
  asignacionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.backgroundElement,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  asignacionInfo: {
    flex: 1,
  },
  asignacionNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
  },
  asignacionRutina: {
    fontSize: 13,
    color: theme.textSecondary,
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
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  equipoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  equipoChipText: {
    fontSize: 13,
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
