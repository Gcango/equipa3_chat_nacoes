import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/users';

interface SidebarItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  apenasAdmin?: boolean;
}

const ITEMS_BASE: SidebarItem[] = [
  { name: 'feed', label: 'Página inicial', icon: 'home-outline', route: '/(tabs)/feed' },
  { name: 'search', label: 'Pesquisa', icon: 'search-outline', route: '/(tabs)/search' },
  { name: 'reels', label: 'Reels', icon: 'videocam-outline', route: '/(tabs)/reels' },
  { name: 'messages', label: 'Mensagens', icon: 'chatbubble-outline', route: '/(tabs)/messages' },
  { name: 'notifications', label: 'Notificações', icon: 'notifications-outline', route: '/(tabs)/notifications' },
];

const ITEMS_ADMIN: SidebarItem[] = [
  { name: 'dashboard', label: 'Painel', icon: 'stats-chart-outline', route: '/(tabs)/dashboard', apenasAdmin: true },
];

const ITEMS_FIM: SidebarItem[] = [
  { name: 'profile', label: 'Perfil', icon: 'person-outline', route: '/(tabs)/profile' },
];

const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 240;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getUserProfile(user.uid).then((perfil) => {
      setIsAdmin(perfil?.role === 'admin');
    });
  }, []);

  function isActive(route: string): boolean {
    const cleanRoute = route.replace('/(tabs)', '');
    return pathname === cleanRoute || pathname.startsWith(cleanRoute);
  }

  const items = [
    ...ITEMS_BASE,
    ...(isAdmin ? ITEMS_ADMIN : []),
    ...ITEMS_FIM,
  ];

  return (
    <View
      style={[
        styles.sidebar,
        { width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH },
      ]}
      // @ts-ignore
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/ChatNacoes.png')}
          style={expanded ? styles.logo : styles.logoSmall}
          resizeMode="contain"
        />
        {expanded && <Text style={styles.headerTitle}></Text>}
      </View>

      <View style={styles.menu}>
        {items.map((item) => {
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
  logoSmall: { width: 44, height: 44, borderRadius: 10 },
  logo: {
    width: 170,
    height: 110,
    borderRadius: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  menu: { gap: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 14,
  },
  menuItemExpanded: { justifyContent: 'flex-start' },
  menuItemActive: { backgroundColor: '#e8f0fe' },
  menuLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
  menuLabelActive: { color: '#007AFF', fontWeight: '600' },
});