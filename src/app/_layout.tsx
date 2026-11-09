import { supabase } from "@/services/supabase";
import type { Session } from "@supabase/supabase-js";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // undefined = todavía cargando sesión; null = sin sesión; Session = con sesión activa
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined);
  const splashOcultoRef = useRef(false);

  useEffect(() => {
    let activo = true;
    let resueltoPorEvento = false;

    // Nos suscribimos primero para no perder ningún evento que ocurra mientras getSession() está en vuelo.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) return;
      // Si llega un cambio de estado real (ej. SIGNED_OUT, TOKEN_REFRESHED, SIGNED_IN)
      // antes de que termine getSession(), marcamos que ya hay un estado más reciente
      // para que la respuesta tardía de getSession() no lo sobrescriba con un valor viejo.
      if (event !== "INITIAL_SESSION") {
        resueltoPorEvento = true;
      }
      setSesion(session ?? null);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!activo || resueltoPorEvento) return;

        if (error) {
          // Decisión de simplicidad (NO es una garantía de que no exista sesión ni una medida de seguridad):
          // Un fallo leyendo almacenamiento o refrescando el token por red no implica ausencia de sesión,
          // pero degradamos a `null` (enviando al login) por simplicidad para no añadir una pantalla intermedia.
          // Alternativa si se desea evitar que el entrenador reingrese su contraseña ante un fallo temporal:
          // guardar un estado de error y renderizar una pantalla con botón "Reintentar" que vuelva a llamar a getSession().
          setSesion(null);
          return;
        }

        setSesion(data.session ?? null);
      })
      .catch(() => {
        if (!activo || resueltoPorEvento) return;
        // Misma simplificación: ante una excepción inesperada, degradamos a `null` (login)
        // en vez de dejar el splash congelado o mostrar una vista adicional de reintento.
        setSesion(null);
      });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sesion !== undefined && !splashOcultoRef.current) {
      splashOcultoRef.current = true;
      SplashScreen.hideAsync();
    }
  }, [sesion]);

  if (sesion === undefined) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!sesion}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={!!sesion} redirectTo="/login">
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
