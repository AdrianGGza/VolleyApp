import { supabase } from "@/services/supabase";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Paleta de colores semánticos exacta de Apple (Human Interface Guidelines - iOS)
 * Se adapta automáticamente entre Modo Claro (Light) y Modo Oscuro (Dark).
 */
const APPLE_COLORS = {
  light: {
    systemGroupedBackground: "#F2F2F7",
    secondarySystemGroupedBackground: "#FFFFFF",
    label: "#000000",
    secondaryLabel: "rgba(60, 60, 67, 0.60)",
    placeholderText: "rgba(60, 60, 67, 0.30)",
    separator: "rgba(60, 60, 67, 0.29)",
    systemBlue: "#007AFF",
    systemRed: "#FF3B30",
  },
  dark: {
    systemGroupedBackground: "#000000",
    secondarySystemGroupedBackground: "#1C1C1E",
    label: "#FFFFFF",
    secondaryLabel: "rgba(235, 235, 245, 0.60)",
    placeholderText: "rgba(235, 235, 245, 0.30)",
    separator: "rgba(84, 84, 88, 0.65)",
    systemBlue: "#0A84FF",
    systemRed: "#FF453A",
  },
} as const;

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? APPLE_COLORS.dark : APPLE_COLORS.light;

  // Estados del formulario (nombres de dominio en español)
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Referencia para pasar el foco del correo a la contraseña con el teclado
  const contrasenaInputRef = useRef<TextInput>(null);

  const iniciarSesion = async () => {
    Keyboard.dismiss();
    setMensajeError(null);

    const correoLimpio = correo.trim();

    if (!correoLimpio || !contrasena) {
      setMensajeError("Por favor, ingresa tu correo electrónico y contraseña.");
      return;
    }

    setCargando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: correoLimpio,
        password: contrasena,
      });

      if (error) {
        setMensajeError(
          "Credenciales incorrectas. Revisa tu correo y contraseña e intenta de nuevo."
        );
      }
    } catch {
      setMensajeError(
        "No se pudo conectar con el servidor. Verifica tu conexión a internet."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.systemGroupedBackground },
      ]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            {/* Encabezado siguiendo la jerarquía tipográfica de Apple (Large Title + Subheadline) */}
            <View style={styles.headerContainer}>
              <Text style={[styles.largeTitle, { color: theme.label }]}>
                VolleyApp
              </Text>
              <Text
                style={[styles.subheadline, { color: theme.secondaryLabel }]}
              >
                Ingresa con tu cuenta de entrenador
              </Text>
            </View>

            {/* Contenedor agrupado estilo iOS (Grouped Table / Form) */}
            <View
              style={[
                styles.groupedCard,
                { backgroundColor: theme.secondarySystemGroupedBackground },
              ]}
            >
              {/* Campo: Correo electrónico */}
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: theme.label }]}
                  placeholder="Correo electrónico"
                  placeholderTextColor={theme.placeholderText}
                  value={correo}
                  onChangeText={(texto) => {
                    setCorreo(texto);
                    if (mensajeError) setMensajeError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => contrasenaInputRef.current?.focus()}
                  editable={!cargando}
                  accessibilityLabel="Correo electrónico"
                />
              </View>

              {/* Separador sutil estilo iOS */}
              <View
                style={[
                  styles.separator,
                  { backgroundColor: theme.separator },
                ]}
              />

              {/* Campo: Contraseña */}
              <View style={styles.inputRow}>
                <TextInput
                  ref={contrasenaInputRef}
                  style={[styles.input, { color: theme.label }]}
                  placeholder="Contraseña"
                  placeholderTextColor={theme.placeholderText}
                  value={contrasena}
                  onChangeText={(texto) => {
                    setContrasena(texto);
                    if (mensajeError) setMensajeError(null);
                  }}
                  secureTextEntry={!mostrarContrasena}
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={iniciarSesion}
                  editable={!cargando}
                  accessibilityLabel="Contraseña"
                />
                <Pressable
                  onPress={() => setMostrarContrasena((prev) => !prev)}
                  style={styles.toggleButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  <Text
                    style={[styles.toggleText, { color: theme.systemBlue }]}
                  >
                    {mostrarContrasena ? "Ocultar" : "Mostrar"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Mensaje de error en línea (Footnote en System Red) */}
            {mensajeError ? (
              <View
                style={styles.errorContainer}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={[styles.errorText, { color: theme.systemRed }]}>
                  {mensajeError}
                </Text>
              </View>
            ) : null}

            {/* Botón principal (Prominent Button Style de Apple, mínimo 44x44 pt) */}
            <Pressable
              onPress={iniciarSesion}
              disabled={cargando}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
              accessibilityState={{ busy: cargando, disabled: cargando }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.systemBlue,
                  opacity: cargando ? 0.6 : pressed ? 0.8 : 1,
                },
              ]}
            >
              {cargando ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primaryButtonText}>
                    Iniciando sesión…
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.37,
    lineHeight: 41,
    marginBottom: 8,
    textAlign: "center",
  },
  subheadline: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: -0.24,
    lineHeight: 20,
    textAlign: "center",
  },
  groupedCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.41,
    paddingVertical: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  toggleButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "500",
  },
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: -0.08,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.41,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
