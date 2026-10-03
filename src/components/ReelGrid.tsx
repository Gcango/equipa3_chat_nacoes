import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { escutarReelsDoUser, Reel } from '../services/reels';

interface Props {
  userId: string;
}

const NUM_COLUNAS = 3;
const ESPACO = 2;
const MAX_WIDTH_DESKTOP = 600;

export function ReelGrid({ userId }: Props) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = escutarReelsDoUser(userId, (lista) => {
      setReels(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const containerWidth =
    Platform.OS === 'web' ? Math.min(windowWidth, MAX_WIDTH_DESKTOP) : windowWidth;
  const tamanho =
    (containerWidth - ESPACO * (NUM_COLUNAS - 1) - ESPACO * 2) / NUM_COLUNAS;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="videocam-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Ainda sem reels</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {reels.map((reel) => (
        <TouchableOpacity
          key={reel.id}
          style={[styles.gridItem, { width: tamanho, height: tamanho }]}
          onPress={() => router.push(`/reel/${reel.id}` as any)}
          activeOpacity={0.7}
        >
          {/* Thumbnail — usa o próprio vídeo como preview */}
          <View style={[styles.gridImage, styles.videoBg]}>
            <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.7)" />
          </View>

          {/* Badge ▶ no canto superior direito */}
          <View style={styles.playBadge}>
            <Ionicons name="play" size={10} color="#fff" />
          </View>

          {/* Duração no canto inferior esquerdo */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {Math.floor(reel.duracao / 60)}:
              {Math.floor(reel.duracao % 60)
                .toString()
                .padStart(2, '0')}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACO,
    paddingHorizontal: ESPACO,
  },
  gridItem: {
    position: 'relative',
    backgroundColor: '#111',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBg: {
    backgroundColor: '#111',
  },
  playBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});