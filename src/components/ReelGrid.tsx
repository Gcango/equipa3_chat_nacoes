import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { escutarReelsDoUser, Reel } from '../services/reels';

const NUM_COLUNAS = 3;

interface Props {
  userId: string;
}

export function ReelGrid({ userId }: Props) {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const unsub = escutarReelsDoUser(userId, (lista) => {
      setReels(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const tamanho = largura > 0 ? largura / NUM_COLUNAS : 0;

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
    <View
      style={styles.grid}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
    >
      {tamanho > 0 &&
        reels.map((reel) => (
          <TouchableOpacity
            key={reel.id}
            style={[styles.cell, { width: tamanho, height: tamanho }]}
            onPress={() => router.push(`/reel/${reel.id}` as any)}
            activeOpacity={0.85}
          >
            {reel.thumbURL ? (
              <Image
                source={{ uri: reel.thumbURL }}
                style={styles.imagem}
                resizeMode="cover"
              />
            ) : (
              // Placeholder cinzento (reel sem thumbnail)
              <View style={styles.placeholder}>
                <Ionicons
                  name="videocam-outline"
                  size={28}
                  color="#b7b7b7"
                />
              </View>
            )}

            {/* Badge ▶ no canto superior direito */}
            <View style={styles.playBadge}>
              <Ionicons name="play" size={10} color="#fff" />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  cell: {
    position: 'relative',
    backgroundColor: '#f2f2f2',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ececec',
  },
  playBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1.5,
  },
});