import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../services/firebase';
import {
    criarDenuncia,
    MotivoDenuncia,
    MOTIVOS,
    TipoDenuncia,
} from '../services/reports';
import { getUserProfile } from '../services/users';

interface Props {
  visivel: boolean;
  fechar: () => void;
  tipo: TipoDenuncia;
  alvoId: string;
  postId: string;
  conteudoDenunciado: string;
}

export function ReportModal({
  visivel,
  fechar,
  tipo,
  alvoId,
  postId,
  conteudoDenunciado,
}: Props) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<MotivoDenuncia | null>(null);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!visivel) {
      // Reset ao fechar
      setMotivoSelecionado(null);
      setDescricao('');
    }
  }, [visivel]);

  async function enviar() {
    if (!motivoSelecionado) {
      Alert.alert('Escolhe um motivo', 'Precisas de escolher o motivo da denúncia.');
      return;
    }

    setEnviando(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Não autenticado');

      const perfil = await getUserProfile(user.uid);
      const autorNome = perfil?.nome || user.email?.split('@')[0] || 'Utilizador';

      await criarDenuncia({
        tipo,
        alvoId,
        postId,
        motivo: motivoSelecionado,
        descricao,
        conteudoDenunciado,
        autorNome,
      });

      if (Platform.OS === 'web') {
        window.alert('Denúncia enviada. Obrigado por ajudares a manter a comunidade segura.');
      } else {
        Alert.alert('Denúncia enviada', 'Obrigado por ajudares a manter a comunidade segura.');
      }
      fechar();
    } catch (error) {
      console.error('Erro ao denunciar:', error);
      if (Platform.OS === 'web') {
        window.alert('Não foi possível enviar a denúncia.');
      } else {
        Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={fechar}>
              <Ionicons name="close" size={26} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Denunciar</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.subtitle}>
              Porque estás a denunciar este conteúdo?
            </Text>

            {/* Motivos */}
            <View style={styles.motivos}>
              {MOTIVOS.map((m) => {
                const selecionado = motivoSelecionado === m.valor;
                return (
                  <TouchableOpacity
                    key={m.valor}
                    style={[styles.motivo, selecionado && styles.motivoAtivo]}
                    onPress={() => setMotivoSelecionado(m.valor)}
                  >
                    <Ionicons
                      name={selecionado ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selecionado ? '#007AFF' : '#999'}
                    />
                    <Text
                      style={[
                        styles.motivoText,
                        selecionado && styles.motivoTextAtivo,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Descrição opcional */}
            <Text style={styles.label}>Detalhes (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Descreve o problema..."
              placeholderTextColor="#999"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              maxLength={300}
            />
            <Text style={styles.counter}>{descricao.length}/300</Text>

            {/* Botão */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!motivoSelecionado || enviando) && styles.submitBtnDisabled,
              ]}
              onPress={enviar}
              disabled={!motivoSelecionado || enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Enviar denúncia</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 16,
    fontWeight: '500',
  },
  motivos: {
    gap: 8,
    marginBottom: 20,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  motivoAtivo: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  motivoText: {
    fontSize: 15,
    color: '#333',
  },
  motivoTextAtivo: {
    color: '#007AFF',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});