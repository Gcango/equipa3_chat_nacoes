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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { escutarContagemComentarios } from '../../services/comments';
import { auth } from '../../services/firebase';
import {
  addLike,
  escutarPosts,
  formatarTempoRelativo,
  Post,
  removeLike,
} from '../../services/posts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = Math.min(SCREEN_WIDTH - 32, 568);

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = escutarPosts((lista) => {
      setPosts(lista);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  function renderPost({ item }: { item: Post }) {
    return (
      <View style={styles.postCard}>
        {/* Header clicável → abre perfil do autor */}
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => router.push(`/(tabs)/user/${item.autorId}` as any)}
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
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Chat Nações</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/create-post')}
          >
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Ainda não há publicações</Text>
            <Text style={styles.emptySubtitle}>
              Sê o primeiro a publicar algo!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/create-post')}
            >
              <Text style={styles.emptyButtonText}>Criar publicação</Text>
            </TouchableOpacity>
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
        router.push(
          `/comments/${postId}?postAutorId=${postAutorId}` as any
        )
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
  headerButton: {
    padding: 4,
  },
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
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