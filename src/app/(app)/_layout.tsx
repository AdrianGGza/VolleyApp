import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="equipo/[id]" />
      <Stack.Screen name="rutina/[id]" />
      <Stack.Screen name="ejercicios" />
      <Stack.Screen name="ejercicio/[id]" />
    </Stack>
  );
}
