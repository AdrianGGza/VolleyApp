import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  obtenerSesionPorId,
  registrarJugadorSesion,
  obtenerRegistrosPorSesion,
  type RegistroJugadorSesion,
} from "@/services/sesiones.services";
import { supabase } from "@/services/supabase";
import {
  obtenerJugadoresPorEquipo,
  type JugadorConPosicion,
} from "@/services/jugadores.services";
import {
  obtenerPruebasFisicasPorJugador,
  registrarPruebaFisica,
  actualizarPruebaFisica,
  type PruebaFisica,
} from "@/services/pruebas-fisicas.services";
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RegistroEstado = {
  rpe: string;
  saltos: string;
  sueno: string;
  fatiga: string;
  molestias: string;
  agilidad: string;
  core: string;
  salto: string;
  navette: string;
};

export default function CapturaSesionScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { idSesion } = useLocalSearchParams<{ idSesion: string }>();

  const [sesion, setSesion] = useState<{
    id_sesion: number;
    fecha_sesion: string | null;
    duracion_sesion: number | null;
    id_equipo: number | null;
    equipos?: { nombre_equipo: string } | null;
  } | null>(null);
  const [jugadores, setJugadores] = useState<JugadorConPosicion[]>([]);
  const [registrosExistentes, setRegistrosExistentes] = useState<
    RegistroJugadorSesion[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de formularios por jugador: id_jugador -> RegistroEstado
  const [formularios, setFormularios] = useState<
    Map<number, RegistroEstado>
  >(new Map());

  const inicializarFormulario = (
    jugador: JugadorConPosicion,
    registroExistente: RegistroJugadorSesion | null,
    pruebaExistente: PruebaFisica | null,
  ): RegistroEstado => ({
    rpe: registroExistente?.rpe_registro?.toString() ?? "",
    saltos: registroExistente?.saltos_registro?.toString() ?? "",
    sueno: "", // No hay tabla de bienestar; campo informativo
    fatiga: "", // No hay tabla de bienestar; campo informativo
    molestias: "", // No hay tabla de bienestar; campo informativo
    agilidad: pruebaExistente?.agilidad_pruebas?.toString() ?? "",
    core: pruebaExistente?.core_pruebas?.toString() ?? "",
    salto: pruebaExistente?.salto_pruebas?.toString() ?? "",
    navette: pruebaExistente?.navette_pruebas?.toString() ?? "",
  });

  const cargarDatos = useCallback(async () => {
    if (!sesion?.id_sesion) return;

    setCargando(true);
    setError(null);
    try {
      const [jugadoresData, registrosData] = await Promise.all([
        obtenerJugadoresPorEquipo(sesion.id_equipo!),
        obtenerRegistrosPorSesion(sesion.id_sesion),
      ]);

      setJugadores(jugadoresData);
      setRegistrosExistentes(registrosData);

      // Inicializar formularios con datos existentes
      const mapFormularios = new Map<number, RegistroEstado>();
      for (const jugador of jugadoresData) {
        const registroExistente = registrosData.find(
          (r) => r.id_jugador === jugador.id_jugador,
        );
        const pruebasJugador = await obtenerPruebasFisicasPorJugador(
          jugador.id_jugador!,
        );
        const pruebaExistente = pruebasJugador[0] ?? null;

        mapFormularios.set(
          jugador.id_jugador!,
          inicializarFormulario(jugador, registroExistente ?? null, pruebaExistente),
        );
      }
      setFormularios(mapFormularios);
    } catch (err) {
      setError("No se pudieron cargar los datos de la sesión.");
    } finally {
      setCargando(false);
    }
  }, [sesion]);

  useEffect(() => {
    const cargarSesion = async () => {
      if (!idSesion) return;
      try {
        const sesionData = await obtenerSesionPorId(Number(idSesion));
        setSesion(sesionData);
      } catch {
        setError("No se pudo cargar la sesión.");
        setCargando(false);
      }
    };
    cargarSesion();
  }, [idSesion]);

  useEffect(() => {
    if (sesion) {
      cargarDatos();
    }
  }, [sesion, cargarDatos]);

  const actualizarCampo = (
    idJugador: number,
    campo: keyof RegistroEstado,
    valor: string,
  ) => {
    const formularioActual = formularios.get(idJugador);
    if (formularioActual) {
      setFormularios(new Map(formularios).set(idJugador, {
        ...formularioActual,
        [campo]: valor,
      }));
    }
  };

  const handleGuardar = async () => {
    if (!sesion?.id_sesion) return;

    // Validar campos de todos los jugadores antes de guardar
    const erroresValidacion: string[] = [];
    for (const jugador of jugadores) {
      const idJugador = jugador.id_jugador!;
      const formulario = formularios.get(idJugador);
      if (!formulario) continue;

      const rpeNum = formulario.rpe ? parseInt(formulario.rpe, 10) : null;
      if (rpeNum !== null && (rpeNum < 1 || rpeNum > 10)) {
        erroresValidacion.push(
          `${jugador.nombre_jugador}: RPE debe estar entre 1 y 10.`,
        );
      }

      const saltosNum = formulario.saltos
        ? parseInt(formulario.saltos, 10)
        : null;
      if (saltosNum !== null && saltosNum < 0) {
        erroresValidacion.push(
          `${jugador.nombre_jugador}: saltos debe ser un número positivo.`,
        );
      }

      for (const [campo, valor] of Object.entries({
        agilidad: formulario.agilidad,
        core: formulario.core,
        salto: formulario.salto,
        navette: formulario.navette,
      })) {
        if (valor !== "" && parseInt(valor, 10) < 0) {
          erroresValidacion.push(
            `${jugador.nombre_jugador}: ${campo} debe ser un número positivo.`,
          );
        }
      }
    }

    if (erroresValidacion.length > 0) {
      Alert.alert("Error de validación", erroresValidacion.join("\n"), [
        { text: "OK" },
      ]);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const erroresGuardado: string[] = [];
      for (const jugador of jugadores) {
        const idJugador = jugador.id_jugador!;
        const formulario = formularios.get(idJugador);
        if (!formulario) continue;

        const rpeNum = formulario.rpe ? parseInt(formulario.rpe, 10) : null;
        const saltosNum = formulario.saltos
          ? parseInt(formulario.saltos, 10)
          : null;

        // Guardar RPE y saltos en registro_jugador_sesion
        const registroExistente = registrosExistentes.find(
          (r) => r.id_jugador === idJugador,
        );

        try {
          if (registroExistente) {
            // Actualizar registro existente
            await supabase
              .from("registro_jugador_sesion")
              .update({
                rpe_registro: rpeNum,
                saltos_registro: saltosNum,
              })
              .eq("id_jugador", idJugador)
              .eq("id_sesion", sesion.id_sesion);
          } else {
            // Crear nuevo registro
            await supabase.from("registro_jugador_sesion").insert([
              {
                id_jugador: idJugador,
                id_sesion: sesion.id_sesion,
                rpe_registro: rpeNum,
                saltos_registro: saltosNum,
              },
            ]);
          }
        } catch {
          erroresGuardado.push(jugador.nombre_jugador ?? "Jugador");
          continue;
        }

        // Guardar pruebas físicas
        const agilidadNum = formulario.agilidad
          ? parseInt(formulario.agilidad, 10)
          : null;
        const coreNum = formulario.core
          ? parseInt(formulario.core, 10)
          : null;
        const saltoNum = formulario.salto
          ? parseInt(formulario.salto, 10)
          : null;
        const navetteNum = formulario.navette
          ? parseInt(formulario.navette, 10)
          : null;

        const pruebasExistentes = await obtenerPruebasFisicasPorJugador(
          idJugador,
        );
        const pruebaExistente = pruebasExistentes[0] ?? null;

        try {
          if (pruebaExistente) {
            await actualizarPruebaFisica(pruebaExistente.id_prueba, {
              agilidad_pruebas: agilidadNum,
              core_pruebas: coreNum,
              salto_pruebas: saltoNum,
              navette_pruebas: navetteNum,
              fecha_pruebas: sesion.fecha_sesion ?? undefined,
            });
          } else {
            await registrarPruebaFisica({
              id_jugador: idJugador,
              agilidad_pruebas: agilidadNum,
              core_pruebas: coreNum,
              salto_pruebas: saltoNum,
              navette_pruebas: navetteNum,
              fecha_pruebas: sesion.fecha_sesion ?? undefined,
            });
          }
        } catch {
          erroresGuardado.push(jugador.nombre_jugador ?? "Jugador");
        }
      }

      if (erroresGuardado.length > 0) {
        setError(
          `No se pudieron guardar los datos de: ${erroresGuardado.join(
            ", ",
          )}. Intenta nuevamente.`,
        );
        return;
      }

      Alert.alert(
        "Éxito",
        "Datos de la sesión guardados correctamente.",
        [
          {
            text: "OK",
            onPress: () => router.replace(`/calendario`),
          },
        ],
      );
    } catch (err) {
      setError("No se pudieron guardar los datos. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando datos de la sesión…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sesion || error) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.error }]}>
            {error || "Sesión no encontrada"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.errorBackButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.backButtonText, { color: theme.primaryText }]}>
              Volver al calendario
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
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
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              Volver
            </Text>
          </Pressable>
          <View style={styles.tituloSesion}>
            <Text style={[styles.kicker, { color: theme.primary }]}>
              CAPTURA DE DATOS DE SESIÓN
            </Text>
            <Text style={[styles.titulo, { color: theme.text }]}>
              {sesion.fecha_sesion ?? "Sin fecha"}
            </Text>
            <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>
              {jugadores.length === 1
                ? "1 jugador"
                : `${jugadores.length} jugadores`}
            </Text>
          </View>
        </View>

        {/* Estado de error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Nota sobre bienestar */}
        <View style={styles.notaBienestar}>
          <SymbolView
            name="info.circle"
            size={16}
            tintColor={theme.textSecondary}
            style={styles.iconoNota}
          />
          <Text style={[styles.textoNota, { color: theme.textSecondary }]}>
            Los campos de bienestar (sueño, fatiga, molestias) requieren una
            tabla adicional en la base de datos. Por ahora se muestran como
            referencia pero no se guardan.
          </Text>
        </View>

        {/* Lista de jugadores con formularios de captura */}
        <View style={styles.jugadoresContainer}>
          {jugadores.map((jugador) => {
            const formulario = formularios.get(jugador.id_jugador!);
            const posicionNombre = jugador.posiciones?.nombre_posicion ?? "Sin posición";
            return (
              <View
                key={jugador.id_jugador}
                style={styles.jugadorCard}
              >
                <View style={styles.jugadorHeader}>
                  <View style={styles.jugadorInfo}>
                    <Text style={[styles.jugadorNombre, { color: theme.text }]}>
                      {jugador.nombre_jugador}
                    </Text>
                    <Text style={[styles.jugadorPosicion, { color: theme.textSecondary }]}>
                      {posicionNombre}
                    </Text>
                  </View>
                  <SymbolView
                    name={{
                      ios: "chevron.down",
                      android: "arrow_drop_down",
                      web: "arrow_drop_down",
                    }}
                    size={18}
                    tintColor={theme.textSecondary}
                    style={styles.iconoExpandir}
                  />
                </View>

                <View style={styles.formularioCampos}>
                  {/* RPE */}
                  <View style={styles.campoGrupo}>
                    <Text style={[styles.campoLabel, { color: theme.text }]}>
                      RPE (1-10)
                    </Text>
                    <TextInput
                      style={[
                        styles.campoInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="1-10"
                      placeholderTextColor={theme.textSecondary}
                      value={formulario?.rpe ?? ""}
                      onChangeText={(v) =>
                        actualizarCampo(jugador.id_jugador!, "rpe", v)
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Saltos */}
                  <View style={styles.campoGrupo}>
                    <Text style={[styles.campoLabel, { color: theme.text }]}>
                      Saltos
                    </Text>
                    <TextInput
                      style={[
                        styles.campoInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Número de saltos"
                      placeholderTextColor={theme.textSecondary}
                      value={formulario?.saltos ?? ""}
                      onChangeText={(v) =>
                        actualizarCampo(jugador.id_jugador!, "saltos", v)
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Bienestar (informativo) */}
                  <View style={styles.campoGrupoBienestar}>
                    <Text style={[styles.campoLabelBienestar, { color: theme.textSecondary }]}>
                      Bienestar (informativo)
                    </Text>
                    <View style={styles.bienestarRow}>
                      <View style={styles.bienestarCampo}>
                        <Text style={[styles.bienestarLabel, { color: theme.textSecondary }]}>
                          Sueño
                        </Text>
                        <TextInput
                          style={[
                            styles.bienestarInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="1-5"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.sueno ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(
                              jugador.id_jugador!,
                              "sueno",
                              v,
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.bienestarCampo}>
                        <Text style={[styles.bienestarLabel, { color: theme.textSecondary }]}>
                          Fatiga
                        </Text>
                        <TextInput
                          style={[
                            styles.bienestarInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="1-5"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.fatiga ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(
                              jugador.id_jugador!,
                              "fatiga",
                              v,
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.bienestarCampo}>
                        <Text style={[styles.bienestarLabel, { color: theme.textSecondary }]}>
                          Molestias
                        </Text>
                        <TextInput
                          style={[
                            styles.bienestarInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="1-5"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.molestias ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(
                              jugador.id_jugador!,
                              "molestias",
                              v,
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Pruebas físicas */}
                  <View style={styles.pruebasContainer}>
                    <Text style={[styles.pruebasTitulo, { color: theme.text }]}>
                      Pruebas físicas
                    </Text>
                    <View style={styles.pruebasRow}>
                      <View style={styles.pruebaCampo}>
                        <Text style={[styles.pruebaLabel, { color: theme.textSecondary }]}>
                          Agilidad
                        </Text>
                        <TextInput
                          style={[
                            styles.pruebaInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="Segundos"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.agilidad ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(
                              jugador.id_jugador!,
                              "agilidad",
                              v,
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.pruebaCampo}>
                        <Text style={[styles.pruebaLabel, { color: theme.textSecondary }]}>
                          Core
                        </Text>
                        <TextInput
                          style={[
                            styles.pruebaInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="Segundos"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.core ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(jugador.id_jugador!, "core", v)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.pruebaCampo}>
                        <Text style={[styles.pruebaLabel, { color: theme.textSecondary }]}>
                          Salto (cm)
                        </Text>
                        <TextInput
                          style={[
                            styles.pruebaInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="cm"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.salto ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(
                              jugador.id_jugador!,
                              "salto",
                              v,
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.pruebaCampo}>
                        <Text style={[styles.pruebaLabel, { color: theme.textSecondary }]}>
                          Navette
                        </Text>
                        <TextInput
                          style={[
                            styles.pruebaInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.backgroundElement,
                              borderColor: theme.border,
                            },
                          ]}
                          placeholder="Nivel"
                          placeholderTextColor={theme.textSecondary}
                          value={formulario?.navette ?? ""}
                          onChangeText={(v) =>
                            actualizarCampo(
                              jugador.id_jugador!,
                              "navette",
                              v,
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Botón guardar */}
        <Pressable
          onPress={handleGuardar}
          disabled={guardando}
          style={[
            styles.botonGuardar,
            {
              backgroundColor: guardando ? "#9CA3AF" : theme.primary,
            },
          ]}
        >
          {guardando ? (
            <ActivityIndicator size="small" color={theme.primaryText} />
          ) : (
            <Text style={[styles.botonGuardarTexto, { color: theme.primaryText }]}>
              Guardar datos de la sesión
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tituloSesion: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  errorContainer: {
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
  errorBackButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBanner: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: 10,
    padding: 10,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  notaBienestar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(224, 158, 0, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: "rgba(224, 158, 0, 0.3)",
  },
  iconoNota: {
    marginTop: 2,
  },
  textoNota: {
    fontSize: 13,
    lineHeight: 18,
  },
  jugadoresContainer: {
    gap: Spacing.three,
  },
  jugadorCard: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  jugadorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: theme.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorNombre: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
  },
  jugadorPosicion: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  iconoExpandir: {
    marginLeft: 8,
  },
  formularioCampos: {
    padding: 14,
  },
  campoGrupo: {
    marginBottom: Spacing.three,
  },
  campoLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  campoInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  campoGrupoBienestar: {
    marginBottom: Spacing.three,
  },
  campoLabelBienestar: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  bienestarRow: {
    flexDirection: "row",
    gap: 8,
  },
  bienestarCampo: {
    flex: 1,
  },
  bienestarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  bienestarInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  pruebasContainer: {
    marginTop: 8,
  },
  pruebasTitulo: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  pruebasRow: {
    flexDirection: "row",
    gap: 8,
  },
  pruebaCampo: {
    flex: 1,
  },
  pruebaLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  pruebaInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  botonGuardar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: Spacing.four,
    marginBottom: Spacing.six,
  },
  botonGuardarTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
});
