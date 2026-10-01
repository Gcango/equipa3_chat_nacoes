import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  apagarComentario,
  apagarResposta,
  Comentario,
  criarComentario,
  escutarComentarios,
  responderComentario,
  Resposta,
} from '../../services/comments';
import { auth } from '../../services/firebase';
import { formatarTempoRelativo } from '../../services/posts';

const ROLE_CORES: Record<string, string> = {
  aluno: '#007AFF',
  professor: '#34C759',
  admin: '#FF3B30',
};

function formatarTempo(valor: any): string {
  if (!valor) return 'agora';

  let dataMs: number;
  if (typeof valor === 'string') {
    dataMs = new Date(valor).getTime();
  } else if (valor.toMillis) {
    dataMs = valor.toMillis();
  } else {
    return 'agora';
  }

  const diferenca = Math.floor((Date.now() - dataMs) / 1000);
  if (diferenca < 60) return 'agora';
  if (diferenca < 3600) return `há ${Math.floor(diferenca / 60)} min`;
  if (diferenca < 86400) return `há ${Math.floor(diferenca / 3600)} h`;
  if (diferenca < 604800) return `há ${Math.floor(diferenca / 86400)} dias`;
  if (diferenca < 2592000) return `há ${Math.floor(diferenca / 604800)} sem`;
  return `há ${Math.floor(diferenca / 2592000)} meses`;
}

