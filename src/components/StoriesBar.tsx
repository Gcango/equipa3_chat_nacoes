import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../services/firebase';
import {
    agruparPorAutor,
    escutarStoriesAtivos,
    Story
} from '../services/stories';

const COR = {
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  acento: '#007AFF',
  anel: '#007AFF',
  anelInativo: '#D1D5DB',
  fundo: '#FFFFFF',
};

export function StoriesBar() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const meuUid = auth.currentUser?.uid;

  useEffect(() => {
    const unsub = escutarStoriesAtivos((lista) => {
      setStories(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const grupos = agruparPorAutor(stories);

  // Separa os meus stories dos outros
  const meusStories = grupos.find((g) => g.autorId === meuUid);
  const outrosGrupos = grupos.filter((g) => g.autorId !== meuUid);

  // Não mostrar a barra se não há nada (nem os meus)
  if (loading) return null;
  if (grupos.length === 0 && !meuUid) return null;

  function abrirStories(autorId: string) {
    router.push(`/story/${autorId}` as any);
  }

  function criarStory() {
    router.push('/(tabs)/create-story' as any);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Botão "Seu story" */}
        <View style={styles.itemWrapper}>
          <TouchableOpacity
            style={styles.item}
            onPress={meusStories ? () => abrirStories(meuUid!) : criarStory}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarRing,
                  meusStories ? styles.avatarRingActive : styles.avatarRingInactive,
                ]}
              >
                {meusStories?.autorFotoURL ? (
                  <Image
                    source={{ uri: meusStories.autorFotoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={22} color="#9CA3AF" />
                  </View>
                )}
              </View>

              {/* Botão + no canto (só se NÃO tiver stories, ou sempre) */}
              {!meusStories && (
                <View style={styles.plusButton}>
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>

            <Text style={styles.label} numberOfLines={1}>
              Seu story
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stories dos outros */}
        {outrosGrupos.map((grupo) => (
          <View key={grupo.autorId} style={styles.itemWrapper}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => abrirStories(grupo.autorId)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatarRing, styles.avatarRingActive]}>
                  {grupo.autorFotoURL ? (
                    <Image
                      source={{ uri: grupo.autorFotoURL }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarFallbackText}>
                        {grupo.autorNome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.label} numberOfLines={1}>
                {grupo.autorNome}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COR.fundo,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 16,
  },
  itemWrapper: {
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingActive: {
    borderWidth: 2,
    borderColor: COR.anel,
  },
  avatarRingInactive: {
    borderWidth: 1,
    borderColor: COR.anelInativo,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  plusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COR.acento,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  label: {
    fontSize: 11,
    color: COR.textoPrincipal,
    textAlign: 'center',
    maxWidth: 72,
  },
});