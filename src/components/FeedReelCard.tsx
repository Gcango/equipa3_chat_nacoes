import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../services/firebase';
import { addLikeReel, Reel, removeLikeReel } from '../services/reels';
import { PostMenu } from './PostMenu';
import { ReportModal } from './ReportModal';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_WIDTH = Math.min(SCREEN_W - 32, 568);
const VIDEO_HEIGHT = VIDEO_WIDTH * (5 / 4); // 4:5

const ROLE_CORES: Record<string, string> = {
  aluno: '#007AFF',
  professor: '#34C759',
  admin: '#FF3B30',
};

function formatarTempoRelativo(timestamp: any): string {
  if (!timestamp) return 'agora';
  let ms: number;
  if (timestamp.toMillis) ms = timestamp.toMillis();
  else if (typeof timestamp === 'string') ms = new Date(timestamp).getTime();
  else return 'agora';

  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return `há ${Math.floor(diff / 2592000)} meses`;
}

function formatarDuracao(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

interface Props {
  reel: Reel;
  estaVisivel: boolean;
  onApagado?: () => void;
}

export function FeedReelCard({ reel, estaVisivel, onApagado }: Props) {
  const router = useRouter();
  const [curtidas, setCurtidas] = useState<string[]>(reel.curtidas || []);
  const [curtindo, setCurtindo] = useState(false);
  const [somAtivo, setSomAtivo] = useState(false);
  const [videoPronto, setVideoPronto] = useState(false);
  const [pausadoManualmente, setPausadoManualmente] = useState(false);

  // Menu ⋯
  const [menuAberto, setMenuAberto] = useState(false);
  const [reportVisivel, setReportVisivel] = useState(false);

  const meuUid = auth.currentUser?.uid;
  const curtiu = meuUid ? curtidas.includes(meuUid) : false;
  const totalCurtidas = curtidas.length;

  const player = useVideoPlayer(reel.videoURL, (p) => {
    p.loop = true;
    p.muted = true;
  });

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

      if (estaVisivel && !pausadoManualmente) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {
      // ignore
    }
  }, [estaVisivel, somAtivo, pausadoManualmente, player]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch (e) {}
    };
  }, [player]);

  useEffect(() => {
    if (!estaVisivel) {
      setPausadoManualmente(false);
    }
  }, [estaVisivel]);

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

  function abrirPlayer() {
    router.push(`/reel/${reel.id}` as any);
  }

  function togglePlayPause(e: any) {
    e?.stopPropagation?.();

    try {
      if (player.playing) {
        player.pause();
        setPausadoManualmente(true);
      } else {
        player.play();
        setPausadoManualmente(false);
      }
    } catch (err) {}
  }

  const roleCor = ROLE_CORES[reel.autorRole] || '#666';

  return (
    <View style={styles.card}>
      {/* Header — igual ao post */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.push(`/user/${reel.autorId}` as any)}
          activeOpacity={0.7}
        >
          {reel.autorFotoURL ? (
            <Image source={{ uri: reel.autorFotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {reel.autorNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.autorNome}>{reel.autorNome}</Text>
            <View style={styles.metaRow}>
              <View
                style={[styles.roleBadge, { backgroundColor: roleCor + '20' }]}
              >
                <Text style={[styles.roleText, { color: roleCor }]}>
                  {reel.autorRole}
                </Text>
              </View>
              <Text style={styles.meta}>
                {formatarTempoRelativo(reel.criadoEm)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botão ⋯ */}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setMenuAberto(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Vídeo 4:5 */}
      <TouchableOpacity
        style={styles.videoWrapper}
        onPress={abrirPlayer}
        activeOpacity={0.95}
      >
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />

        {!videoPronto && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {videoPronto && pausadoManualmente && (
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={togglePlayPause}
            activeOpacity={0.7}
          >
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.soundBtn}
          onPress={(e) => {
            e?.stopPropagation?.();
            setSomAtivo(!somAtivo);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={somAtivo ? 'volume-high' : 'volume-mute'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={styles.durationBadge}>
          <Ionicons name="play-circle" size={12} color="#fff" />
          <Text style={styles.durationText}>
            {formatarDuracao(reel.duracao)}
          </Text>
        </View>
      </TouchableOpacity>

      {reel.legenda ? (
        <Text style={styles.legenda} numberOfLines={3}>
          {reel.legenda}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.action}
          onPress={toggleLike}
          disabled={curtindo}
          activeOpacity={0.7}
        >
          <Ionicons
            name={curtiu ? 'heart' : 'heart-outline'}
            size={22}
            color={curtiu ? '#ff3b30' : '#666'}
          />
          <Text
            style={[
              styles.actionText,
              curtiu && { color: '#ff3b30', fontWeight: '600' },
            ]}
          >
            {totalCurtidas}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={() =>
            router.push(
              `/comments/${reel.id}?postAutorId=${reel.autorId}` as any
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>
      </View>

      {/* Menu ⋯ */}
      <PostMenu
        visivel={menuAberto}
        fechar={() => setMenuAberto(false)}
        tipo="reel"
        conteudoId={reel.id}
        autorId={reel.autorId}
        autorNome={reel.autorNome}
        onDenunciar={() => setReportVisivel(true)}
        onApagado={() => {
          setTimeout(() => onApagado?.(), 200);
        }}
      />

      {/* Modal de denúncia */}
      <ReportModal
        visivel={reportVisivel}
        fechar={() => setReportVisivel(false)}
        tipo="post"
        alvoId={reel.id}
        postId={reel.id}
        conteudoDenunciado={reel.legenda || '[Reel sem legenda]'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
    gap: 4,
  },
  autorNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 12,
    color: '#666',
  },
  videoWrapper: {
    width: '100%',
    height: VIDEO_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  legenda: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
  },
});