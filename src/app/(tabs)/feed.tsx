import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { escutarContagemComentarios } from '../../services/comments';
import { auth } from '../../services/firebase';
import {
  addLike,
  escutarFeedPersonalizado,
  escutarPosts,
  escutarSeguidos,
  formatarTempoRelativo,
  Post,
  removeLike,
} from '../../services/posts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = Math.min(SCREEN_WIDTH - 32, 568);
const DESKTOP_BREAKPOINT = 768;

type Aba = 'parati' | 'explorar';

export default function FeedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  const [abaAtiva, setAbaAtiva] = useState<Aba>('parati');
  const [postsParaTi, setPostsParaTi] = useState<Post[]>([]);
  const [postsExplorar, setPostsExplorar] = useState<Post[]>([]);
  const [seguidosIds, setSeguidosIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Escuta "Para ti" (só posts de quem sigo)
    const unsub1 = escutarFeedPersonalizado(user.uid, (lista) => {
      setPostsParaTi(lista);
    });

    // Escuta "Explorar" (todos os posts — filtragem no cliente)
    const unsub2 = escutarPosts((lista) => {
      setPostsExplorar(lista);
      setLoading(false);
      setRefreshing(false);
    });

    // Escuta quem eu sigo (para filtrar Explorar)
    const unsub3 = escutarSeguidos(user.uid, setSeguidosIds);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  // Filtra o Explorar: exclui os meus posts e posts de quem sigo
  const meuUid = auth.currentUser?.uid;
  const postsExplorarFiltrados = postsExplorar.filter((post) => {
    if (post.autorId === meuUid) return false;
    if (seguidosIds.includes(post.autorId)) return false;
    return true;
  });

  const posts = abaAtiva === 'parati' ? postsParaTi : postsExplorarFiltrados;

  function renderPost({ item }: { item: Post }) {
    return (
      <View style={styles.postCard}>
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => router.push(`/user/${item.autorId}` as any)}
          activeOpacity={0.7}
        >
          {item.autorFotoURL ? (
            <Image source={{ uri: item.autorFotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {item.autorNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthorNome}>{item.autorNome}</Text>
            <Text style={styles.postMeta}>
              {item.autorRole} · {formatarTempoRelativo(item.criadoEm)}
            </Text>
          </View>
        </TouchableOpacity>

        {item.conteudo ? (
          <Text style={styles.postConteudo}>{item.conteudo}</Text>
        ) : null}

        {item.imagens && item.imagens.length > 0 && (
          <ImageCarousel imagens={item.imagens} />
        )}

        <View style={styles.postFooter}>
          <LikeButton post={item} />
          <CommentButton postId={item.id} postAutorId={item.autorId} />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        {isDesktop ? (
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Chat Nações</Text>
            <View style={styles.headerSpacer} />
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(tabs)/create-post')}
            >
              <Ionicons name="add-circle-outline" size={28} color="#1a1a1a" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Chat Nações</Text>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Ionicons name="notifications-outline" size={26} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        )}

        {/* Abas internas */}
        <View style={styles.innerTabs}>
          <TouchableOpacity
            style={[styles.innerTab, abaAtiva === 'parati' && styles.innerTabActive]}
            onPress={() => setAbaAtiva('parati')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.innerTabText,
                abaAtiva === 'parati' && styles.innerTabTextActive,
              ]}
            >
              Para ti
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.innerTab,
              abaAtiva === 'explorar' && styles.innerTabActive,
            ]}
            onPress={() => setAbaAtiva('explorar')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.innerTabText,
                abaAtiva === 'explorar' && styles.innerTabTextActive,
              ]}
            >
              Explorar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {abaAtiva === 'parati'
                ? postsParaTi.length === 0 && seguidosIds.length === 0
                  ? 'Ainda não segues ninguém'
                  : 'Sem publicações'
                : 'Tudo visto por aqui'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {abaAtiva === 'parati'
                ? seguidosIds.length === 0
                  ? 'Descobre pessoas em "Explorar" e começa a seguir.'
                  : 'As pessoas que segues ainda não publicaram nada.'
                : 'Já viste todas as publicações da comunidade.'}
            </Text>
            {abaAtiva === 'parati' && seguidosIds.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setAbaAtiva('explorar')}
              >
                <Text style={styles.emptyButtonText}>Ir para Explorar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </SafeAreaView>
    </ScreenContainer>
  );
}

function ImageCarousel({ imagens }: { imagens: string[] }) {
  const [indexAtivo, setIndexAtivo] = useState(0);

  if (imagens.length === 1) {
    return (
      <Image
        source={{ uri: imagens[0] }}
        style={styles.imagemUnica}
        resizeMode="cover"
      />
    );
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    setIndexAtivo(index);
  }

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={IMAGE_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {imagens.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={styles.imagemCarousel}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <View style={styles.indicators}>
        {imagens.map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicator,
              i === indexAtivo && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {indexAtivo + 1}/{imagens.length}
        </Text>
      </View>
    </View>
  );
}

function LikeButton({ post }: { post: Post }) {
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(false);

  const curtiu = uid ? post.curtidas.includes(uid) : false;
  const total = post.curtidas.length;

  async function handlePress() {
    if (loading) return;
    setLoading(true);
    try {
      if (curtiu) {
        await removeLike(post.id);
      } else {
        await addLike(post.id);
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.postAction}
      onPress={handlePress}
      disabled={loading}
    >
      <Ionicons
        name={curtiu ? 'heart' : 'heart-outline'}
        size={22}
        color={curtiu ? '#ff3b30' : '#666'}
      />
      <Text
        style={[
          styles.postActionText,
          curtiu && { color: '#ff3b30', fontWeight: '600' },
        ]}
      >
        {total}
      </Text>
    </TouchableOpacity>
  );
}

function CommentButton({
  postId,
  postAutorId,
}: {
  postId: string;
  postAutorId: string;
}) {
  const router = useRouter();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const unsubscribe = escutarContagemComentarios(postId, setTotal);
    return () => unsubscribe();
  }, [postId]);

  return (
    <TouchableOpacity
      style={styles.postAction}
      onPress={() =>
        router.push(`/comments/${postId}?postAutorId=${postAutorId}` as any)
      }
    >
      <Ionicons name="chatbubble-outline" size={20} color="#666" />
      <Text style={styles.postActionText}>{total}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBtn: {
    padding: 4,
    width: 36,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },

  // ============ ABAS INTERNAS ============
  innerTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  innerTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  innerTabActive: {
    borderBottomColor: '#007AFF',
  },
  innerTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  innerTabTextActive: {
    color: '#007AFF',
  },

  // ============ LISTA ============
  listContent: {
    padding: 8,
    paddingBottom: 24,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postAuthorNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  postConteudo: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  imagemUnica: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagemCarousel: {
    width: IMAGE_WIDTH,
    height: 280,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 13,
    color: '#666',
  },

  // ============ ESTADO VAZIO ============
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});