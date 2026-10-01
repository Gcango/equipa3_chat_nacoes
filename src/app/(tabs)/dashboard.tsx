import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import { getUserProfile } from '../../services/users';

type Aba = 'visao' | 'denuncias' | 'utilizadores';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('visao');

  useEffect(() => {
    verificarAcesso();
  }, []);

  async function verificarAcesso() {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const perfil = await getUserProfile(user.uid);
    if (perfil?.role !== 'admin') {
      router.replace('/(tabs)/profile');
      return;
    }

    setAutorizado(true);
    setLoading(false);
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  if (!autorizado) return null;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Painel</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* Abas */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'visao' && styles.tabActive]}
            onPress={() => setAbaAtiva('visao')}
          >
            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={abaAtiva === 'visao' ? '#007AFF' : '#999'}
            />
            <Text
              style={[
                styles.tabText,
                abaAtiva === 'visao' && styles.tabTextActive,
              ]}
            >
              Visão geral
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'denuncias' && styles.tabActive]}
            onPress={() => setAbaAtiva('denuncias')}
          >
            <Ionicons
              name="flag-outline"
              size={20}
              color={abaAtiva === 'denuncias' ? '#007AFF' : '#999'}
            />
            <Text
              style={[
                styles.tabText,
                abaAtiva === 'denuncias' && styles.tabTextActive,
              ]}
            >
              Denúncias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              abaAtiva === 'utilizadores' && styles.tabActive,
            ]}
            onPress={() => setAbaAtiva('utilizadores')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={abaAtiva === 'utilizadores' ? '#007AFF' : '#999'}
            />
            <Text
              style={[
                styles.tabText,
                abaAtiva === 'utilizadores' && styles.tabTextActive,
              ]}
            >
              Utilizadores
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo das abas (a construir nas próximas partes) */}
        <ScrollView contentContainerStyle={styles.content}>
          {abaAtiva === 'visao' && (
            <View style={styles.placeholder}>
              <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
              <Text style={styles.placeholderText}>Visão geral</Text>
              <Text style={styles.placeholderSub}>A construir na Parte 2</Text>
            </View>
          )}

          {abaAtiva === 'denuncias' && (
            <View style={styles.placeholder}>
              <Ionicons name="flag-outline" size={64} color="#ccc" />
              <Text style={styles.placeholderText}>Denúncias</Text>
              <Text style={styles.placeholderSub}>A construir na Parte 3</Text>
            </View>
          )}

          {abaAtiva === 'utilizadores' && (
            <View style={styles.placeholder}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.placeholderText}>Utilizadores</Text>
              <Text style={styles.placeholderSub}>A construir na Parte 4</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholderSub: {
    fontSize: 14,
    color: '#999',
  },
});