import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { criarPost } from '../../services/posts';

const MAX_CHARS = 500;

export default function CreatePostScreen() {
  const router = useRouter();
  const [conteudo, setConteudo] = useState('');
  const [publicando, setPublicando] = useState(false);

  async function handlePublicar() {
    if (!conteudo.trim()) {
      Alert.alert('Erro', 'Escreve algo antes de publicar.');
      return;
    }

    setPublicando(true);
    try {
      await criarPost(conteudo);
      setConteudo('');
      router.back();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      Alert.alert('Erro', 'Não foi possível publicar. Tenta novamente.');
    } finally {
      setPublicando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelar}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova publicação</Text>
        <TouchableOpacity
          onPress={handlePublicar}
          disabled={publicando || !conteudo.trim()}
        >
          {publicando ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text
              style={[
                styles.publicar,
                !conteudo.trim() && styles.publicarDisabled,
              ]}
            >
              Publicar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="No que estás a pensar?"
          placeholderTextColor="#999"
          value={conteudo}
          onChangeText={setConteudo}
          multiline
          autoFocus
          maxLength={MAX_CHARS}
        />

        <Text style={styles.charCounter}>
          {conteudo.length}/{MAX_CHARS}
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelar: {
    fontSize: 15,
    color: '#666',
  },
  publicar: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  publicarDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    fontSize: 17,
    color: '#000',
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
});