import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Sidebar } from '../../components/Sidebar';
import { escutarChats } from '../../services/chats';
import { auth } from '../../services/firebase';

const DESKTOP_BREAKPOINT = 768;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  const [naoLidasChats, setNaoLidasChats] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = escutarChats(user.uid, (chats) => {
      const total = chats.filter(
        (c) => (c.naoLidas?.[user.uid] || 0) > 0
      ).length;
      setNaoLidasChats(total);
    });

    return () => unsub();
  }, []);

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar />
        <View style={styles.content}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tabs.Screen name="feed" />
            <Tabs.Screen name="reels" />
            <Tabs.Screen name="notifications" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name="create-post" options={{ href: null }} />
            <Tabs.Screen name="user/[userId]" options={{ href: null }} />
            <Tabs.Screen name="edit-profile" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ href: null }} />
            <Tabs.Screen name="messages" options={{ href: null }} />
            <Tabs.Screen name="dashboard" options={{ href: null }} />
            <Tabs.Screen name="create-story" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name="chatbubble-outline" size={size} color={color} />
              {naoLidasChats > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {naoLidasChats > 99 ? '99+' : naoLidasChats}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Pesquisa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="videocam-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Rotas ocultas */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="create-post" options={{ href: null }} />
      <Tabs.Screen name="user/[userId]" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="create-story" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f2f5',
  },
  content: {
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});