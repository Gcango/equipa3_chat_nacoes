import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../services/firebase';
import {
  agruparPorAutor,
  apagarStoryCompleto,
  escutarContagemViewers,
  escutarStoriesAtivos,
  GrupoStories,
  registrarVisualizacao,
  Story,
} from '../../services/stories';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DURACAO_STORY = 5000;

const COR = {
  texto: '#FFFFFF',
  textoMedio: 'rgba(255,255,255,0.7)',
  barraAtiva: '#FFFFFF',
  barraInativa: 'rgba(255,255,255,0.35)',
  perigo: '#DC2626',
  overlay: 'rgba(0,0,0,0.5)',
  sheet: '#FFFFFF',
};

export default function StoryViewerScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [todosGrupos, setTodosGrupos] = useState<GrupoStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [grupoAtual, setGrupoAtual] = useState(0);
  const [storyAtual, setStoryAtual] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mostrarLegenda, setMostrarLegenda] = useState(true);

  // Menu ⋯ e modais
  const [menuAberto, setMenuAberto] = useState(false);
  const [apagando, setApagando] = useState(false);

  // Contagem de viewers (só para o meu story)
  const [contagemViewers, setContagemViewers] = useState(0);

  const progressInterval = useRef<any>(null);
  const legendaTimeout = useRef<any>(null);

  const meuUid = auth.currentUser?.uid;

  // ============ CARREGAR GRUPOS ============
  useEffect(() => {
    const unsub = escutarStoriesAtivos((stories: Story[]) => {
      const grupos = agruparPorAutor(stories);
      setTodosGrupos(grupos);
      setLoading(false);

      if (userId) {
        const idx = grupos.findIndex((g) => g.autorId === userId);
        if (idx >= 0) {
          setGrupoAtual(idx);
          setStoryAtual(0);
        }
      }
    });
    return () => unsub();
  }, [userId]);

  // ============ REGISTAR VISUALIZAÇÃO ============
  useEffect(() => {
    if (loading || todosGrupos.length === 0) return;

    const grupo = todosGrupos[grupoAtual];
    if (!grupo) return;

    const story = grupo.stories[storyAtual];
    if (!story) return;

    // Não registar o próprio autor
    if (story.autorId === meuUid) return;

    // Regista a visualização (a função já ignora duplicados)
    registrarVisualizacao(story.id, story.autorId);
  }, [loading, grupoAtual, storyAtual, todosGrupos, meuUid]);

  // ============ CONTAGEM DE VIEWERS (para o meu story) ============
  useEffect(() => {
    if (loading || todosGrupos.length === 0) return;

    const grupo = todosGrupos[grupoAtual];
    if (!grupo) return;

    const story = grupo.stories[storyAtual];
    if (!story) return;

    // Só escuta contagem se for o meu story
    if (story.autorId !== meuUid) {
      setContagemViewers(0);
      return;
    }

    const unsub = escutarContagemViewers(story.id, setContagemViewers);
    return () => unsub();
  }, [loading, grupoAtual, storyAtual, todosGrupos, meuUid]);

  // ============ MOSTRAR LEGENDA 3s (só 1ª story) ============
  useEffect(() => {
    if (grupoAtual === 0 && storyAtual === 0 && mostrarLegenda) {
      legendaTimeout.current = setTimeout(() => {
        setMostrarLegenda(false);
      }, 3000);
    }
    return () => {
      if (legendaTimeout.current) clearTimeout(legendaTimeout.current);
    };
  }, []);

  // ============ PROGRESSO AUTOMÁTICO ============
  useEffect(() => {
    if (loading || pausado) return;
    if (todosGrupos.length === 0) return;

    const grupo = todosGrupos[grupoAtual];
    if (!grupo || !grupo.stories[storyAtual]) return;

    setProgresso(0);

    const inicio = Date.now();
    progressInterval.current = setInterval(() => {
      const decorrido = Date.now() - inicio;
      const pct = decorrido / DURACAO_STORY;
      setProgresso(pct);

      if (pct >= 1) {
        clearInterval(progressInterval.current);
        avancar();
      }
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [grupoAtual, storyAtual, pausado, loading, todosGrupos]);

  // ============ NAVEGAÇÃO ============
  function avancar() {
    const grupo = todosGrupos[grupoAtual];
    if (!grupo) return;

    if (storyAtual < grupo.stories.length - 1) {
      setStoryAtual(storyAtual + 1);
      return;
    }

    if (grupoAtual < todosGrupos.length - 1) {
      setGrupoAtual(grupoAtual + 1);
      setStoryAtual(0);
      return;
    }

    router.back();
  }

  function retroceder() {
    if (storyAtual > 0) {
      setStoryAtual(storyAtual - 1);
      return;
    }
    if (grupoAtual > 0) {
      const grupoAnterior = todosGrupos[grupoAtual - 1];
      setGrupoAtual(grupoAtual - 1);
      setStoryAtual(grupoAnterior.stories.length - 1);
      return;
    }
  }

  function fechar() {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (legendaTimeout.current) clearTimeout(legendaTimeout.current);
    router.back();
  }

  // ============ APAGAR STORY ============
  async function handleApagar() {
    if (loading || todosGrupos.length === 0) return;

    const grupo = todosGrupos[grupoAtual];
    if (!grupo) return;

    const story = grupo.stories[storyAtual];
    if (!story) return;

    const confirmar = () => {
      if (Platform.OS === 'web') {
        const ok = window.confirm(
          'Vais apagar este story permanentemente. Continuar?'
        );
        if (ok) executar();
      } else {
        Alert.alert(
          'Apagar story',
          'Vais apagar este story permanentemente. Continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Apagar', style: 'destructive', onPress: executar },
          ]
        );
      }
    };

    const executar = async () => {
      setApagando(true);
      setMenuAberto(false);
      try {
        await apagarStoryCompleto(story.id);

        // Remove da lista local
        setTodosGrupos((prev) => {
          const novosGrupos = prev.map((g) => ({
            ...g,
            stories: g.stories.filter((s) => s.id !== story.id),
          }));

          // Remove grupos sem stories
          const filtrados = novosGrupos.filter((g) => g.stories.length > 0);

          if (filtrados.length === 0) {
            setTimeout(() => router.back(), 100);
          }

          return filtrados;
        });

        // Se apagou a última do grupo atual, volta ao início
        const grupoAtualizado = todosGrupos[grupoAtual];
        if (grupoAtualizado && storyAtual >= grupoAtualizado.stories.length - 1) {
          setStoryAtual(0);
        }
      } catch (e: any) {
        const msg = e?.message || 'Não foi possível apagar.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Erro', msg);
      } finally {
        setApagando(false);
      }
    };

    confirmar();
  }

  // ============ ABRIR VIEWERS ============
  function abrirViewers() {
    if (loading || todosGrupos.length === 0) return;
    const grupo = todosGrupos[grupoAtual];
    if (!grupo) return;
    const story = grupo.stories[storyAtual];
    if (!story) return;

    setMenuAberto(false);
    router.push(`/story/viewers/${story.id}` as any);
  }

  // ============ RENDER ============
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const grupo = todosGrupos[grupoAtual];
  if (!grupo || !grupo.stories[storyAtual]) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={fechar}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Story não disponível</Text>
        </View>
      </SafeAreaView>
    );
  }

  const story = grupo.stories[storyAtual];
  const tempoRelativo = calcularTempo(story.criadoEm);
  const souEu = story.autorId === meuUid;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: story.imagemURL }}
        style={styles.imagem}
        resizeMode="cover"
      />

      <View style={styles.topOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Barras de progresso */}
        <View style={styles.progressRow}>
          {grupo.stories.map((_, idx) => (
            <View key={idx} style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      idx < storyAtual
                        ? '100%'
                        : idx === storyAtual
                        ? `${Math.min(progresso * 100, 100)}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header do story */}
        <View style={styles.header}>
          {grupo.autorFotoURL ? (
            <Image
              source={{ uri: grupo.autorFotoURL }}
              style={styles.avatarSmall}
            />
          ) : (
            <View style={[styles.avatarSmall, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {grupo.autorNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.autorNome}>{grupo.autorNome}</Text>
            <Text style={styles.tempo}>{tempoRelativo}</Text>
          </View>

          <TouchableOpacity onPress={fechar} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Zonas de toque */}
      <Pressable
        style={styles.tapLeft}
        onPress={retroceder}
        onLongPress={() => setPausado(true)}
        onPressOut={() => setPausado(false)}
        delayLongPress={200}
      />
      <Pressable
        style={styles.tapRight}
        onPress={avancar}
        onLongPress={() => setPausado(true)}
        onPressOut={() => setPausado(false)}
        delayLongPress={200}
      />

      {/* Rodapé — só para stories próprios */}
      {souEu && (
        <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.viewersBtn}
              onPress={abrirViewers}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={styles.viewersText}>{contagemViewers}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMenuAberto(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Legenda inicial */}
      {mostrarLegenda && grupoAtual === 0 && storyAtual === 0 && (
        <View style={styles.legendaWrapper} pointerEvents="none">
          <View style={styles.legendaBox}>
            <Text style={styles.legendaText}>
              Toca nos lados · Segura para pausar
            </Text>
          </View>
        </View>
      )}

      {/* Menu ⋯ (bottom sheet) */}
      <Modal
        visible={menuAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuAberto(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuAberto(false)}
        >
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Opções do story</Text>
            </View>

            {/* Ver quem viu */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={abrirViewers}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={22} color="#1a1a1a" />
              <Text style={styles.sheetOptionText}>Ver quem viu</Text>
            </TouchableOpacity>

            {/* Apagar */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleApagar}
              disabled={apagando}
              activeOpacity={0.7}
            >
              {apagando ? (
                <ActivityIndicator color={COR.perigo} size="small" />
              ) : (
                <Ionicons name="trash-outline" size={22} color={COR.perigo} />
              )}
              <Text
                style={[styles.sheetOptionText, { color: COR.perigo }]}
              >
                {apagando ? 'A apagar...' : 'Apagar story'}
              </Text>
            </TouchableOpacity>

            {/* Cancelar */}
            <TouchableOpacity
              style={styles.sheetCancelar}
              onPress={() => setMenuAberto(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function calcularTempo(valor: any): string {
  if (!valor) return 'agora';
  let ms: number;
  if (valor.toMillis) ms = valor.toMillis();
  else if (typeof valor === 'string') ms = new Date(valor).getTime();
  else return 'agora';

  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} dias`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagem: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  safeArea: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: COR.barraInativa,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COR.barraAtiva,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  autorNome: {
    color: COR.texto,
    fontSize: 14,
    fontWeight: '700',
  },
  tempo: {
    color: COR.textoMedio,
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapLeft: {
    position: 'absolute',
    top: 100,
    left: 0,
    bottom: 100,
    width: '33%',
  },
  tapRight: {
    position: 'absolute',
    top: 100,
    right: 0,
    bottom: 100,
    width: '67%',
  },
  legendaWrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  legendaBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  viewersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
  },
  viewersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal / bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: COR.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COR.sheet,
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