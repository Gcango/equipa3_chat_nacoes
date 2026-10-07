import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Chat,
    enviarPartilha,
    escutarChats,
    getInfoOutroUser,
    InfoOutroUser
} from '../services/chats';
import { auth } from '../services/firebase';

const COR = {
  fundo: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  divisoria: '#F3F4F6',
  borda: '#E5E7EB',
  acento: '#2563EB',
  overlay: 'rgba(0,0,0,0.5)',
};

interface PartilhaProps {
  tipo: 'post' | 'reel';
  partilhaId: string;
  partilhaAutor: string;
  partilhaConteudo: string;
  partilhaThumbURL: string;
}

interface Props {
  visivel: boolean;
  fechar: () => void;
  partilha: PartilhaProps | null;
}

interface ChatComInfo {
  chat: Chat;
  outro: InfoOutroUser;
}

export function ShareModal({ visivel, fechar, partilha }: Props) {
  const [chats, setChats] = useState<ChatComInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviandoPara, setEnviandoPara] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<string[]>([]);

  const meuUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!visivel || !meuUid) return;

    setEnviados([]);
    setLoading(true);

    const unsub = escutarChats(meuUid, async (lista) => {
      const comInfo = await Promise.all(
        lista.map(async (chat) => {
          const outro = await getInfoOutroUser(chat, meuUid);
          return outro ? { chat, outro } : null;
        })
      );
      setChats(comInfo.filter((c): c is ChatComInfo => c !== null));
      setLoading(false);
    });

    return () => unsub();
  }, [visivel, meuUid]);

  async function handleEnviar(chatId: string) {
    if (!partilha || enviandoPara) return;

    setEnviandoPara(chatId);
    try {
      await enviarPartilha(chatId, partilha);
      setEnviados((prev) => [...prev, chatId]);

      if (Platform.OS === 'web') {
        window.alert('Enviado!');
      }
    } catch (e) {
      console.error('Erro ao enviar partilha:', e);
      if (Platform.OS === 'web') window.alert('Não foi possível enviar.');
    } finally {
      setEnviandoPara(null);
    }
  }

  const roleCor: Record<string, string> = {
    aluno: '#2563EB',
    professor: '#059669',
    admin: '#7C3AED',
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <Pressable style={styles.overlay} onPress={fechar}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Partilhar em</Text>
            <TouchableOpacity onPress={fechar}>
              <Ionicons name="close" size={24} color={COR.textoPrincipal} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COR.acento} />
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubble-outline"
                size={48}
                color={COR.textoClaro}
              />
              <Text style={styles.emptyTitle}>Sem conversas</Text>
              <Text style={styles.emptySub}>
                Começa uma conversa primeiro.
              </Text>
            </View>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => item.chat.id}
              renderItem={({ item }) => {
                const cor = roleCor[item.outro.role] || COR.textoMedio;
                const enviado = enviados.includes(item.chat.id);
                const enviando = enviandoPara === item.chat.id;

                return (
                  <TouchableOpacity
                    style={styles.chatRow}
                    onPress={() => handleEnviar(item.chat.id)}
                    disabled={enviando || enviado}
                    activeOpacity={0.7}
                  >
                    {item.outro.fotoURL ? (
                      <Image
                        source={{ uri: item.outro.fotoURL }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarFallback,
                          { backgroundColor: cor },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {item.outro.nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.info}>
                      <Text style={styles.nome} numberOfLines={1}>
                        {item.outro.nome}
                      </Text>
                      <Text style={styles.username} numberOfLines={1}>
                        @{item.outro.username}
                      </Text>
                    </View>

                    {enviando ? (
                      <ActivityIndicator size="small" color={COR.acento} />
                    ) : enviado ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#34C759"
                      />
                    ) : (
                      <Ionicons
                        name="paper-plane-outline"
                        size={22}
                        color={COR.acento}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COR.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COR.fundo,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  emptySub: {
    fontSize: 13,
    color: COR.textoMedio,
  },
  listContent: {
    paddingVertical: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COR.divisoria,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 17,
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
  username: {
    fontSize: 12,
    color: COR.textoMedio,
  },
});