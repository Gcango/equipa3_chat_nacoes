import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SidebarItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const ITEMS: SidebarItem[] = [
  { name: 'feed', label: 'Feed', icon: 'home-outline', route: '/(tabs)/feed' },
  { name: 'reels', label: 'Reels', icon: 'videocam-outline', route: '/(tabs)/reels' },
  { name: 'profile', label: 'Perfil', icon: 'person-outline', route: '/(tabs)/profile' },
  { name: 'notifications', label: 'Notificações', icon: 'notifications-outline', route: '/(tabs)/notifications' },
];

const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 240;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  function isActive(route: string): boolean {
    const cleanRoute = route.replace('/(tabs)', '');
    return pathname === cleanRoute || pathname.startsWith(cleanRoute);
  }

  return (
    <View
      style={[
        styles.sidebar,
        { width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH },
      ]}
      // @ts-ignore — onMouseEnter/Leave só existem no web
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Título */}
      <View style={styles.header}>
        {expanded ? (
          <Text style={styles.headerTitle}>Chat Nações</Text>
        ) : (
          <Text style={styles.headerTitleShort}>CN</Text>
        )}
      </View>

      {/* Itens */}
      <View style={styles.menu}>
        {ITEMS.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.menuItem,
                expanded && styles.menuItemExpanded,
                active && styles.menuItemActive,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={active ? '#007AFF' : '#333'}
              />
              {expanded && (
                <Text
                  style={[
                    styles.menuLabel,
                    active && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingTop: 32,
    paddingHorizontal: 12,
    height: '100%',
    // transição suave no web
    ...({ transitionDuration: '200ms' } as any),
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    minHeight: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  headerTitleShort: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  menu: {
    gap: 16, // ← mais espaço entre itens
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // quando colapsado, ícone ao centro
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 14,
  },
  menuItemExpanded: {
    justifyContent: 'flex-start',
  },
  menuItemActive: {
    backgroundColor: '#e8f0fe',
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});