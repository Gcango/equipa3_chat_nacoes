import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportModal } from '../../components/ReportModal';
import {
  apagarComentario,
  apagarResposta,
  Comentario,
  criarComentario,
  escutarComentarios,
  responderComentario,
  Resposta,
} from '../../services/comments';
import { auth, db } from '../../services/firebase';
import {
  addLike,
  formatarTempoRelativo,
  Post,
  removeLike,
} from '../../services/posts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = Math.min(SCREEN_WIDTH - 32, 568);

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

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [respondendoA, setRespondendoA] = useState<{
    comentarioId: string;
    nomeAutor: string;
  } | null>(null);

  const [reportModalVisivel, setReportModalVisivel] = useState(false);
  const [reportAlvo, setReportAlvo] = useState<{
    tipo: 'post' | 'comentario' | 'resposta';
    alvoId: string;
    conteudo: string;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Carregar post inicial
  useEffect(() => {
    if (!postId) return;

    async function carregarPost() {
      try {
        const snap = await getDoc(doc(db, 'posts', postId));
        if (snap.exists()) {
          const data = snap.data();
          setPost({
            id: snap.id,
            ...data,
            imagens: data.imagens || [],
            curtidas: data.curtidas || [],
          } as Post);
        }
      } catch (e) {
        console.error('Erro ao carregar post:', e);
      } finally {
        setLoadingPost(false);
      }
    }

    carregarPost();
  }, [postId]);

  // Escutar post em tempo real (likes)
  useEffect(() => {
    if (!postId) return;
    const unsub = onSnapshot(doc(db, 'posts', postId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPost((prev) =>
          prev
            ? { ...prev, ...data, curtidas: data.curtidas || [] }
            : ({ id: snap.id, ...data, curtidas: data.curtidas || [] } as Post)
        );
      }
    });
    return () => unsub();
  }, [postId]);

  // Escutar comentários
  useEffect(() => {
    if (!postId) return;
    const unsub = escutarComentarios(postId, setComentarios);
    return () => unsub();
  }, [postId]);

  function abrirDenuncia(
    tipo: 'post' | 'comentario' | 'resposta',
    alvoId: string,
    conteudo: string
  ) {
    setReportAlvo({ tipo, alvoId, conteudo });
    setReportModalVisivel(true);
  }

  async function toggleLike() {
    if (!post) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const curtiu = post.curtidas.includes(uid);
    try {
      if (curtiu) await removeLike(post.id);
      else await addLike(post.id);
    } catch (e) {
      console.error(e);
    }
  }

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
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }
      setTexto('');
    } catch (error) {
      console.error(error);
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

  function handleApagarComentario(comentario: Comentario) {
    if (!postId || !post) return;

    const executar = async () => {
      try {
        await apagarComentario(postId, comentario.id);
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Apagar este comentário?')) executar();
      return;
    }
    Alert.alert('Apagar comentário', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: executar },
    ]);
  }

  function handleApagarResposta(comentario: Comentario, resposta: Resposta) {
    if (!postId) return;

    const executar = async () => {
      try {
        await apagarResposta(postId, comentario.id, resposta);
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Apagar esta resposta?')) executar();
      return;
    }
    Alert.alert('Apagar resposta', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: executar },
    ]);
  }

  function renderResposta(resposta: Resposta, comentario: Comentario) {
    const meuUid = auth.currentUser?.uid;
    const possoApagar =
      meuUid === resposta.autorId ||
      meuUid === comentario.autorId ||
      (post && meuUid === post.autorId);
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

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() =>
              abrirDenuncia('resposta', resposta.id, resposta.texto)
            }
          >
            <Ionicons name="flag-outline" size={14} color="#999" />
          </TouchableOpacity>
          {possoApagar && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleApagarResposta(comentario, resposta)}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  function renderComentario({ item }: { item: Comentario }) {
    const meuUid = auth.currentUser?.uid;
    const possoApagar =
      meuUid === item.autorId || (post && meuUid === post.autorId);
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

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => abrirDenuncia('comentario', item.id, item.texto)}
            >
              <Ionicons name="flag-outline" size={16} color="#999" />
            </TouchableOpacity>
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
      </View>
    );
  }

  if (loadingPost) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Publicação</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Publicação não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const uid = auth.currentUser?.uid;
  const curtiu = uid ? post.curtidas.includes(uid) : false;
  const numLikes = post.curtidas.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publicação</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
          {/* Post */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <TouchableOpacity
                style={styles.postHeaderLeft}
                onPress={() =>
                  router.push(`/(tabs)/user/${post.autorId}` as any)
                }
                activeOpacity={0.7}
              >
                {post.autorFotoURL ? (
                  <Image
                    source={{ uri: post.autorFotoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarFallbackText}>
                      {post.autorNome.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.postAuthorNome}>{post.autorNome}</Text>
                  <Text style={styles.postMeta}>
                    {post.autorRole} · {formatarTempoRelativo(post.criadoEm)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportBtn}
                onPress={() =>
                  abrirDenuncia(
                    'post',
                    post.id,
                    post.conteudo || '[Publicação com imagens]'
                  )
                }
              >
                <Ionicons name="flag-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {post.conteudo ? (
              <Text style={styles.postConteudo}>{post.conteudo}</Text>
            ) : null}

            {post.imagens && post.imagens.length > 0 && (
              <ImageCarousel imagens={post.imagens} />
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.action} onPress={toggleLike}>
                <Ionicons
                  name={curtiu ? 'heart' : 'heart-outline'}
                  size={26}
                  color={curtiu ? '#ff3b30' : '#1a1a1a'}
                />
                <Text
                  style={[
                    styles.actionText,
                    curtiu && { color: '#ff3b30', fontWeight: '600' },
                  ]}
                >
                  {numLikes}
                </Text>
              </TouchableOpacity>

              <View style={styles.action}>
                <Ionicons
                  name="chatbubble-outline"
                  size={24}
                  color="#1a1a1a"
                />
                <Text style={styles.actionText}>{comentarios.length}</Text>
              </View>
            </View>
          </View>

          {/* Comentários */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>
              {comentarios.length === 0
                ? 'Sem comentários'
                : `${comentarios.length} comentário${
                    comentarios.length > 1 ? 's' : ''
                  }`}
            </Text>

            {comentarios.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                <Text style={styles.emptyCommentsText}>
                  Sê o primeiro a comentar
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comentarios.map((c) => (
                  <View key={c.id}>{renderComentario({ item: c })}</View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {respondendoA && (
          <View style={styles.respondingBar}>
            <Text style={styles.respondingText}>
              A responder a{' '}
              <Text style={styles.respondingNome}>
                {respondendoA.nomeAutor}
              </Text>
            </Text>
            <TouchableOpacity onPress={() => setRespondendoA(null)}>
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

      {/* Modal de denúncia */}
      {reportAlvo && (
        <ReportModal
          visivel={reportModalVisivel}
          fechar={() => setReportModalVisivel(false)}
          tipo={reportAlvo.tipo}
          alvoId={reportAlvo.alvoId}
          postId={post.id}
          conteudoDenunciado={reportAlvo.conteudo}
        />
      )}
    </SafeAreaView>
  );
}

function ImageCarousel({ imagens }: { imagens: string[] }) {
  const [indexAtivo, setIndexAtivo] = useState(0);

  if (imagens.length === 1) {
    return (
      <Image
        source={{ uri: imagens[0] }}
        style={styles.imagemUnica}
        resizeMode="cover"
      />
    );
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setIndexAtivo(index);
  }

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={IMAGE_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {imagens.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={styles.imagemCarousel}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <View style={styles.indicators}>
        {imagens.map((_, i) => (
          <View
            key={i}
            style={[styles.indicator, i === indexAtivo && styles.indicatorActive]}
          />
        ))}
      </View>

      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {indexAtivo + 1}/{imagens.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  scroll: { paddingBottom: 16 },
  postCard: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  postHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportBtn: {
    padding: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avatarFallbackTextSmall: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  postHeaderInfo: { marginLeft: 12, flex: 1 },
  postAuthorNome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  postMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  postConteudo: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  imagemUnica: {
    width: '100%',
    height: 320,
    backgroundColor: '#f0f0f0',
  },
  carouselContainer: { position: 'relative' },
  imagemCarousel: {
    width: IMAGE_WIDTH,
    height: 320,
    backgroundColor: '#f0f0f0',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc' },
  indicatorActive: { backgroundColor: '#007AFF' },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  commentSection: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  commentsList: { gap: 20 },
  comentarioWrapper: { gap: 12 },
  comentarioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  comentarioBody: { flex: 1 },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  autorNome: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  tempo: { fontSize: 12, color: '#999' },
  comentarioTexto: { fontSize: 15, color: '#333', lineHeight: 21 },
  responderButton: { marginTop: 6, alignSelf: 'flex-start' },
  responderText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  respostasContainer: {
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
    gap: 16,
  },
  respostaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  moreButton: { padding: 4 },
  emptyComments: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  emptyCommentsText: { fontSize: 14, color: '#999' },
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
  respondingText: { fontSize: 13, color: '#666' },
  respondingNome: { color: '#007AFF', fontWeight: '600' },
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
  sendButtonDisabled: { backgroundColor: '#ccc' },
});