import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';

const DOMINIO_ESCOLA = '@epfundao.edu.pt';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preenche todos os campos.');
      return;
    }

    if (!email.toLowerCase().endsWith(DOMINIO_ESCOLA)) {
      Alert.alert('Email inválido', 'Verifica o teu email escolar.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password fraca',
        'A password tem de ter pelo menos 6 caracteres.'
      );
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }

      await signOut(auth);

      Alert.alert(
        'Conta criada!',
        'Enviámos um email de verificação para o teu email escolar.\n\n' +
          'Abre o email e clica no link para ativar a conta.\n\n' +
          'Não o vês? Verifica também a pasta de spam.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      let mensagem = 'Ocorreu um erro. Tenta novamente.';

      if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este email já está registado.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'Verifica o teu email escolar.';
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'A password é demasiado fraca (mínimo 6 caracteres).';
      } else if (error.code === 'auth/network-request-failed') {
        mensagem = 'Sem ligação à internet. Verifica a tua rede.';
      } else if (error.message?.includes('Email não autorizado')) {
        mensagem = 'Verifica o teu email escolar.';
      }

      Alert.alert('Erro', mensagem);
      console.log('Erro no registo:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo Chat Nações */}
          <Image
            source={require('../../../assets/images/ChatNacoes.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.subtitle}>Criar conta</Text>

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
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.link}>
              Já tens conta? Faz login
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },

  logo: {
    width: 220,
    height: 112,
    alignSelf: 'center',
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