import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    agruparPorAutor,
    escutarStoriesAtivos,
    GrupoStories,
    Story,
} from '../../services/stories';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DURACAO_STORY = 5000; // 5 segundos

const COR = {
  texto: '#FFFFFF',
  textoMedio: 'rgba(255,255,255,0.7)',
  barraAtiva: '#FFFFFF',
  barraInativa: 'rgba(255,255,255,0.35)',
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

  const progressInterval = useRef<any>(null);
  const legendaTimeout = useRef<any>(null);

  // ============ CARREGAR GRUPOS ============
  useEffect(() => {
    const unsub = escutarStoriesAtivos((stories: Story[]) => {
      const grupos = agruparPorAutor(stories);
      setTodosGrupos(grupos);
      setLoading(false);

      // Encontra o índice do user pedido
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

  // ============ MOSTRAR LEGENDA POR 3s (só na 1ª story) ============
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

    // Reseta o progresso
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

    // Próxima story do mesmo user
    if (storyAtual < grupo.stories.length - 1) {
      setStoryAtual(storyAtual + 1);
      return;
    }

    // Próximo user
    if (grupoAtual < todosGrupos.length - 1) {
      setGrupoAtual(grupoAtual + 1);
      setStoryAtual(0);
      return;
    }

    // Fim — fecha
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
    // Primeira story do primeiro grupo — não faz nada
  }

  // ============ FECHAR ============
  function fechar() {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (legendaTimeout.current) clearTimeout(legendaTimeout.current);
    router.back();
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

  return (
    <View style={styles.container}>
      {/* Imagem de fundo */}
      <Image
        source={{ uri: story.imagemURL }}
        style={styles.imagem}
        resizeMode="cover"
      />

      {/* Overlay escuro no topo */}
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

      {/* Zonas de toque (esquerda/direita) com deteção de pausa */}
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

      {/* Legenda (aparece 3s) */}
      {mostrarLegenda && grupoAtual === 0 && storyAtual === 0 && (
        <View style={styles.legendaWrapper} pointerEvents="none">
          <View style={styles.legendaBox}>
            <Text style={styles.legendaText}>
              Toca nos lados · Segura para pausar
            </Text>
          </View>
        </View>
      )}
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
    bottom: 0,
    width: '33%',
  },
  tapRight: {
    position: 'absolute',
    top: 100,
    right: 0,
    bottom: 0,
    width: '67%',
  },
  legendaWrapper: {
    position: 'absolute',
    bottom: 40,
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
});