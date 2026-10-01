import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="comments/[postId]" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="setup-admin" />
    </Stack>
  );
}