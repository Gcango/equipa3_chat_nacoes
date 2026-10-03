import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../services/firebase';
import { escutarPosts, Post } from '../services/posts';
import { escutarReels, Reel } from '../services/reels';

const NUM_COLUNAS = 3;

type ItemExplorar =
  | { tipo: 'post'; dados: Post; ordem: number }
  | { tipo: 'reel'; dados: Reel; ordem: number };

interface Props {
  apenasPosts?: boolean;
}

export function ExploreGrid({ apenasPosts = false }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const unsub1 = escutarPosts((lista) => setPosts(lista));

    if (apenasPosts) {
      setReels([]);
      setLoading(false);
      return () => unsub1();
    }

    const unsub2 = escutarReels((lista) => {
      setReels(lista);
      setLoading(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [apenasPosts]);

  const meuUid = auth.currentUser?.uid;

  // ✅ FILTROS:
  // - posts: só os que têm pelo menos 1 imagem
  // - reels: só os que têm thumbURL
  // - exclui os meus posts/reels
  const postsFiltrados = posts.filter(
    (p) =>
      p.autorId !== meuUid &&
      p.imagens &&
      p.imagens.length > 0
  );

  const reelsFiltrados = reels.filter(
    (r) => r.autorId !== meuUid && r.thumbURL && r.thumbURL.length > 0
  );

  const todos: ItemExplorar[] = [
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

  const tamanho = largura > 0 ? largura / NUM_COLUNAS : 0;

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

  return (
    <View
      style={styles.grid}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
    >
      {tamanho > 0 &&
        todos.map((item) => {
          const ehReel = item.tipo === 'reel';
          const id = item.dados.id;

          let imagem: string;
          if (ehReel) {
            imagem = (item.dados as Reel).thumbURL;
          } else {
            imagem = (item.dados as Post).imagens[0];
          }

          return (
            <TouchableOpacity
              key={`${item.tipo}-${id}`}
              style={[styles.cell, { width: tamanho, height: tamanho }]}
              onPress={() => {
                if (ehReel) {
                  router.push(`/reel/${id}` as any);
                } else {
                  const post = item.dados as Post;
                  router.push(
                    `/post/${post.id}?postAutorId=${post.autorId}` as any
                  );
                }
              }}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: imagem }}
                style={styles.imagem}
                resizeMode="cover"
              />

              {/* Badge ▶ nos reels */}
              {ehReel && (
                <View style={styles.reelBadge}>
                  <Ionicons name="play" size={10} color="#fff" />
                </View>
              )}

              {/* Badge de várias imagens (posts) */}
              {!ehReel &&
                (item.dados as Post).imagens &&
                (item.dados as Post).imagens.length > 1 && (
                  <View style={styles.reelBadge}>
                    <Ionicons name="copy-outline" size={10} color="#fff" />
                  </View>
                )}
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: 'center' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#999' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  cell: {
    position: 'relative',
    backgroundColor: '#f2f2f2',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  reelBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1.5,
  },
});