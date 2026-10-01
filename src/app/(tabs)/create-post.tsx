import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { criarPost } from '../../services/posts';

const MAX_CHARS = 500;
const MAX_IMAGENS = 10;

export default function CreatePostScreen() {
  const router = useRouter();
  const [conteudo, setConteudo] = useState('');
  const [imagens, setImagens] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);

  async function escolherImagens() {
    if (imagens.length >= MAX_IMAGENS) {
      Alert.alert('Limite', `Máximo ${MAX_IMAGENS} imagens por publicação.`);
      return;
    }

    if (Platform.OS !== 'web') {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
        return;
      }
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGENS - imagens.length,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      const novas = resultado.assets.map((a) => a.uri);
      setImagens([...imagens, ...novas].slice(0, MAX_IMAGENS));
    }
  }

  function removerImagem(index: number) {
    setImagens(imagens.filter((_, i) => i !== index));
  }

  async function handlePublicar() {
    const temConteudo = conteudo.trim().length > 0;
    const temImagens = imagens.length > 0;

    if (!temConteudo && !temImagens) {
      Alert.alert('Erro', 'Escreve algo ou adiciona uma imagem.');
      return;
    }

    setPublicando(true);
    try {
      await criarPost(conteudo, imagens);
      setConteudo('');
      setImagens([]);
      router.back();
    } catch (error) {
      console.error('Erro ao criar post:', error);
      Alert.alert('Erro', 'Não foi possível publicar. Tenta novamente.');
    } finally {
      setPublicando(false);
    }
  }

  const podePublicar =
    (conteudo.trim().length > 0 || imagens.length > 0) && !publicando;

  return (
    <ScreenContainer>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
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
              disabled={!podePublicar}
            >
              {publicando ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Text
                  style={[
                    styles.publicar,
                    !podePublicar && styles.publicarDisabled,
                  ]}
                >
                  Publicar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
          >
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

            {imagens.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagensPreview}
                contentContainerStyle={styles.imagensPreviewContent}
              >
                {imagens.map((uri, index) => (
                  <View key={index} style={styles.imagemWrapper}>
                    <Image source={{ uri }} style={styles.imagemPreview} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removerImagem(index)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.addImageButton}
              onPress={escolherImagens}
            >
              <Ionicons name="images-outline" size={22} color="#007AFF" />
              <Text style={styles.addImageText}>
                {imagens.length === 0
                  ? 'Adicionar imagens'
                  : `Adicionar mais (${imagens.length}/${MAX_IMAGENS})`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  imagensPreview: {
    marginBottom: 16,
  },
  imagensPreviewContent: {
    gap: 8,
  },
  imagemWrapper: {
    position: 'relative',
  },
  imagemPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginTop: 8,
  },
  addImageText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
});