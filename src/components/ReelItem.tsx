import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
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
import { auth } from '../services/firebase';
import {
  addLikeReel,
  Reel,
  removeLikeReel,
} from '../services/reels';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COR = {
  texto: '#FFFFFF',
  textoMedio: 'rgba(255,255,255,0.75)',
  fundoOverlay: 'rgba(0,0,0,0.35)',
  perigo: '#FF3B30',
  acento: '#2563EB',
};

const ROLE_COR: Record<string, string> = {
  aluno: '#2563EB',
  professor: '#059669',
  admin: '#7C3AED',
};

interface Props {
  reel: Reel;
  estaVisivel: boolean;
  somAtivo: boolean;
}

export function ReelItem({ reel, estaVisivel, somAtivo }: Props) {
  const router = useRouter();
  const [curtidas, setCurtidas] = useState<string[]>(reel.curtidas || []);
  const [curtindo, setCurtindo] = useState(false);
  const [videoPronto, setVideoPronto] = useState(false);

  const meuUid = auth.currentUser?.uid;
  const curtiu = meuUid ? curtidas.includes(meuUid) : false;
  const totalCurtidas = curtidas.length;
  const souEu = meuUid === reel.autorId;

  const player = useVideoPlayer(reel.videoURL, (p) => {
    p.loop = true;
    p.muted = !somAtivo;
  });

  // Deteta quando o vídeo está pronto
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEffect(() => {
    if (status === 'readyToPlay') {
      setVideoPronto(true);
    }
  }, [status]);

  useEffect(() => {
    if (!player) return;

    try {
      player.muted = !somAtivo;

      if (estaVisivel) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {
      // ignore
    }
  }, [estaVisivel, somAtivo, player]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch (e) {}
    };
  }, [player]);

  useEffect(() => {
    setCurtidas(reel.curtidas || []);
  }, [reel.curtidas]);

  async function toggleLike() {
    if (curtindo || !meuUid) return;
    setCurtindo(true);

    const otimista = curtiu
      ? curtidas.filter((u) => u !== meuUid)
      : [...curtidas, meuUid];
    setCurtidas(otimista);

    try {
      if (curtiu) {
        await removeLikeReel(reel.id);
      } else {
        await addLikeReel(reel.id);
      }
    } catch (e) {
      setCurtidas(curtidas);
      console.error('Erro ao curtir reel:', e);
    } finally {
      setCurtindo(false);
    }
  }

  const roleCor = ROLE_COR[reel.autorRole] || COR.textoMedio;

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />

      {!videoPronto && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <View style={styles.topGradient} pointerEvents="none" />
      <View style={styles.bottomGradient} pointerEvents="none" />

      <Pressable
        style={styles.tapArea}
        onPress={() => {
          try {
            if (player.playing) {
              player.pause();
            } else {
              player.play();
            }
          } catch (e) {}
        }}
      />

      {/* Avatar + nome + botão Seguir (topo) */}
      <View style={styles.topInfo} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.autorRow}
          onPress={() => router.push(`/user/${reel.autorId}` as any)}
          activeOpacity={0.7}
        >
          {reel.autorFotoURL ? (
            <Image source={{ uri: reel.autorFotoURL }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: roleCor },
              ]}
            >
              <Text style={styles.avatarText}>
                {reel.autorNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.autorNome} numberOfLines={1}>
            {reel.autorNome}
          </Text>
        </TouchableOpacity>

        {!souEu && (
          <TouchableOpacity
            style={styles.followBtn}
            onPress={() => router.push(`/user/${reel.autorId}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.followText}>Seguir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info em baixo */}
      <View style={styles.bottomInfo} pointerEvents="box-none">
        {reel.legenda ? (
          <Text style={styles.legenda} numberOfLines={3}>
            {reel.legenda}
          </Text>
        ) : null}
      </View>

      {/* Ações à direita */}
      <View style={styles.actions} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={toggleLike}
          disabled={curtindo}
          activeOpacity={0.7}
        >
          <Ionicons
            name={curtiu ? 'heart' : 'heart-outline'}
            size={34}
            color={curtiu ? COR.perigo : '#fff'}
          />
          <Text style={styles.actionText}>{totalCurtidas}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push(
              `/comments/${reel.id}?postAutorId=${reel.autorId}` as any
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>

        <View style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={28} color="#fff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: COR.fundoOverlay,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topInfo: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  autorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#333',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  autorNome: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  followText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 90,
  },
  legenda: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    position: 'absolute',
    bottom: 32,
    right: 12,
    gap: 18,
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});