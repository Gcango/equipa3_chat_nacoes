import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import {
    deixarDeSeguirUser,
    escutarEleSegueMe,
    escutarEstouASeguir,
    seguirUser,
} from '../services/follows';

interface Props {
  userId: string;
  compact?: boolean; // se true, botão mais pequeno (para lista de seguidores)
}

export function FollowButton({ userId, compact = false }: Props) {
  const [estou, setEstou] = useState(false);
  const [eleMeSegue, setEleMeSegue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const unsub1 = escutarEstouASeguir(userId, (v) => {
      setEstou(v);
      setReady(true);
    });
    const unsub2 = escutarEleSegueMe(userId, setEleMeSegue);
    return () => {
      unsub1();
      unsub2();
    };
  }, [userId]);

  async function handleSeguir() {
    setLoading(true);
    try {
      await seguirUser(userId);
    } catch (error) {
      console.error('Erro ao seguir:', error);
      Alert.alert('Erro', 'Não foi possível seguir.');
    } finally {
      setLoading(false);
    }
  }

  function handleDeixarDeSeguir() {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm('Deixar de seguir?');
      if (confirmar) {
        deixarDeSeguirUser(userId).catch((e) => {
          console.error(e);
          window.alert('Não foi possível deixar de seguir.');
        });
      }
      return;
    }

    Alert.alert('Deixar de seguir', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deixar de seguir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deixarDeSeguirUser(userId);
          } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível.');
          }
        },
      },
    ]);
  }

  if (!ready) {
    return (
      <TouchableOpacity
        style={[compact ? styles.btnCompact : styles.btn, styles.btnLoading]}
        disabled
      >
        <ActivityIndicator size="small" color="#fff" />
      </TouchableOpacity>
    );
  }

  // Já sigo → "A seguir" (cinzento)
  if (estou) {
    return (
      <TouchableOpacity
        style={[
          compact ? styles.btnCompact : styles.btn,
          styles.btnFollowing,
        ]}
        onPress={handleDeixarDeSeguir}
        disabled={loading}
      >
        <Text style={[styles.btnText, styles.btnTextFollowing]}>
          A seguir
        </Text>
      </TouchableOpacity>
    );
  }

  // Ele segue-me mas eu não → "Seguir de volta"
  if (eleMeSegue) {
    return (
      <TouchableOpacity
        style={[compact ? styles.btnCompact : styles.btn, styles.btnPrimary]}
        onPress={handleSeguir}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.btnText}>Seguir de volta</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Caso padrão → "Seguir"
  return (
    <TouchableOpacity
      style={[compact ? styles.btnCompact : styles.btn, styles.btnPrimary]}
      onPress={handleSeguir}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.btnText}>Seguir</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
  },
  btnFollowing: {
    backgroundColor: '#efefef',
  },
  btnLoading: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextFollowing: {
    color: '#1a1a1a',
  },
});