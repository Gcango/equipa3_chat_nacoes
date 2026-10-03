import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { ReelItem } from '../../components/ReelItem';
import { escutarReels, Reel } from '../../services/reels';

const { height: SCREEN_H } = Dimensions.get('window');

const COR = {
  fundo: '#000',
  texto: '#FFFFFF',
  textoMedio: 'rgba(255,255,255,0.75)',
  acento: '#2563EB',
};

export default function ReelsScreen() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexVisivel, setIndexVisivel] = useState(0);
  const [somAtivo, setSomAtivo] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsub = escutarReels((lista) => {
      setReels(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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

  function handleApagado(reelId: string) {
    setReels((prev) => prev.filter((r) => r.id !== reelId));
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={72} color={COR.textoMedio} />
        <Text style={styles.emptyTitle}>Sem Reels</Text>
        <Text style={styles.emptySub}>
          Ainda não há vídeos publicados. Sê o primeiro!
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/create-reel' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyButtonText}>Criar Reel</Text>
        </TouchableOpacity>
      </View>
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
            onApagado={() => handleApagado(item.id)}
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
      />

      {/* Botão som */}
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

      {/* Botão criar */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => router.push('/create-reel' as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COR.fundo,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COR.fundo,
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
    maxWidth: 280,
  },
  emptyButton: {
    backgroundColor: COR.acento,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  },
  createBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});