import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Chat,
    enviarMensagem,
    escutarMensagens,
    getInfoOutroUser,
    InfoOutroUser,
    marcarChatComoLido,
    Mensagem,
} from '../../services/chats';
import { auth, db } from '../../services/firebase';

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
  minhaMensagem: '#2563EB',
  outraMensagem: '#F3F4F6',
};

const ROLE_COR: Record<string, string> = {
  aluno: '#2563EB',
  professor: '#059669',
  admin: '#7C3AED',
};

function formatarHora(valor: any): string {
  if (!valor) return '';
  let data: Date;
  if (valor.toDate) data = valor.toDate();
  else if (typeof valor === 'string') data = new Date(valor);
  else return '';

  const h = data.getHours().toString().padStart(2, '0');
  const m = data.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [outro, setOutro] = useState<InfoOutroUser | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const meuUid = auth.currentUser?.uid;

  // Carrega info do outro user + marca como lido
  useEffect(() => {
    if (!chatId || !meuUid) return;

    async function carregar() {
      try {
        const chatSnap = await getDoc(doc(db, 'chats', chatId));
        if (chatSnap.exists()) {
          const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;
          const info = await getInfoOutroUser(chat, meuUid!);
          setOutro(info);

          // Marca como lido
          await marcarChatComoLido(chatId, meuUid!);
        }
      } catch (e) {
        console.error('Erro ao carregar chat:', e);
      }
    }

    carregar();
  }, [chatId, meuUid]);

  // Escuta mensagens
  useEffect(() => {
    if (!chatId) return;

    const unsub = escutarMensagens(chatId, (lista) => {
      setMensagens(lista);
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  async function handleEnviar() {
    if (!texto.trim() || !chatId || enviando) return;

    const textoGuardar = texto.trim();
    setTexto('');
    setEnviando(true);

    try {
      await enviarMensagem(chatId, textoGuardar);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.error('Erro ao enviar:', e);
      setTexto(textoGuardar); // Restaura se falhar
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      </SafeAreaView>
    );
  }

  const roleCor = ROLE_COR[outro?.role || 'aluno'] || COR.textoMedio;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={COR.textoPrincipal} />
        </TouchableOpacity>

        {outro && (
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={() => router.push(`/user/${outro.uid}` as any)}
            activeOpacity={0.7}
          >
            {outro.fotoURL ? (
              <Image source={{ uri: outro.fotoURL }} style={styles.headerAvatar} />
            ) : (
              <View
                style={[
                  styles.headerAvatar,
                  styles.headerAvatarFallback,
                  { backgroundColor: roleCor },
                ]}
              >
                <Text style={styles.headerAvatarText}>
                  {outro.nome.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.headerName} numberOfLines={1}>
              {outro.nome}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.backBtn} />
      </View>

      {/* Mensagens */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {mensagens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="chatbubble-outline"
                size={36}
                color={COR.textoClaro}
              />
            </View>
            <Text style={styles.emptyTitle}>Conversa nova</Text>
            <Text style={styles.emptySub}>
              Envia a primeira mensagem para começar.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensagens}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const minha = item.autorId === meuUid;
              return (
                <View
                  style={[
                    styles.msgRow,
                    minha ? styles.msgRowMinha : styles.msgRowOutra,
                  ]}
                >
                  <View
                    style={[
                      styles.msgBubble,
                      minha ? styles.msgMinha : styles.msgOutra,
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        minha ? styles.msgTextMinha : styles.msgTextOutra,
                      ]}
                    >
                      {item.texto}
                    </Text>
                    <Text
                      style={[
                        styles.msgHora,
                        minha ? styles.msgHoraMinha : styles.msgHoraOutra,
                      ]}
                    >
                      {formatarHora(item.criadoEm)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Escreve uma mensagem..."
            placeholderTextColor={COR.textoClaro}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!texto.trim() || enviando) && styles.sendBtnDisabled,
            ]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
            activeOpacity={0.7}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COR.textoPrincipal,
    maxWidth: 180,
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  msgRow: {
    flexDirection: 'row',
  },
  msgRowMinha: {
    justifyContent: 'flex-end',
  },
  msgRowOutra: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  msgMinha: {
    backgroundColor: COR.minhaMensagem,
    borderBottomRightRadius: 4,
  },
  msgOutra: {
    backgroundColor: COR.outraMensagem,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextMinha: {
    color: '#fff',
  },
  msgTextOutra: {
    color: COR.textoPrincipal,
  },
  msgHora: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgHoraMinha: {
    color: 'rgba(255,255,255,0.7)',
  },
  msgHoraOutra: {
    color: COR.textoClaro,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COR.divisoria,
    backgroundColor: COR.card,
  },
  input: {
    flex: 1,
    backgroundColor: COR.divisoria,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COR.textoPrincipal,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COR.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
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