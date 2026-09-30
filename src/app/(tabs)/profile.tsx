import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import { uploadFotoPerfil } from '../../services/storage';
import {
  getUserProfile,
  marcarEmailVerificado,
  updateUserProfile,
  UserProfile,
} from '../../services/users';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [fotoURL, setFotoURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      if (user.emailVerified) {
        await marcarEmailVerificado(user.uid);
      }

      const dados = await getUserProfile(user.uid);
      if (dados) {
        setProfile({ ...dados, emailVerificado: user.emailVerified });
        setNome(dados.nome || '');
        setBio(dados.bio || '');
        setFotoURL(dados.fotoURL || '');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function escolherFoto() {
    if (Platform.OS !== 'web') {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
        return;
      }
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      await processarFoto(resultado.assets[0].uri);
    }
  }

  async function processarFoto(uri: string) {
    if (!profile) return;

    setUploadingFoto(true);
    try {
      const url = await uploadFotoPerfil(profile.uid, uri);
      await updateUserProfile(profile.uid, { fotoURL: url });
      setFotoURL(url);
      setProfile({ ...profile, fotoURL: url });
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
      console.error(error);
    } finally {
      setUploadingFoto(false);
    }
  }

  async function guardarAlteracoes() {
    if (!profile) return;

    setSaving(true);
    try {
      await updateUserProfile(profile.uid, { nome, bio });
      Alert.alert('Guardado!', 'O teu perfil foi atualizado.');
      setProfile({ ...profile, nome, bio });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Terminar sessão', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text>Perfil não encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={escolherFoto} disabled={uploadingFoto}>
            <View style={styles.avatar}>
              {uploadingFoto ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : fotoURL ? (
                <Image source={{ uri: fotoURL }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {nome
                    ? nome.charAt(0).toUpperCase()
                    : profile.email.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.email}>{profile.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile.role}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="O teu nome"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Fala um pouco sobre ti..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={guardarAlteracoes}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar alterações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Terminar sessão</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  cameraBadgeText: {
    fontSize: 18,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});