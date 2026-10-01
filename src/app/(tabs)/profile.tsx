import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostGrid } from '../../components/PostGrid';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import { escutarContadores } from '../../services/follows';
import { escutarContagemPosts } from '../../services/posts';
import {
  getUserProfile,
  marcarEmailVerificado,
  UserProfile,
} from '../../services/users';

const ROLE_CORES: Record<string, string> = {
  aluno: '#007AFF',
  professor: '#34C759',
  admin: '#FF3B30',
};

type Aba = 'posts' | 'reels';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contadores, setContadores] = useState({
    seguidores: 0,
    aSeguir: 0,
    publicacoes: 0,
  });
  const [abaAtiva, setAbaAtiva] = useState<Aba>('posts');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      if (user.emailVerified) {
        await marcarEmailVerificado(user.uid);
      }

      const dados = await getUserProfile(user.uid);
      if (dados) {
        setProfile({ ...dados, emailVerificado: user.emailVerified });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profile) return;

    const unsub1 = escutarContadores(profile.uid, (data) => {
      setContadores((prev) => ({
        ...prev,
        seguidores: data.seguidores,
        aSeguir: data.aSeguir,
      }));
    });
    const unsub2 = escutarContagemPosts(profile.uid, (total) => {
      setContadores((prev) => ({ ...prev, publicacoes: total }));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [profile]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text>Perfil não encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const roleCor = ROLE_CORES[profile.role] || '#666';
  const nomeExibir = profile.nome || profile.email.split('@')[0];

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{nomeExibir}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/edit-profile' as any)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          {/* Avatar + Contadores */}
          <View style={styles.topRow}>
            <View style={styles.avatarWrapper}>
              {profile.fotoURL ? (
                <Image source={{ uri: profile.fotoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {nomeExibir.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{contadores.publicacoes}</Text>
                <Text style={styles.statLabel}>publicações</Text>
              </View>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  router.push(
                    `/(tabs)/follows/${profile.uid}?tipo=seguidores` as any
                  )
                }
              >
                <Text style={styles.statNum}>{contadores.seguidores}</Text>
                <Text style={styles.statLabel}>seguidores</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  router.push(
                    `/(tabs)/follows/${profile.uid}?tipo=aSeguir` as any
                  )
                }
              >
                <Text style={styles.statNum}>{contadores.aSeguir}</Text>
                <Text style={styles.statLabel}>a seguir</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nome + Bio */}
          <View style={styles.bio}>
            <Text style={styles.nome}>{nomeExibir}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}>
              <Text style={[styles.roleText, { color: roleCor }]}>
                {profile.role}
              </Text>
            </View>
            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : null}
          </View>

          {/* Botão Editar perfil */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/(tabs)/edit-profile' as any)}
          >
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>

          {/* Abas */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, abaAtiva === 'posts' && styles.tabActive]}
              onPress={() => setAbaAtiva('posts')}
            >
              <Ionicons
                name="grid-outline"
                size={22}
                color={abaAtiva === 'posts' ? '#1a1a1a' : '#999'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, abaAtiva === 'reels' && styles.tabActive]}
              onPress={() => setAbaAtiva('reels')}
            >
              <Ionicons
                name="videocam-outline"
                size={22}
                color={abaAtiva === 'reels' ? '#1a1a1a' : '#999'}
              />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          {abaAtiva === 'posts' ? (
            <PostGrid userId={profile.uid} />
          ) : (
            <View style={styles.emptyTab}>
              <Ionicons name="videocam-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTabText}>Reels em breve</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 24 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarWrapper: { marginRight: 24 },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#007AFF',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  bio: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  nome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  editButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#efefef',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a1a1a',
  },
  emptyTab: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTabText: {
    fontSize: 14,
    color: '#999',
  },
});