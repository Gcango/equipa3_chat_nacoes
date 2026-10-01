import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { escutarPostsDoUser, Post } from '../services/posts';

interface Props {
  userId: string;
}

const NUM_COLUNAS = 3;
const ESPACO = 2;
const MAX_WIDTH_DESKTOP = 600;

export function PostGrid({ userId }: Props) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = escutarPostsDoUser(userId, (lista) => {
      setPosts(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Calcula largura do container
  // No desktop, limita a 600 (igual ao ScreenContainer)
  const containerWidth = Platform.OS === 'web'
    ? Math.min(windowWidth, MAX_WIDTH_DESKTOP)
    : windowWidth;

  // Tamanho de cada quadrado (subtrai os gaps)
  const tamanho = (containerWidth - ESPACO * (NUM_COLUNAS - 1) - ESPACO * 2) / NUM_COLUNAS;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Ainda sem publicações</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const temImagem = post.imagens && post.imagens.length > 0;

        return (
          <TouchableOpacity
            key={post.id}
            style={[styles.gridItem, { width: tamanho, height: tamanho }]}
            onPress={() =>
              router.push(
                `/post/${post.id}?postAutorId=${post.autorId}` as any
              )
            }
            activeOpacity={0.7}
          >
            {temImagem ? (
              <Image
                source={{ uri: post.imagens[0] }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.gridImage, styles.gridTextOnly]}>
                <Text style={styles.gridText} numberOfLines={6}>
                  {post.conteudo || 'Sem texto'}
                </Text>
              </View>
            )}

            {post.imagens && post.imagens.length > 1 && (
              <View style={styles.multiBadge}>
                <Ionicons name="copy-outline" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACO,
    paddingHorizontal: ESPACO,
    justifyContent: 'flex-start',
  },
  gridItem: {
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridTextOnly: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gridText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  multiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
});