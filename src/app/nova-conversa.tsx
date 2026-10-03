import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../components/ScreenContainer';
import { abrirChatComUser } from '../services/chats';
import { auth } from '../services/firebase';
import { pesquisarUtilizadores, UserProfile } from '../services/users';

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

export default function NovaConversaScreen() {
  const router = useRouter();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<UserProfile[]>([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [aAbrir, setAAbrir] = useState<string | null>(null);

  const meuUid = auth.currentUser?.uid;

  // Pesquisa com debounce
  useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      setPesquisando(false);
      return;
    }

    setPesquisando(true);
    const timeout = setTimeout(async () => {
      const lista = await pesquisarUtilizadores(termo);
      // Exclui-me a mim próprio
      setResultados(lista.filter((u) => u.uid !== meuUid));
      setPesquisando(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [termo, meuUid]);

  async function selecionarUser(uid: string) {
    setAAbrir(uid);
    try {
      const chatId = await abrirChatComUser(uid);
      router.replace(`/chat/${chatId}` as any);
    } catch (e) {
      console.error('Erro ao abrir chat:', e);
      setAAbrir(null);
    }
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={26} color={COR.textoPrincipal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova conversa</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Barra de pesquisa */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COR.textoMedio} />
            <TextInput
              style={styles.searchInput}
              placeholder="Procurar pessoa..."
              placeholderTextColor={COR.textoMedio}
              value={termo}
              onChangeText={setTermo}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
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
        {!termo.trim() ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="search-outline"
                size={36}
                color={COR.textoClaro}
              />
            </View>
            <Text style={styles.emptyTitle}>Procurar pessoa</Text>
            <Text style={styles.emptySub}>
              Escreve o nome ou username de quem procuras.
            </Text>
          </View>
        ) : pesquisando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COR.acento} />
          </View>
        ) : resultados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="person-outline"
                size={36}
                color={COR.textoClaro}
              />
            </View>
            <Text style={styles.emptyTitle}>Sem resultados</Text>
            <Text style={styles.emptySub}>
              Nenhuma conta corresponde a "{termo}".
            </Text>
          </View>
        ) : (
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.uid}
            renderItem={({ item, index }) => {
              const roleCor = ROLE_COR[item.role] || COR.textoMedio;
              const nomeExibir = item.nome || item.username;
              const isUltimo = index === resultados.length - 1;
              const abrindo = aAbrir === item.uid;

              return (
                <View>
                  <TouchableOpacity
                    style={styles.userRow}
                    onPress={() => selecionarUser(item.uid)}
                    activeOpacity={0.7}
                    disabled={aAbrir !== null}
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

                    {abrindo ? (
                      <ActivityIndicator color={COR.acento} size="small" />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COR.textoClaro}
                      />
                    )}
                  </TouchableOpacity>

                  {!isUltimo && <View style={styles.divisoria} />}
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  searchBarWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COR.divisoria,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  },
  emptySub: {
    fontSize: 13,
    color: COR.textoMedio,
    textAlign: 'center',
    maxWidth: 300,
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
  divisoria: {
    height: 1,
    backgroundColor: COR.divisoria,
    marginLeft: 72,
  },
});