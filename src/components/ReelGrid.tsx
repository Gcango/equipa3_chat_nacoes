import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { escutarReelsDoUser, Reel } from '../services/reels';

interface Props {
  userId: string;
}

const NUM_COLUNAS = 3;
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
  const tamanho = containerWidth / NUM_COLUNAS;

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
          activeOpacity={0.85}
        >
          {reel.thumbURL ? (
            <Image
              source={{ uri: reel.thumbURL }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.gridImage, styles.videoBg]}>
              <Ionicons
                name="videocam"
                size={32}
                color="rgba(255,255,255,0.5)"
              />
            </View>
          )}

          {/* Badge ▶ no canto superior direito */}
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={16} color="#fff" />
          </View>

          {/* Duração em baixo */}
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
  loading: { paddingVertical: 60, alignItems: 'center' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#999' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { position: 'relative', backgroundColor: '#111' },
  gridImage: { width: '100%', height: '100%' },
  videoBg: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});