import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SidebarItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const ITEMS: SidebarItem[] = [
  { name: 'feed', label: 'Página inicial', icon: 'home-outline', route: '/(tabs)/feed' },
  { name: 'reels', label: 'Reels', icon: 'videocam-outline', route: '/(tabs)/reels' },
  { name: 'notifications', label: 'Notificações', icon: 'notifications-outline', route: '/(tabs)/notifications' },
  { name: 'profile', label: 'Perfil', icon: 'person-outline', route: '/(tabs)/profile' },
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
      {/* Logo */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/ChatNacoes.png')}
          style={expanded ? styles.logo : styles.logoSmall}
          resizeMode="contain"
        />
        {expanded && <Text style={styles.headerTitle}>Chat Nações</Text>}
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
    paddingTop: 24,
    paddingHorizontal: 12,
    height: '100%',
    ...({ transitionDuration: '200ms' } as any),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 60,
    justifyContent: 'center',
  },
  logoSmall: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  menu: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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