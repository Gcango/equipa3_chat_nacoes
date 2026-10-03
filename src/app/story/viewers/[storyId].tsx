import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    escutarViewers,
    StoryViewer,
} from '../../../services/stories';

const COR = {
  fundo: '#FFFFFF',
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

function formatarTempo(valor: any): string {
  if (!valor) return 'agora';
  let ms: number;
  if (valor.toMillis) ms = valor.toMillis();
  else if (typeof valor === 'string') ms = new Date(valor).getTime();
  else return 'agora';

  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return `há ${Math.floor(diff / 2592000)} meses`;
}

export default function StoryViewersScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();

  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storyId) return;

    const unsub = escutarViewers(storyId, (lista) => {
      setViewers(lista);
      setLoading(false);
    });

    return () => unsub();
  }, [storyId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COR.textoPrincipal} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Visualizações</Text>
          <Text style={styles.headerSub}>
            {viewers.length === 0
              ? 'Sem visualizações'
              : `${viewers.length} ${
                  viewers.length === 1 ? 'pessoa' : 'pessoas'
                }`}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      ) : viewers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="eye-outline" size={36} color={COR.textoClaro} />
          </View>
          <Text style={styles.emptyTitle}>Ainda sem visualizações</Text>
          <Text style={styles.emptySub}>
            Quando alguém vir o teu story, aparece aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={viewers}
          keyExtractor={(item) => item.uid}
          renderItem={({ item, index }) => {
            const isUltimo = index === viewers.length - 1;

            return (
              <View>
                <TouchableOpacity
                  style={styles.viewerRow}
                  onPress={() => router.push(`/user/${item.uid}` as any)}
                  activeOpacity={0.7}
                >
                  {item.fotoURL ? (
                    <Image
                      source={{ uri: item.fotoURL }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarText}>
                        {item.nome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.info}>
                    <Text style={styles.nome} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <Text style={styles.tempo}>
                      {formatarTempo(item.visualizadoEm)}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COR.textoClaro}
                  />
                </TouchableOpacity>

                {!isUltimo && <View style={styles.divisoria} />}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR.fundo,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  headerSub: {
    fontSize: 12,
    color: COR.textoMedio,
    marginTop: 1,
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
  listContent: {
    paddingVertical: 4,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COR.divisoria,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COR.acento,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontSize: 15,
    fontWeight: '600',
    color: COR.textoPrincipal,
  },
  tempo: {
    fontSize: 13,
    color: COR.textoMedio,
  },
  divisoria: {
    height: 1,
    backgroundColor: COR.divisoria,
    marginLeft: 76,
  },
});