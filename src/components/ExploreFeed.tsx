import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { escutarContagemComentarios } from '../services/comments';
import { auth } from '../services/firebase';
import { addLike, escutarPosts, Post, removeLike } from '../services/posts';
import { escutarReels, Reel } from '../services/reels';
import { FeedReelCard } from './FeedReelCard';
import { PostMenu } from './PostMenu';
import { ReportModal } from './ReportModal';
import { ShareModal } from './ShareModal';

const { width: SCREEN_W } = Dimensions.get('window');
const IMAGE_WIDTH = Math.min(SCREEN_W - 32, 568);

type ItemFeed =
  | { tipo: 'post'; dados: Post; ordem: number }
  | { tipo: 'reel'; dados: Reel; ordem: number };

const ROLE_CORES: Record<string, string> = {
  aluno: '#007AFF',
  professor: '#34C759',
  admin: '#FF3B30',
};

function formatarTempoRelativo(timestamp: any): string {
  if (!timestamp) return 'agora';
  let ms: number;
  if (timestamp.toMillis) ms = timestamp.toMillis();
  else if (typeof timestamp === 'string') ms = new Date(timestamp).getTime();
  else return 'agora';

  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return `há ${Math.floor(diff / 2592000)} meses`;
}

export function ExploreFeed() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexVisivel, setIndexVisivel] = useState(0);

  const [postMenuAberto, setPostMenuAberto] = useState<Post | null>(null);
  const [reportPostVisivel, setReportPostVisivel] = useState(false);
  const [shareAberto, setShareAberto] = useState<Post | null>(null);

  useEffect(() => {
    const unsub1 = escutarPosts((lista) => setPosts(lista));
    const unsub2 = escutarReels((lista) => {
      setReels(lista);
      setLoading(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const meuUid = auth.currentUser?.uid;

  const postsFiltrados = posts.filter((p) => p.autorId !== meuUid);
  const reelsFiltrados = reels.filter((r) => r.autorId !== meuUid);

  const todos: ItemFeed[] = [
    ...postsFiltrados.map((p) => ({
      tipo: 'post' as const,
      dados: p,
      ordem: p.criadoEm?.toMillis?.() || 0,
    })),
    ...reelsFiltrados.map((r) => ({
      tipo: 'reel' as const,
      dados: r,
      ordem: r.criadoEm?.toMillis?.() || 0,
    })),
  ].sort((a, b) => b.ordem - a.ordem);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setIndexVisivel(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (todos.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="compass-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Nada para explorar</Text>
      </View>
    );
  }

  function renderItem({ item, index }: { item: ItemFeed; index: number }) {
    if (item.tipo === 'reel') {
      return (
        <FeedReelCard
          reel={item.dados as Reel}
          estaVisivel={index === indexVisivel}
        />
      );
    }

    return (
      <PostFeedCard
        post={item.dados as Post}
        onMenuPress={() => setPostMenuAberto(item.dados as Post)}
        onSharePress={() => setShareAberto(item.dados as Post)}
      />
    );
  }

  return (
    <>
      <FlatList
        data={todos}
        keyExtractor={(item) => `${item.tipo}-${item.dados.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        removeClippedSubviews
      />

      <PostMenu
        visivel={!!postMenuAberto}
        fechar={() => setPostMenuAberto(null)}
        tipo="post"
        conteudoId={postMenuAberto?.id || ''}
        autorId={postMenuAberto?.autorId || ''}
        autorNome={postMenuAberto?.autorNome}
        onDenunciar={() => setReportPostVisivel(true)}
      />

      {postMenuAberto && (
        <ReportModal
          visivel={reportPostVisivel}
          fechar={() => setReportPostVisivel(false)}
          tipo="post"
          alvoId={postMenuAberto.id}
          postId={postMenuAberto.id}
          conteudoDenunciado={
            postMenuAberto.conteudo || '[Publicação com imagens]'
          }
        />
      )}

      <ShareModal
        visivel={!!shareAberto}
        fechar={() => setShareAberto(null)}
        partilha={
          shareAberto
            ? {
                tipo: 'post',
                partilhaId: shareAberto.id,
                partilhaAutor: shareAberto.autorNome,
                partilhaConteudo: shareAberto.conteudo || '',
                partilhaThumbURL:
                  shareAberto.imagens && shareAberto.imagens.length > 0
                    ? shareAberto.imagens[0]
                    : '',
              }
            : null
        }
      />
    </>
  );
}

function PostFeedCard({
  post,
  onMenuPress,
  onSharePress,
}: {
  post: Post;
  onMenuPress: () => void;
  onSharePress: () => void;
}) {
  const router = useRouter();
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(false);

  const curtiu = uid ? post.curtidas.includes(uid) : false;
  const total = post.curtidas.length;

  async function toggleLike() {
    if (loading) return;
    setLoading(true);
    try {
      if (curtiu) {
        await removeLike(post.id);
      } else {
        await addLike(post.id);
      }
    } catch (e) {
      console.error('Erro ao curtir:', e);
    } finally {
      setLoading(false);
    }
  }

  const roleCor = ROLE_CORES[post.autorRole] || '#666';

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postHeaderLeft}
          onPress={() => router.push(`/user/${post.autorId}` as any)}
          activeOpacity={0.7}
        >
          {post.autorFotoURL ? (
            <Image source={{ uri: post.autorFotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {post.autorNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.autorNome}>{post.autorNome}</Text>
            <View style={styles.metaRow}>
              <View
                style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}
              >
                <Text style={[styles.roleText, { color: roleCor }]}>
                  {post.autorRole}
                </Text>
              </View>
              <Text style={styles.meta}>
                {formatarTempoRelativo(post.criadoEm)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {post.conteudo ? (
        <Text style={styles.postConteudo}>{post.conteudo}</Text>
      ) : null}

      {post.imagens && post.imagens.length > 0 && (
        <ImageCarousel imagens={post.imagens} />
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.action}
          onPress={toggleLike}
          disabled={loading}
        >
          <Ionicons
            name={curtiu ? 'heart' : 'heart-outline'}
            size={22}
            color={curtiu ? '#ff3b30' : '#666'}
          />
          <Text
            style={[
              styles.actionText,
              curtiu && { color: '#ff3b30', fontWeight: '600' },
            ]}
          >
            {total}
          </Text>
        </TouchableOpacity>

        <CommentCountButton
          postId={post.id}
          onPress={() =>
            router.push(
              `/comments/${post.id}?postAutorId=${post.autorId}` as any
            )
          }
        />

        <TouchableOpacity style={styles.action} onPress={onSharePress}>
          <Ionicons name="paper-plane-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CommentCountButton({
  postId,
  onPress,
}: {
  postId: string;
  onPress: () => void;
}) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const unsub = escutarContagemComentarios(postId, setTotal);
    return () => unsub();
  }, [postId]);

  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <Ionicons name="chatbubble-outline" size={20} color="#666" />
      <Text style={styles.actionText}>{total}</Text>
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#999' },
  listContent: { padding: 8, paddingBottom: 24 },
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
  postHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerInfo: {
    marginLeft: 12,
    flex: 1,
    gap: 4,
  },
  autorNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 12,
    color: '#666',
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
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
  },
});