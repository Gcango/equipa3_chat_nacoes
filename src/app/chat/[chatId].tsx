import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  apagarMensagemParaMim,
  apagarMensagemParaTodos,
  Chat,
  enviarMensagem,
  escutarMensagens,
  getInfoOutroUser,
  InfoOutroUser,
  marcarChatComoLido,
  marcarMensagensComoVistas,
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
  perigo: '#DC2626',
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

  // Menu de apagar mensagem
  const [menuMensagem, setMenuMensagem] = useState<Mensagem | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const meuUid = auth.currentUser?.uid;

  // Carrega info do outro user + marca como lido/visto
  useEffect(() => {
    if (!chatId || !meuUid) return;

    async function carregar() {
      try {
        const chatSnap = await getDoc(doc(db, 'chats', chatId));
        if (chatSnap.exists()) {
          const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;
          const info = await getInfoOutroUser(chat, meuUid!);
          setOutro(info);

          await marcarChatComoLido(chatId, meuUid!);
          await marcarMensagensComoVistas(chatId, meuUid!);
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
      // Filtra mensagens apagadas para mim ou para todos
      const filtradas = lista.filter((m) => {
        if (m.apagadaParaTodos) return false;
        if (meuUid && m.apagadaPara.includes(meuUid)) return false;
        return true;
      });

      setMensagens(filtradas);
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (meuUid) {
        marcarMensagensComoVistas(chatId, meuUid);
      }
    });

    return () => unsub();
  }, [chatId, meuUid]);

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
      setTexto(textoGuardar);
    } finally {
      setEnviando(false);
    }
  }

  // ============ APAGAR MENSAGEM ============
  function abrirMenuMensagem(msg: Mensagem) {
    setMenuMensagem(msg);
  }

  function fecharMenuMensagem() {
    setMenuMensagem(null);
  }

  async function handleApagarParaMim() {
    if (!chatId || !meuUid || !menuMensagem) return;

    try {
      await apagarMensagemParaMim(chatId, menuMensagem.id, meuUid);
      fecharMenuMensagem();
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível apagar.');
    }
  }

  async function handleApagarParaTodos() {
    if (!chatId || !menuMensagem) return;

    const executar = async () => {
      try {
        await apagarMensagemParaTodos(chatId, menuMensagem.id);
        fecharMenuMensagem();
      } catch (e: any) {
        Alert.alert('Erro', 'Não foi possível apagar.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Apagar esta mensagem para todos?')) executar();
    } else {
      Alert.alert(
        'Apagar para todos',
        'Esta ação remove a mensagem para ambos. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Apagar', style: 'destructive', onPress: executar },
        ]
      );
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
              <Image
                source={{ uri: outro.fotoURL }}
                style={styles.headerAvatar}
              />
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                  <Pressable
                    onLongPress={() => abrirMenuMensagem(item)}
                    delayLongPress={300}
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
                    <View style={styles.msgFooter}>
                      <Text
                        style={[
                          styles.msgHora,
                          minha ? styles.msgHoraMinha : styles.msgHoraOutra,
                        ]}
                      >
                        {formatarHora(item.criadoEm)}
                      </Text>
                      {minha && (
                        <Ionicons
                          name={item.visto ? 'checkmark-done' : 'checkmark'}
                          size={14}
                          color={
                            item.visto
                              ? '#4FC3F7'
                              : 'rgba(255,255,255,0.6)'
                          }
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </Pressable>
                </View>
              );
            }}
          />
        )}

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

      {/* Bottom sheet de apagar mensagem */}
      <Modal
        visible={!!menuMensagem}
        transparent
        animationType="slide"
        onRequestClose={fecharMenuMensagem}
      >
        <Pressable style={styles.modalOverlay} onPress={fecharMenuMensagem}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Opções da mensagem</Text>
            </View>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleApagarParaMim}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={22} color={COR.textoPrincipal} />
              <Text style={styles.sheetOptionText}>Apagar para mim</Text>
            </TouchableOpacity>

            {menuMensagem?.autorId === meuUid && !menuMensagem?.visto && (
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={handleApagarParaTodos}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={22} color={COR.perigo} />
                <Text style={[styles.sheetOptionText, { color: COR.perigo }]}>
                  Apagar para todos
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetCancelar}
              onPress={fecharMenuMensagem}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  msgHora: {
    fontSize: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  sheetCancelar: {
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  sheetCancelarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});