export default function CommentsScreen() {
  const router = useRouter();
  const { postId, postAutorId } = useLocalSearchParams<{
    postId: string;
    postAutorId: string;
  }>();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [respondendoA, setRespondendoA] = useState<{
    comentarioId: string;
    nomeAutor: string;
  } | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!postId) return;
    const unsubscribe = escutarComentarios(postId, (lista) => {
      setComentarios(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [postId]);

  async function handleEnviar() {
    if (!texto.trim() || !postId) return;

    setEnviando(true);
    try {
      if (respondendoA) {
        await responderComentario(postId, respondendoA.comentarioId, texto);
        setRespondendoA(null);
      } else {
        await criarComentario(postId, texto);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }
      setTexto('');
    } catch (error) {
      console.error('Erro ao enviar:', error);
      Alert.alert('Erro', 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  function iniciarResposta(comentario: Comentario) {
    setRespondendoA({
      comentarioId: comentario.id,
      nomeAutor: comentario.autorNome,
    });
    inputRef.current?.focus();
  }

  function cancelarResposta() {
    setRespondendoA(null);
  }

  function handleApagarComentario(comentario: Comentario) {
    if (!postId) return;

    if (Platform.OS === 'web') {
      const confirmar = window.confirm(
        'Tens a certeza que queres apagar este comentário?'
      );
      if (confirmar) {
        apagarComentario(postId, comentario.id).catch((error) => {
          console.error('Erro ao apagar:', error);
          window.alert('Não foi possível apagar.');
        });
      }
      return;
    }

    Alert.alert('Apagar comentário', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apagarComentario(postId, comentario.id);
          } catch (error) {
            console.error('Erro ao apagar:', error);
            Alert.alert('Erro', 'Não foi possível apagar.');
          }
        },
      },
    ]);
  }

  function handleApagarResposta(comentario: Comentario, resposta: Resposta) {
    if (!postId) return;

    if (Platform.OS === 'web') {
      const confirmar = window.confirm('Apagar esta resposta?');
      if (confirmar) {
        apagarResposta(postId, comentario.id, resposta).catch((error) => {
          console.error('Erro ao apagar resposta:', error);
          window.alert('Não foi possível apagar.');
        });
      }
      return;
    }

    Alert.alert('Apagar resposta', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apagarResposta(postId, comentario.id, resposta);
          } catch (error) {
            console.error('Erro ao apagar resposta:', error);
            Alert.alert('Erro', 'Não foi possível apagar.');
          }
        },
      },
    ]);
  }

  function renderResposta(resposta: Resposta, comentario: Comentario) {
    const meuUid = auth.currentUser?.uid;
    const souAutorResposta = meuUid === resposta.autorId;
    const souAutorComentario = meuUid === comentario.autorId;
    const souAutorPost = !!postAutorId && meuUid === postAutorId;

    const possoApagar = souAutorResposta || souAutorComentario || souAutorPost;
    const roleCor = ROLE_CORES[resposta.autorRole] || '#666';

    return (
      <View style={styles.respostaRow}>
        {resposta.autorFotoURL ? (
          <Image
            source={{ uri: resposta.autorFotoURL }}
            style={styles.avatarSmall}
          />
        ) : (
          <View style={[styles.avatarSmall, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackTextSmall}>
              {resposta.autorNome.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.comentarioBody}>
          <View style={styles.comentarioHeader}>
            <Text style={styles.autorNome}>{resposta.autorNome}</Text>
            <View
              style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}
            >
              <Text style={[styles.roleText, { color: roleCor }]}>
                {resposta.autorRole}
              </Text>
            </View>
            <Text style={styles.tempo}>{formatarTempo(resposta.criadoEm)}</Text>
          </View>
          <Text style={styles.comentarioTexto}>{resposta.texto}</Text>
        </View>

        {possoApagar && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleApagarResposta(comentario, resposta)}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderComentario({ item }: { item: Comentario }) {
    const meuUid = auth.currentUser?.uid;
    const souAutorComentario = meuUid === item.autorId;
    const souAutorPost = !!postAutorId && meuUid === postAutorId;

    const possoApagar = souAutorComentario || souAutorPost;
    const roleCor = ROLE_CORES[item.autorRole] || '#666';

    return (
      <View style={styles.comentarioWrapper}>
        <View style={styles.comentarioRow}>
          {item.autorFotoURL ? (
            <Image source={{ uri: item.autorFotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {item.autorNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.comentarioBody}>
            <View style={styles.comentarioHeader}>
              <Text style={styles.autorNome}>{item.autorNome}</Text>
              <View
                style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}
              >
                <Text style={[styles.roleText, { color: roleCor }]}>
                  {item.autorRole}
                </Text>
              </View>
              <Text style={styles.tempo}>
                {formatarTempoRelativo(item.criadoEm)}
              </Text>
            </View>

            <Text style={styles.comentarioTexto}>{item.texto}</Text>

            <TouchableOpacity
              style={styles.responderButton}
              onPress={() => iniciarResposta(item)}
            >
              <Text style={styles.responderText}>Responder</Text>
            </TouchableOpacity>

            {item.respostas && item.respostas.length > 0 && (
              <View style={styles.respostasContainer}>
                {item.respostas.map((r) => (
                  <View key={r.id}>{renderResposta(r, item)}</View>
                ))}
              </View>
            )}
          </View>

          {possoApagar && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleApagarComentario(item)}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentários</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : comentarios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Ainda não há comentários</Text>
            <Text style={styles.emptySubtitle}>Sê o primeiro a comentar!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comentarios}
            keyExtractor={(item) => item.id}
            renderItem={renderComentario}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {respondendoA && (
          <View style={styles.respondingBar}>
            <Text style={styles.respondingText}>
              A responder a{' '}
              <Text style={styles.respondingNome}>
                {respondendoA.nomeAutor}
              </Text>
            </Text>
            <TouchableOpacity onPress={cancelarResposta}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={
              respondendoA
                ? `Responder a ${respondendoA.nomeAutor}...`
                : 'Escreve um comentário...'
            }
            placeholderTextColor="#999"
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!texto.trim() || enviando) && styles.sendButtonDisabled,
            ]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 34,
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
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  listContent: {
    padding: 16,
    gap: 20,
  },
  comentarioWrapper: {
    gap: 12,
  },
  comentarioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarFallbackTextSmall: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  comentarioBody: {
    flex: 1,
  },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  autorNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tempo: {
    fontSize: 12,
    color: '#999',
  },
  comentarioTexto: {
    fontSize: 15,
    color: '#333',
    lineHeight: 21,
  },
  responderButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  responderText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  respostasContainer: {
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
    gap: 16,
  },
  respostaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  moreButton: {
    padding: 4,
  },
  respondingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f7ff',
    borderTopWidth: 1,
    borderTopColor: '#e0ecff',
  },
  respondingText: {
    fontSize: 13,
    color: '#666',
  },
  respondingNome: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});