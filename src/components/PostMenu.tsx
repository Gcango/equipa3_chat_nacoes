import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apagarConteudo } from '../services/content';
import { auth } from '../services/firebase';

const COR = {
  fundo: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  perigo: '#DC2626',
};

interface Props {
  visivel: boolean;
  fechar: () => void;
  tipo: 'post' | 'reel';
  conteudoId: string;
  autorId: string;
  /** Nome do autor (para mostrar no aviso) */
  autorNome?: string;
  /** Callback ao abrir o ReportModal (só se for de outro) */
  onDenunciar?: () => void;
  /** Callback quando o conteúdo é apagado com sucesso */
  onApagado?: () => void;
}

export function PostMenu({
  visivel,
  fechar,
  tipo,
  conteudoId,
  autorId,
  autorNome,
  onDenunciar,
  onApagado,
}: Props) {
  const [apagando, setApagando] = useState(false);

  const meuUid = auth.currentUser?.uid;
  const souEu = meuUid === autorId;

  async function confirmarApagar() {
    const executar = async () => {
      setApagando(true);
      try {
        await apagarConteudo(tipo, conteudoId);
        fechar();
        onApagado?.();

        if (Platform.OS === 'web') {
          window.alert('Conteúdo apagado.');
        } else {
          Alert.alert('Apagado', 'O conteúdo foi removido.');
        }
      } catch (e: any) {
        const msg = e?.message || 'Não foi possível apagar.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Erro', msg);
        }
      } finally {
        setApagando(false);
      }
    };

    const msg = `Vais apagar ${
      tipo === 'reel' ? 'este reel' : 'esta publicação'
    } permanentemente. Esta ação não pode ser desfeita.`;

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executar();
    } else {
      Alert.alert('Apagar', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: executar },
      ]);
    }
  }

  function handleDenunciar() {
    fechar();
    setTimeout(() => onDenunciar?.(), 200);
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <Pressable style={styles.overlay} onPress={fechar}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle (barra pequena no topo) */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {souEu ? 'Opções' : 'Opções do conteúdo'}
            </Text>
            {autorNome && !souEu && (
              <Text style={styles.headerSub}>
                De {autorNome}
              </Text>
            )}
          </View>

          {/* Opções */}
          <View style={styles.opcoes}>
            {souEu ? (
              // Se for meu: Apagar
              <TouchableOpacity
                style={styles.opcao}
                onPress={confirmarApagar}
                disabled={apagando}
                activeOpacity={0.7}
              >
                {apagando ? (
                  <ActivityIndicator color={COR.perigo} size="small" />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={COR.perigo}
                  />
                )}
                <Text style={[styles.opcaoText, { color: COR.perigo }]}>
                  {apagando ? 'A apagar...' : 'Apagar'}
                </Text>
              </TouchableOpacity>
            ) : (
              // Se for de outro: Denunciar
              <TouchableOpacity
                style={styles.opcao}
                onPress={handleDenunciar}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="flag-outline"
                  size={22}
                  color={COR.textoPrincipal}
                />
                <Text style={styles.opcaoText}>Denunciar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cancelar */}
          <TouchableOpacity
            style={styles.cancelar}
            onPress={fechar}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COR.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COR.fundo,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    minHeight: 200,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  headerSub: {
    fontSize: 13,
    color: COR.textoMedio,
    marginTop: 2,
  },
  opcoes: {
    paddingVertical: 8,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  opcaoText: {
    fontSize: 16,
    fontWeight: '500',
    color: COR.textoPrincipal,
  },
  cancelar: {
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COR.divisoria,
    alignItems: 'center',
  },
  cancelarText: {
    fontSize: 15,
    fontWeight: '600',
    color: COR.textoPrincipal,
  },
});