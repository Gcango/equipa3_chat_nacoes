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
import { promoverPrimeiroAdmin } from '../services/admin';
import { auth } from '../services/firebase';

export default function SetupAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePromover() {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Tens de estar autenticado.');
      return;
    }

    const confirmar =
      Platform.OS === 'web'
        ? window.confirm(
            'Vais tornar-te o primeiro admin do sistema. Continuar?'
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Tornar-me admin',
              'Vais tornar-te o primeiro admin do Chat_Nações. Continuar?',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Sim', onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmar) return;

    setLoading(true);
    try {
      const msg = await promoverPrimeiroAdmin();

      const sucesso = () => {
        router.replace('/(tabs)/profile');
      };

      if (Platform.OS === 'web') {
        window.alert(msg);
        sucesso();
      } else {
        Alert.alert('Sucesso! 🎉', msg, [{ text: 'OK', onPress: sucesso }]);
      }
    } catch (error: any) {
      console.error(error);
      const mensagem = error.message || 'Não foi possível promover.';
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
            <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
          </View>

          <Text style={styles.title}>Setup Inicial</Text>
          <Text style={styles.subtitle}>
            Esta página só funciona <Text style={styles.bold}>uma vez</Text>.
            {'\n\n'}
            Se ainda não existe um admin no sistema, podes tornar-te o primeiro.
            Depois disso, esta função fica bloqueada para sempre.
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePromover}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Tornar-me admin</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  bold: {
    fontWeight: '700',
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
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
    color: '#666',
    fontSize: 15,
  },
});