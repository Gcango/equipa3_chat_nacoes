import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReelItem } from '../../components/ReelItem';
import { escutarReels, Reel } from '../../services/reels';

const { height: SCREEN_H } = Dimensions.get('window');

const COR = {
  fundo: '#000',
  texto: '#FFFFFF',
  textoMedio: 'rgba(255,255,255,0.75)',
  acento: '#2563EB',
};

export default function ReelDetailScreen() {
  const router = useRouter();
  const { reelId } = useLocalSearchParams<{ reelId: string }>();

  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexVisivel, setIndexVisivel] = useState(0);
  const [somAtivo, setSomAtivo] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Escuta reels
  useEffect(() => {
    const unsub = escutarReels((lista) => {
      setReels(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Quando os reels carregam, procura o reelId e faz scroll
  useEffect(() => {
    if (loading || scrolled) return;
    if (reels.length === 0) return;

    const idx = reels.findIndex((r) => r.id === reelId);
    if (idx === -1) {
      setNaoEncontrado(true);
      return;
    }

    setIndexVisivel(idx);
    setScrolled(true);

    // Aguarda o FlatList estar pronto
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({ index: idx, animated: false });
      } catch (e) {
        // Se falhar, tenta com getItemLayout
        console.error('Erro scrollToIndex:', e);
      }
    }, 150);
  }, [loading, reels, reelId, scrolled]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setIndexVisivel(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Reel não encontrado
  if (naoEncontrado) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.emptyContainer}>
          <Ionicons
            name="videocam-off-outline"
            size={64}
            color={COR.textoMedio}
          />
          <Text style={styles.emptyTitle}>Reel não disponível</Text>
          <Text style={styles.emptySub}>
            Este Reel já não existe ou foi apagado.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            estaVisivel={index === indexVisivel}
            somAtivo={somAtivo}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        onScrollToIndexFailed={(info) => {
          // Fallback
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false,
            });
          }, 100);
        }}
      />

      {/* Botão voltar (topo esquerdo) */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Botão som (topo direito) */}
      <TouchableOpacity
        style={styles.soundBtn}
        onPress={() => setSomAtivo(!somAtivo)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={somAtivo ? 'volume-high' : 'volume-mute'}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR.fundo,
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
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COR.textoMedio,
    textAlign: 'center',
    maxWidth: 300,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  soundBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});