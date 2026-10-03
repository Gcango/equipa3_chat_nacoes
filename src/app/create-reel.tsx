import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ScreenContainer } from '../components/ScreenContainer';
import { criarReel, formatarDuracao } from '../services/reels';

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

const DURACAO_MAX = 60; // segundos
const TAMANHO_MAX_MB = 25;

export default function CreateReelScreen() {
  const router = useRouter();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [duracao, setDuracao] = useState<number>(0);
  const [legenda, setLegenda] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  // Player para preview (só quando há vídeo)
  const player = useVideoPlayer(videoUri || '', (p) => {
    p.loop = true;
    p.muted = false;
  });

  async function escolherVideo() {
    if (Platform.OS !== 'web') {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
        return;
      }
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.4, // ⚡ Reduzido para upload mais rápido
      videoMaxDuration: DURACAO_MAX,
    });

    if (resultado.canceled || !resultado.assets[0]) return;

    const asset = resultado.assets[0];
    const duracaoVideo = (asset.duration || 0) / 1000; // ms → segundos

    // ✅ Validar duração
    if (duracaoVideo > DURACAO_MAX) {
      Alert.alert(
        'Vídeo demasiado longo',
        `O vídeo tem ${Math.round(duracaoVideo)}s. O máximo é ${DURACAO_MAX}s.`
      );
      return;
    }

    if (duracaoVideo < 1) {
      Alert.alert('Vídeo inválido', 'O vídeo é demasiado curto.');
      return;
    }

    setVideoUri(asset.uri);
    setDuracao(duracaoVideo);
    setProgresso(0);
  }

  async function publicar() {
    if (!videoUri) {
      Alert.alert('Sem vídeo', 'Escolhe um vídeo primeiro.');
      return;
    }

    setPublicando(true);
    setProgresso(0);

    try {
      await criarReel({
        videoUri,
        legenda,
        duracaoSegundos: duracao,
        onProgress: (p) => setProgresso(p),
      });

      // Sucesso
      if (Platform.OS === 'web') {
        window.alert('Reel publicado!');
        router.replace('/(tabs)/reels' as any);
      } else {
        Alert.alert('Sucesso! 🎬', 'O teu Reel foi publicado.', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/reels' as any),
          },
        ]);
      }
    } catch (e: any) {
      const msg = e.message || 'Não foi possível publicar.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erro', msg);
      console.error(e);
    } finally {
      setPublicando(false);
      setProgresso(0);
    }
  }

  const podePublicar = !!videoUri && !publicando;

  return (
    <ScreenContainer>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBtn}
              disabled={publicando}
            >
              <Ionicons name="close" size={26} color={COR.textoPrincipal} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Novo Reel</Text>

            <TouchableOpacity
              style={[
                styles.publicarBtn,
                !podePublicar && styles.publicarBtnDisabled,
              ]}
              onPress={publicar}
              disabled={!podePublicar}
              activeOpacity={0.7}
            >
              {publicando ? (
                <View style={styles.progressWrapper}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.progressText}>{progresso}%</Text>
                </View>
              ) : (
                <Text style={styles.publicarText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Preview do vídeo ou botão escolher */}
            {videoUri ? (
              <View style={styles.previewWrapper}>
                <VideoView
                  style={styles.preview}
                  player={player}
                  contentFit="contain"
                  nativeControls={false}
                />

                {/* Overlay com info */}
                <View style={styles.previewOverlay}>
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text style={styles.durationText}>
                      {formatarDuracao(duracao)}
                    </Text>
                  </View>
                </View>

                {/* Botão trocar */}
                <TouchableOpacity
                  style={styles.changeBtn}
                  onPress={escolherVideo}
                  disabled={publicando}
                  activeOpacity={0.7}
                >
                  <Ionicons name="videocam-outline" size={18} color="#fff" />
                  <Text style={styles.changeBtnText}>Trocar vídeo</Text>
                </TouchableOpacity>

                {/* Overlay de upload (durante o upload) */}
                {publicando && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadText}>
                      A publicar... {progresso}%
                    </Text>
                    <Text style={styles.uploadSub}>
                      Não feches a app
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.escolherWrapper}
                onPress={escolherVideo}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="videocam-outline"
                    size={48}
                    color={COR.acento}
                  />
                </View>
                <Text style={styles.escolherTitle}>Escolher vídeo</Text>
                <Text style={styles.escolherSub}>
                  Máximo {DURACAO_MAX}s · Máx. {TAMANHO_MAX_MB} MB
                </Text>
              </TouchableOpacity>
            )}

            {/* Legenda */}
            {videoUri && (
              <View style={styles.form}>
                <Text style={styles.label}>Legenda (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={legenda}
                  onChangeText={setLegenda}
                  placeholder="Escreve uma legenda..."
                  placeholderTextColor={COR.textoClaro}
                  multiline
                  numberOfLines={4}
                  maxLength={300}
                  editable={!publicando}
                />
                <Text style={styles.counter}>{legenda.length}/300</Text>
              </View>
            )}
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
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    minHeight: 36,
  },
  publicarBtnDisabled: {
    opacity: 0.4,
  },
  publicarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  escolherWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COR.acentoClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  escolherTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  escolherSub: {
    fontSize: 13,
    color: COR.textoMedio,
    textAlign: 'center',
  },
  previewWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 500,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  changeBtn: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
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
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  form: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COR.textoMedio,
  },
  input: {
    backgroundColor: COR.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COR.textoPrincipal,
    borderWidth: 1,
    borderColor: COR.borda,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    color: COR.textoClaro,
    textAlign: 'right',
  },
});