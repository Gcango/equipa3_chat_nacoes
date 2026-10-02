import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import {
  escutarPosts,
  escutarSeguidos,
  Post,
} from '../../services/posts';
import {
  pesquisarUtilizadores,
  UserProfile,
} from '../../services/users';

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUNAS = 3;
const ESPACO = 2;

const COR = {
  fundo: '#F7F8FA',
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  acento: '#2563EB',
};

const ROLE_COR: Record<string, string> = {
  aluno: '#2563EB',
  professor: '#059669',
  admin: '#7C3AED',
};

export default function SearchScreen() {
  const router = useRouter();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<UserProfile[]>([]);
  const [postsExplorar, setPostsExplorar] = useState<Post[]>([]);
  const [seguidosIds, setSeguidosIds] = useState<string[]>([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [largura, setLargura] = useState(SCREEN_W);

  // Escuta posts para o Explorar
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub1 = escutarPosts((lista) => {
      setPostsExplorar(lista);
      setLoading(false);
    });

    const unsub2 = escutarSeguidos(user.uid, setSeguidosIds);

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Pesquisa com debounce (300ms)
  useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      setPesquisando(false);
      return;
    }

    setPesquisando(true);
    const timeout = setTimeout(async () => {
      const lista = await pesquisarUtilizadores(termo);
      setResultados(lista);
      setPesquisando(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [termo]);

  const meuUid = auth.currentUser?.uid;
  const postsExplorarFiltrados = postsExplorar.filter((post) => {
    if (post.autorId === meuUid) return false;
    if (seguidosIds.includes(post.autorId)) return false;
    return true;
  });

  const modoPesquisa = termo.trim().length > 0;

  // ============ RENDER — MODO EXPLORAR ============
  function renderGrid() {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      );
    }

    if (postsExplorarFiltrados.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="compass-outline" size={36} color={COR.textoClaro} />
          </View>
          <Text style={styles.emptyTitle}>Tudo visto por aqui</Text>
          <Text style={styles.emptySub}>
            Já viste todas as publicações da comunidade.
          </Text>
        </View>
      );
    }

    const tamanho = (largura - ESPACO * (NUM_COLUNAS - 1)) / NUM_COLUNAS;

       return (
      <FlatList
        key="explorar-grid"
        data={postsExplorarFiltrados}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUNAS}
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.gridItem, { width: tamanho, height: tamanho }]}
            onPress={() => router.push(`/post/${item.id}` as any)}
            activeOpacity={0.7}
          >
            {item.imagens && item.imagens.length > 0 ? (
              <Image
                source={{ uri: item.imagens[0] }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.gridImage, styles.gridTextOnly]}>
                <Text style={styles.gridText} numberOfLines={5}>
                  {item.conteudo || 'Sem texto'}
                </Text>
              </View>
            )}

            {item.imagens && item.imagens.length > 1 && (
              <View style={styles.multiBadge}>
                <Ionicons name="copy-outline" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.gridContent}
      />
    );
  }

  // ============ RENDER — MODO PESQUISA ============
  function renderContas() {
    if (pesquisando) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      );
    }

    if (resultados.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={36} color={COR.textoClaro} />
          </View>
          <Text style={styles.emptyTitle}>Sem resultados</Text>
          <Text style={styles.emptySub}>
            Nenhuma conta corresponde a "{termo}".
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key="contas-list"
        data={resultados}
        keyExtractor={(item) => item.uid}
        renderItem={({ item, index }) => {
          const roleCor = ROLE_COR[item.role] || COR.textoMedio;
          const nomeExibir = item.nome || item.username;
          const isUltimo = index === resultados.length - 1;

          return (
            <View>
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => router.push(`/user/${item.uid}` as any)}
                activeOpacity={0.7}
              >
                {item.fotoURL ? (
                  <Image
                    source={{ uri: item.fotoURL }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.userAvatar,
                      styles.userAvatarFallback,
                      { backgroundColor: roleCor },
                    ]}
                  >
                    <Text style={styles.userAvatarText}>
                      {nomeExibir.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {nomeExibir}
                  </Text>
                  <Text style={styles.userUsername} numberOfLines={1}>
                    @{item.username}
                  </Text>
                </View>

                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: roleCor + '15' },
                  ]}
                >
                  <Text style={[styles.roleBadgeText, { color: roleCor }]}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>

              {!isUltimo && <View style={styles.divisoria} />}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    );
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Barra de pesquisa */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COR.textoMedio} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar"
              placeholderTextColor={COR.textoMedio}
              value={termo}
              onChangeText={setTermo}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {termo.length > 0 && (
              <TouchableOpacity onPress={() => setTermo('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COR.textoMedio}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conteúdo */}
        {modoPesquisa ? renderContas() : renderGrid()}
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COR.card,
  },
  searchBarWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
    backgroundColor: COR.card,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COR.divisoria,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COR.textoPrincipal,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COR.divisoria,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: COR.textoMedio,
    textAlign: 'center',
    maxWidth: 300,
  },

  // ============ GRID EXPLORAR ============
  gridContent: {
    padding: ESPACO,
  },
  gridItem: {
    position: 'relative',
    backgroundColor: COR.divisoria,
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
    borderColor: COR.borda,
  },
  gridText: {
    fontSize: 11,
    color: COR.textoPrincipal,
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

  // ============ LISTA DE CONTAS ============
  listContent: {
    paddingVertical: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COR.divisoria,
  },
  userAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COR.textoPrincipal,
  },
  userUsername: {
    fontSize: 12,
    color: COR.textoMedio,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divisoria: {
    height: 1,
    backgroundColor: COR.divisoria,
    marginLeft: 72,
  },
});