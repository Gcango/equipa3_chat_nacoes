import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    escutarPosts,
    formatarTempoRelativo,
    Post,
} from '../../services/posts';

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Escutar posts em tempo real
    const unsubscribe = escutarPosts((lista) => {
      setPosts(lista);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    // O onSnapshot já vai atualizar automaticamente
    // Este setRefreshing é só para o efeito visual do pull
    setTimeout(() => setRefreshing(false), 800);
  }

  function renderPost({ item }: { item: Post }) {
    return (
      <View style={styles.postCard}>
        {/* Cabeçalho do post */}
        <View style={styles.postHeader}>
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
        </View>

        {/* Conteúdo */}
        <Text style={styles.postConteudo}>{item.conteudo}</Text>

        {/* Ações (por agora só mostra likes, sem botão) */}
        <View style={styles.postFooter}>
          <View style={styles.postAction}>
            <Ionicons name="heart-outline" size={20} color="#666" />
            <Text style={styles.postActionText}>{item.likes || 0}</Text>
          </View>
          <View style={styles.postAction}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.postActionText}>0</Text>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat_Nações</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/create-post')}
        >
          <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Lista de posts */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
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