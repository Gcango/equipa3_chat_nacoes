import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const COR = {
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  divisoria: '#F3F4F6',
  borda: '#E5E7EB',
  acento: '#2563EB',
};

interface Props {
  /** 'post' ou 'reel' */
  tipo: 'post' | 'reel';
  /** ID do post/reel */
  partilhaId: string;
  /** Nome de quem publicou o conteúdo */
  autor: string;
  /** Excerto do texto (vazio se não houver) */
  conteudo: string;
  /** URL da thumbnail (imagem do post ou thumb do reel) */
  thumbURL: string;
  /** Se a mensagem é minha ou do outro (para cor de fundo) */
  minha: boolean;
}

export function SharedPostCard({
  tipo,
  partilhaId,
  autor,
  conteudo,
  thumbURL,
  minha,
}: Props) {
  const router = useRouter();

  function abrir() {
    if (tipo === 'reel') {
      router.push(`/reel/${partilhaId}` as any);
    } else {
      router.push(`/post/${partilhaId}` as any);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, minha ? styles.cardMinha : styles.cardOutra]}
      onPress={abrir}
      activeOpacity={0.85}
    >
      {/* Thumbnail */}
      {thumbURL ? (
        <Image
          source={{ uri: thumbURL }}
          style={styles.thumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons
            name={tipo === 'reel' ? 'videocam-outline' : 'image-outline'}
            size={32}
            color="rgba(255,255,255,0.6)"
          />
        </View>
      )}

      {/* Badge tipo */}
      <View style={styles.badge}>
        <Ionicons
          name={tipo === 'reel' ? 'play' : 'image'}
          size={11}
          color="#fff"
        />
        <Text style={styles.badgeText}>
          {tipo === 'reel' ? 'Reel' : 'Publicação'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.autor} numberOfLines={1}>
          {autor}
        </Text>
        {conteudo ? (
          <Text style={styles.conteudo} numberOfLines={2}>
            {conteudo}
          </Text>
        ) : (
          <Text style={styles.semTexto}>
            {tipo === 'reel' ? 'Vídeo' : '[Publicação com imagens]'}
          </Text>
        )}
      </View>

      {/* Footer: "Toca para ver" */}
      <View style={styles.footer}>
        <Ionicons
          name="arrow-forward-circle-outline"
          size={14}
          color={COR.acento}
        />
        <Text style={styles.footerText}>Toca para ver</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COR.borda,
  },
  cardMinha: {
    // sem alteração visual para agora
  },
  cardOutra: {
    // sem alteração visual para agora
  },
  thumb: {
    width: '100%',
    height: 160,
    backgroundColor: '#111',
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 12,
    gap: 4,
  },
  autor: {
    fontSize: 13,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  conteudo: {
    fontSize: 12,
    color: COR.textoMedio,
    lineHeight: 16,
  },
  semTexto: {
    fontSize: 12,
    color: COR.textoClaro,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COR.divisoria,
    backgroundColor: '#FAFAFA',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COR.acento,
  },
});