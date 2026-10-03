import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import {
  calcularTotalNaoLidas,
  Chat,
  escutarChats,
  getInfoOutroUser,
  InfoOutroUser,
} from '../../services/chats';
import { auth } from '../../services/firebase';

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
};

const ROLE_COR: Record<string, string> = {
  aluno: '#2563EB',
  professor: '#059669',
  admin: '#7C3AED',
};

interface ChatComInfo {
  chat: Chat;
  outro: InfoOutroUser;
}

function formatarTempo(valor: any): string {
  if (!valor) return '';
  let ms: number;
  if (valor.toMillis) ms = valor.toMillis();
  else if (typeof valor === 'string') ms = new Date(valor).getTime();
  else return '';

  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}sem`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatComInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const meuUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!meuUid) return;

    const unsub = escutarChats(meuUid, async (lista) => {
      // Buscar info do outro user de cada chat
      const comInfo = await Promise.all(
        lista.map(async (chat) => {
          const outro = await getInfoOutroUser(chat, meuUid);
          return outro ? { chat, outro } : null;
        })
      );
      setChats(comInfo.filter((c): c is ChatComInfo => c !== null));
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsub();
  }, [meuUid]);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  function abrirChat(chatId: string) {
    router.push(`/chat/${chatId}` as any);
  }

  function novaConversa() {
    router.push('/nova-conversa' as any);
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

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mensagens</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={novaConversa}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color={COR.acento} />
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="chatbubble-outline"
                size={36}
                color={COR.textoClaro}
              />
            </View>
            <Text style={styles.emptyTitle}>Sem mensagens</Text>
            <Text style={styles.emptySub}>
              Começa uma conversa nova no botão acima.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={novaConversa}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyButtonText}>Nova conversa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {chats.map((item, index) => {
              const { chat, outro } = item;
              const roleCor = ROLE_COR[outro.role] || COR.textoMedio;
              const naoLidas = chat.naoLidas?.[meuUid!] || 0;
              const naoLida = naoLidas > 0;
              const isUltimo = index === chats.length - 1;
              const souEUltimo = chat.ultimaMensagemPor === meuUid;

              return (
                <View key={chat.id}>
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => abrirChat(chat.id)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                      {outro.fotoURL ? (
                        <Image
                          source={{ uri: outro.fotoURL }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatar,
                            styles.avatarFallback,
                            { backgroundColor: roleCor },
                          ]}
                        >
                          <Text style={styles.avatarFallbackText}>
                            {outro.nome.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      {naoLida && (
                        <View style={styles.onlineBadge}>
                          <Text style={styles.onlineBadgeText}>
                            {naoLidas > 9 ? '9+' : naoLidas}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                      <View style={styles.infoHeader}>
                        <Text
                          style={[
                            styles.nome,
                            naoLida && styles.nomeNaoLida,
                          ]}
                          numberOfLines={1}
                        >
                          {outro.nome}
                        </Text>
                        <Text style={styles.tempo}>
                          {formatarTempo(chat.ultimaMensagemAt)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.preview,
                          naoLida && styles.previewNaoLida,
                        ]}
                        numberOfLines={1}
                      >
                        {souEUltimo ? 'Tu: ' : ''}
                        {chat.ultimaMensagem || 'Conversa nova'}
                      </Text>
                    </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  newBtn: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COR.divisoria,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COR.acento,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COR.card,
  },
  onlineBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nome: {
    fontSize: 15,
    fontWeight: '500',
    color: COR.textoPrincipal,
    flex: 1,
  },
  nomeNaoLida: {
    fontWeight: '700',
  },
  tempo: {
    fontSize: 12,
    color: COR.textoClaro,
  },
  preview: {
    fontSize: 13,
    color: COR.textoMedio,
  },
  previewNaoLida: {
    color: COR.textoPrincipal,
    fontWeight: '600',
  },
  divisoria: {
    height: 1,
    backgroundColor: COR.divisoria,
    marginLeft: 80,
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
  emptyButton: {
    backgroundColor: COR.acento,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});