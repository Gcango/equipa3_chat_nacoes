import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import {
  escutarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  Notificacao,
  TipoNotificacao,
} from '../../services/notifications';

const COR = {
  fundo: '#F7F8FA',
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  acento: '#2563EB',
  acentoClaro: '#EFF6FF',
  perigo: '#DC2626',
  sucesso: '#059669',
  roxo: '#7C3AED',
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

const TIPO_INFO: Record<
  TipoNotificacao,
  { icon: any; cor: string; texto: string }
> = {
  like: {
    icon: 'heart',
    cor: '#DC2626',
    texto: 'gostou da tua publicação',
  },
  comentario: {
    icon: 'chatbubble',
    cor: '#2563EB',
    texto: 'comentou a tua publicação',
  },
  resposta: {
    icon: 'return-down-forward',
    cor: '#7C3AED',
    texto: 'respondeu ao teu comentário',
  },
  seguir: {
    icon: 'person-add',
    cor: '#059669',
    texto: 'começou a seguir-te',
  },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const unsub = escutarNotificacoes(user.uid, (lista) => {
      setNotifs(lista);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsub();
  }, [user]);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  async function handleMarcarTodas() {
    if (!user) return;
    if (Platform.OS === 'web') {
      if (window.confirm('Marcar todas como lidas?')) {
        await marcarTodasComoLidas(user.uid);
      }
    } else {
      await marcarTodasComoLidas(user.uid);
    }
  }

  async function handlePress(n: Notificacao) {
    // Marca como lida
    if (!n.lida) {
      await marcarComoLida(n.id);
    }

    // Navega consoante o tipo
    try {
      if (n.tipo === 'seguir') {
        router.push(`/user/${n.autorId}` as any);
      } else if (n.postId) {
        router.push(`/post/${n.postId}` as any);
      }
    } catch (e) {
      console.error('Erro ao navegar:', e);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      </ScreenContainer>
    );
  }

  const naoLidas = notifs.filter((n) => !n.lida).length;

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Notificações</Text>
            {naoLidas > 0 && (
              <Text style={styles.headerSub}>
                {naoLidas} {naoLidas === 1 ? 'nova' : 'novas'}
              </Text>
            )}
          </View>

          {naoLidas > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarcarTodas}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>Marcar lidas</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conteúdo */}
        {notifs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="notifications-outline"
                size={36}
                color={COR.textoClaro}
              />
            </View>
            <Text style={styles.emptyTitle}>Sem notificações</Text>
            <Text style={styles.emptySub}>
              Quando alguém interagir contigo, aparece aqui.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {notifs.map((n, index) => {
              const info = TIPO_INFO[n.tipo] || TIPO_INFO.like;
              const isUltimo = index === notifs.length - 1;

              return (
                <View key={n.id}>
                  <TouchableOpacity
                    style={[
                      styles.item,
                      !n.lida && styles.itemNaoLida,
                    ]}
                    onPress={() => handlePress(n)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar com badge de ícone */}
                    <View style={styles.avatarWrapper}>
                      {n.autorFotoURL ? (
                        <Image
                          source={{ uri: n.autorFotoURL }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatar,
                            styles.avatarFallback,
                            { backgroundColor: info.cor + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarFallbackText,
                              { color: info.cor },
                            ]}
                          >
                            {n.autorNome.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      {/* Ícone do tipo */}
                      <View
                        style={[
                          styles.iconBadge,
                          { backgroundColor: info.cor },
                        ]}
                      >
                        <Ionicons
                          name={info.icon}
                          size={12}
                          color="#fff"
                        />
                      </View>
                    </View>

                    {/* Texto */}
                    <View style={styles.info}>
                      <Text style={styles.texto} numberOfLines={2}>
                        <Text style={styles.bold}>{n.autorNome}</Text>{' '}
                        {info.texto}
                        {n.texto ? ':' : ''}
                      </Text>
                      {n.texto ? (
                        <Text
                          style={styles.excerto}
                          numberOfLines={1}
                        >
                          "{n.texto}"
                        </Text>
                      ) : null}
                      <Text style={styles.tempo}>
                        {formatarTempo(n.criadoEm)}
                      </Text>
                    </View>

                    {/* Bolinha de não lida */}
                    {!n.lida && <View style={styles.bolinha} />}
                  </TouchableOpacity>

                  {!isUltimo && <View style={styles.divisoria} />}
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COR.card,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  headerSub: {
    fontSize: 13,
    color: COR.acento,
    fontWeight: '600',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COR.acentoClaro,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COR.acento,
  },
  listContent: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemNaoLida: {
    backgroundColor: COR.acentoClaro,
  },
  avatarWrapper: {
    position: 'relative',
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
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COR.card,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  texto: {
    fontSize: 14,
    color: COR.textoPrincipal,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  excerto: {
    fontSize: 13,
    color: COR.textoMedio,
    fontStyle: 'italic',
  },
  tempo: {
    fontSize: 12,
    color: COR.textoClaro,
    marginTop: 2,
  },
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COR.acento,
    marginTop: 6,
  },
  divisoria: {
    height: 1,
    backgroundColor: COR.divisoria,
    marginLeft: 76,
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
});