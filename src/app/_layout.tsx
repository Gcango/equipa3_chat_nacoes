import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="comments/[postId]" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="follows/[userId]" />
      <Stack.Screen name="user/[userId]" />
      <Stack.Screen name="story/[userId]" />
      <Stack.Screen name="chat/[chatId]" />
      <Stack.Screen name="nova-conversa" />
      <Stack.Screen name="create-reel" />
      <Stack.Screen name="reel/[reelId]" />
      <Stack.Screen name="setup-admin" />
      <Stack.Screen name="migrar-usernames" />
    </Stack>
  );
}