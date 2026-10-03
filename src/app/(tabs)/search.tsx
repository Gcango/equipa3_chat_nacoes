import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExploreGrid } from '../../components/ExploreGrid';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import { pesquisarUtilizadores, UserProfile } from '../../services/users';

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
  const [pesquisando, setPesquisando] = useState(false);

  const meuUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      setPesquisando(false);
      return;
    }

    setPesquisando(true);
    const timeout = setTimeout(async () => {
      const lista = await pesquisarUtilizadores(termo);
      setResultados(lista.filter((u) => u.uid !== meuUid));
      setPesquisando(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [termo, meuUid]);

  const modoPesquisa = termo.trim().length > 0;

  function renderExplorar() {
    return (
      <ScrollView contentContainerStyle={styles.gridContent}>
        <View style={{ width: '100%' }}>
          <ExploreGrid />
        </View>
      </ScrollView>
    );
  }

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

        {modoPesquisa ? renderContas() : renderExplorar()}
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

  gridContent: {
    padding: 0,
    paddingBottom: 24,
  },

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