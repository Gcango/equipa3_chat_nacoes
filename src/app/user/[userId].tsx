import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { FollowButton } from '../../components/FollowButton';
import { PostGrid } from '../../components/PostGrid';
import { abrirChatComUser } from '../../services/chats';
import { escutarContadores } from '../../services/follows';
import { escutarContagemPosts } from '../../services/posts';
import { getUserProfile, UserProfile } from '../../services/users';

const ROLE_CORES: Record<string, string> = {
  aluno: '#007AFF',
  professor: '#34C759',
  admin: '#FF3B30',
};

type Aba = 'posts' | 'reels';

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [aAbrirChat, setAAbrirChat] = useState(false);
  const [contadores, setContadores] = useState({
    seguidores: 0,
    aSeguir: 0,
    publicacoes: 0,
  });
  const [abaAtiva, setAbaAtiva] = useState<Aba>('posts');

  useEffect(() => {
    if (!userId) return;

    getUserProfile(userId)
      .then((p) => {
        setProfile(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const unsub1 = escutarContadores(userId, (data) => {
      setContadores((prev) => ({
        ...prev,
        seguidores: data.seguidores,
        aSeguir: data.aSeguir,
      }));
    });
    const unsub2 = escutarContagemPosts(userId, (total) => {
      setContadores((prev) => ({ ...prev, publicacoes: total }));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [userId]);

  async function handleEnviarMensagem() {
    if (!profile) return;
    setAAbrirChat(true);
    try {
      const chatId = await abrirChatComUser(profile.uid);
      router.push(`/chat/${chatId}` as any);
    } catch (e) {
      console.error('Erro ao abrir chat:', e);
    } finally {
      setAAbrirChat(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Utilizador não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleCor = ROLE_CORES[profile.role] || '#666';
  const nomeExibir = profile.nome || profile.email.split('@')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nomeExibir}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  `/follows/${profile.uid}?tipo=seguidores` as any
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
                  `/follows/${profile.uid}?tipo=aSeguir` as any
                )
              }
            >
              <Text style={styles.statNum}>{contadores.aSeguir}</Text>
              <Text style={styles.statLabel}>a seguir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bio}>
          <Text style={styles.nome}>{nomeExibir}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}>
            <Text style={[styles.roleText, { color: roleCor }]}>
              {profile.role}
            </Text>
          </View>
          {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.actions}>
          <FollowButton userId={profile.uid} />
          <TouchableOpacity
            style={styles.msgButton}
            onPress={handleEnviarMensagem}
            disabled={aAbrirChat}
            activeOpacity={0.7}
          >
            {aAbrirChat ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color="#2563EB"
                />
                <Text style={styles.msgButtonText}>Mensagem</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  scrollContent: { paddingBottom: 24 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  avatarWrapper: { marginRight: 24 },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#007AFF',
  },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  bio: { paddingHorizontal: 20, marginBottom: 16 },
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
  roleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  bioText: { fontSize: 14, color: '#333', lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  msgButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  msgButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
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
  tabActive: { borderBottomColor: '#1a1a1a' },
  emptyTab: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyTabText: { fontSize: 14, color: '#999' },
});