import { useRouter } from 'expo-router';
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../../services/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preenche todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const user = userCredential.user;

      // Bloquear se o email não estiver verificado
      if (!user.emailVerified) {
        // Reenviar email de verificação
        try {
          await sendEmailVerification(user);
        } catch (e) {
          console.log('Erro ao reenviar email:', e);
        }

        await signOut(auth);

        Alert.alert(
          'Email não verificado',
          'Ainda não confirmaste o teu email escolar.\n\n' +
            'Enviámos-te um novo link de verificação. ' +
            'Verifica a caixa de entrada (e a pasta de spam).'
        );
        return;
      }

      // Login com sucesso ✅
        router.replace('/(tabs)/profile');
      // router.replace('/(tabs)'); // descomentar quando o feed estiver criado
    } catch (error: any) {
      let mensagem = 'Ocorreu um erro. Tenta novamente.';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        mensagem = 'Email ou password incorretos.';
      } else if (error.code === 'auth/user-not-found') {
        mensagem = 'Não existe conta com este email.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'Verifica o teu email escolar.';
      } else if (error.code === 'auth/too-many-requests') {
        mensagem = 'Demasiadas tentativas. Tenta novamente mais tarde.';
      } else if (error.code === 'auth/network-request-failed') {
        mensagem = 'Sem ligação à internet. Verifica a tua rede.';
      }

      Alert.alert('Erro', mensagem);
      console.log('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Chat_Nações</Text>
        <Text style={styles.subtitle}>Entrar</Text>

        <TextInput
          style={styles.input}
          placeholder="Email escolar"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Ainda não tens conta? Regista-te</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});