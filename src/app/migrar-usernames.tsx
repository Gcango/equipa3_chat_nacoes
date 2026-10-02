import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../components/ScreenContainer';
import { migrarUsernames } from '../services/admin';
import { auth } from '../services/firebase';

export default function MigrarUsernamesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    atualizados: number;
    ignorados: number;
    total: number;
  } | null>(null);

  async function handleMigrar() {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Tens de estar autenticado.');
      return;
    }

    const confirmar =
      Platform.OS === 'web'
        ? window.confirm(
            'Vais adicionar o campo "username" a todos os utilizadores que ainda não têm. Continuar?'
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Migrar usernames',
              'Vai adicionar o campo "username" a todos os utilizadores que ainda não têm. Continuar?',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Sim', onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmar) return;

    setLoading(true);
    try {
      const r = await migrarUsernames();
      setResultado(r);

      const msg = `Migração concluída!\n\nTotal: ${r.total} utilizadores\nAtualizados: ${r.atualizados}\nIgnorados: ${r.ignorados}`;

      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Sucesso!', msg);
      }
    } catch (error: any) {
      console.error(error);
      const mensagem = error.message || 'Não foi possível migrar.';
      if (Platform.OS === 'web') {
        window.alert(mensagem);
      } else {
        Alert.alert('Erro', mensagem);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="git-merge-outline" size={56} color="#2563EB" />
          </View>

          <Text style={styles.title}>Migração de Usernames</Text>
          <Text style={styles.subtitle}>
            Adiciona o campo <Text style={styles.bold}>username</Text> a todos
            os utilizadores que ainda não têm.{'\n\n'}
            Só deve ser corrida <Text style={styles.bold}>uma vez</Text>.
          </Text>

          {resultado && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Última execução:</Text>
              <Text style={styles.resultLine}>Total: {resultado.total}</Text>
              <Text style={styles.resultLine}>
                Atualizados: {resultado.atualizados}
              </Text>
              <Text style={styles.resultLine}>
                Ignorados: {resultado.ignorados}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleMigrar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Correr migração</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  bold: {
    fontWeight: '700',
    color: '#2563EB',
  },
  resultBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 320,
    gap: 4,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  resultLine: {
    fontSize: 14,
    color: '#374151',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 240,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 20,
    padding: 12,
  },
  backText: {
    color: '#6B7280',
    fontSize: 15,
  },
});