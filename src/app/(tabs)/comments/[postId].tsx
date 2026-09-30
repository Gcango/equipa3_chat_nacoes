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
    Comentario,
    criarComentario,
    escutarComentarios,
} from '../../../services/comments';
import { auth } from '../../../services/firebase';
import { formatarTempoRelativo } from '../../../services/posts';

const ROLE_CORES: Record<string, string> = {
  aluno: '#007AFF',
  professor: '#34C759',
  admin: '#FF3B30',
};

export default function CommentsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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
      await criarComentario(postId, texto);
      setTexto('');
      // Scroll para o fundo
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      Alert.alert('Erro', 'Não foi possível enviar o comentário.');
    } finally {
      setEnviando(false);
    }
  }

  function handleApagar(comentario: Comentario) {
    if (!postId) return;

    Alert.alert(
      'Apagar comentário',
      'Tens a certeza que queres apagar?',
      [
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
      ]
    );
  }

  function renderComentario({ item }: { item: Comentario }) {
    const meu = auth.currentUser?.uid === item.autorId;
    const roleCor = ROLE_CORES[item.autorRole] || '#666';

    return (
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
            <View style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}>
              <Text style={[styles.roleText, { color: roleCor }]}>
                {item.autorRole}
              </Text>
            </View>
            <Text style={styles.tempo}>
              {formatarTempoRelativo(item.criadoEm)}
            </Text>
          </View>

          <Text style={styles.comentarioTexto}>{item.texto}</Text>
        </View>

        {meu && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleApagar(item)}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentários</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : comentarios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Ainda não há comentários</Text>
            <Text style={styles.emptySubtitle}>
              Sê o primeiro a comentar!
            </Text>
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

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Escreve um comentário..."
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
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 16,
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
  moreButton: {
    padding: 4,
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