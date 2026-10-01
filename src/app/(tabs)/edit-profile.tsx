import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import { auth } from '../../services/firebase';
import { uploadFotoPerfil } from '../../services/storage';
import {
    getUserProfile,
    updateUserProfile,
    UserProfile,
} from '../../services/users';

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [fotoURL, setFotoURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    const dados = await getUserProfile(user.uid);
    if (dados) {
      setProfile(dados);
      setNome(dados.nome || '');
      setBio(dados.bio || '');
      setFotoURL(dados.fotoURL || '');
    }
    setLoading(false);
  }

  async function escolherFoto() {
    if (Platform.OS !== 'web') {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!p.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
        return;
      }
    }

    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!r.canceled && r.assets[0] && profile) {
      setUploadingFoto(true);
      try {
        const url = await uploadFotoPerfil(profile.uid, r.assets[0].uri);
        await updateUserProfile(profile.uid, { fotoURL: url });
        setFotoURL(url);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível atualizar a foto.');
      } finally {
        setUploadingFoto(false);
      }
    }
  }

  async function guardar() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, { nome, bio });
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm('Terminar sessão?');
      if (confirmar) {
        await signOut(auth);
        router.replace('/(auth)/login');
      }
      return;
    }
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
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={guardar} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Text style={styles.saveBtn}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={escolherFoto}
              disabled={uploadingFoto}
            >
              <View style={styles.avatar}>
                {uploadingFoto ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : fotoURL ? (
                  <Image source={{ uri: fotoURL }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>
                    {nome ? nome.charAt(0).toUpperCase() : '?'}
                  </Text>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.changePhotoText}>Tocar para mudar a foto</Text>

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
              maxLength={150}
            />
            <Text style={styles.counter}>{bio.length}/150</Text>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Terminar sessão</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  saveBtn: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  content: { padding: 24, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 24,
    fontWeight: '500',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    alignSelf: 'stretch',
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
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logoutBtn: {
    alignSelf: 'stretch',
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});