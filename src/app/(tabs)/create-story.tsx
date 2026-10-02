import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { criarStory } from '../../services/stories';

const COR = {
  fundo: '#F7F8FA',
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  acento: '#2563EB',
};

export default function CreateStoryScreen() {
  const router = useRouter();
  const [imagem, setImagem] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  async function escolherImagem() {
    if (Platform.OS !== 'web') {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
        return;
      }
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      setImagem(resultado.assets[0].uri);
    }
  }

  async function publicar() {
    if (!imagem) return;

    setPublicando(true);
    try {
      await criarStory(imagem);
      router.back();
    } catch (error) {
      console.error('Erro ao publicar story:', error);
      Alert.alert('Erro', 'Não foi possível publicar. Tenta novamente.');
    } finally {
      setPublicando(false);
    }
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <Ionicons name="close" size={26} color={COR.textoPrincipal} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Novo story</Text>

          <TouchableOpacity
            style={[
              styles.publicarBtn,
              (!imagem || publicando) && styles.publicarBtnDisabled,
            ]}
            onPress={publicar}
            disabled={!imagem || publicando}
          >
            {publicando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.publicarText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          {imagem ? (
            <View style={styles.previewWrapper}>
              <Image
                source={{ uri: imagem }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={escolherImagem}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={18} color="#fff" />
                <Text style={styles.changeBtnText}>Trocar imagem</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.escolherWrapper}
              onPress={escolherImagem}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="images-outline" size={48} color={COR.acento} />
              </View>
              <Text style={styles.escolherTitle}>Escolher imagem</Text>
              <Text style={styles.escolherSub}>
                Aparece durante 24 horas no teu story
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR.fundo,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COR.card,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  publicarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COR.acento,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicarBtnDisabled: {
    opacity: 0.4,
  },
  publicarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escolherWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  escolherTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  escolherSub: {
    fontSize: 13,
    color: COR.textoMedio,
    textAlign: 'center',
    maxWidth: 260,
  },
  previewWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '90%',
    maxHeight: 600,
    borderRadius: 12,
    backgroundColor: COR.divisoria,
  },
  changeBtn: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});