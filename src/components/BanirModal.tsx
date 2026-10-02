import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { banirUtilizador } from '../services/admin';

const COR = {
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  acento: '#2563EB',
  perigo: '#DC2626',
  perigoClaro: '#FEF2F2',
};

const PALAVRA_CONFIRMACAO = 'BANIR';

interface Props {
  visivel: boolean;
  fechar: () => void;
  user: { uid: string; nome: string; email: string } | null;
}

export function BanirModal({ visivel, fechar, user }: Props) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!visivel) setTexto('');
  }, [visivel]);

  const podeConfirmar =
    texto.trim().toUpperCase() === PALAVRA_CONFIRMACAO && !enviando;

  async function aplicar() {
    if (!user || !podeConfirmar) return;

    setEnviando(true);
    try {
      await banirUtilizador(user.uid, true);
      fechar();
      if (Platform.OS === 'web') {
        window.alert('Utilizador banido. Todo o conteúdo foi removido.');
      } else {
        Alert.alert('Utilizador banido', 'Todo o conteúdo dele foi removido.');
      }
    } catch (e: any) {
      const erro = e?.message || 'Não foi possível banir.';
      if (Platform.OS === 'web') window.alert(erro);
      else Alert.alert('Erro', erro);
    } finally {
      setEnviando(false);
    }
  }

  if (!user) return null;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Ícone de alerta */}
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={32} color={COR.perigo} />
          </View>

          <Text style={styles.titulo}>Banir utilizador</Text>
          <Text style={styles.subtitulo}>
            Tens a certeza que queres banir{' '}
            <Text style={styles.bold}>{user.nome || user.email}</Text>?
          </Text>

          {/* Aviso do que vai acontecer */}
          <View style={styles.avisoBox}>
            <Text style={styles.avisoTitulo}>AÇÃO IRREVERSÍVEL</Text>
            <View style={styles.avisoItem}>
              <Ionicons name="close-circle" size={14} color={COR.perigo} />
              <Text style={styles.avisoTexto}>
                O utilizador não poderá fazer login
              </Text>
            </View>
            <View style={styles.avisoItem}>
              <Ionicons name="close-circle" size={14} color={COR.perigo} />
              <Text style={styles.avisoTexto}>
                Todos os posts e comentários dele serão apagados
              </Text>
            </View>
            <View style={styles.avisoItem}>
              <Ionicons name="close-circle" size={14} color={COR.perigo} />
              <Text style={styles.avisoTexto}>
                Os seguidores e quem ele segue serão removidos
              </Text>
            </View>
          </View>

          {/* Confirmação */}
          <Text style={styles.label}>
            Escreve <Text style={styles.bold}>BANIR</Text> para confirmar:
          </Text>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="BANIR"
            placeholderTextColor={COR.textoClaro}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!enviando}
          />

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancelar]}
              onPress={fechar}
              disabled={enviando}
            >
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnBanir,
                !podeConfirmar && styles.btnDisabled,
              ]}
              onPress={aplicar}
              disabled={!podeConfirmar}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnBanirText}>Banir</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: COR.card,
    borderRadius: 14,
    width: '100%',
    maxWidth: 480,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COR.perigoClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: COR.textoPrincipal,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: COR.textoMedio,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  avisoBox: {
    backgroundColor: COR.perigoClaro,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    alignSelf: 'stretch',
  },
  avisoTitulo: {
    fontSize: 10,
    fontWeight: '700',
    color: COR.perigo,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  avisoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avisoTexto: {
    fontSize: 13,
    color: COR.textoPrincipal,
    flex: 1,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    color: COR.textoMedio,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: COR.divisoria,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: COR.textoPrincipal,
    borderWidth: 1,
    borderColor: COR.borda,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelar: {
    backgroundColor: COR.card,
    borderWidth: 1,
    borderColor: COR.borda,
  },
  btnCancelarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COR.textoPrincipal,
  },
  btnBanir: {
    backgroundColor: COR.perigo,
  },
  btnBanirText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});