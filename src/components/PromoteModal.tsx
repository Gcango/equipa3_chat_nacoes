import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { promoverUtilizador } from '../services/admin';

const COR = {
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  acento: '#2563EB',
  acentoClaro: '#EFF6FF',
  sucesso: '#059669',
  perigo: '#DC2626',
};

type Role = 'aluno' | 'professor' | 'admin';

interface Props {
  visivel: boolean;
  fechar: () => void;
  user: { uid: string; nome: string; email: string; role: Role } | null;
}

const OPCOES: { valor: Role; label: string; desc: string }[] = [
  {
    valor: 'aluno',
    label: 'Aluno',
    desc: 'Acesso normal — publica, comenta e reage',
  },
  {
    valor: 'professor',
    label: 'Professor',
    desc: 'Pode publicar projetos em destaque',
  },
  {
    valor: 'admin',
    label: 'Administrador',
    desc: 'Acesso total — modera, promove e bane',
  },
];

export function PromoteModal({ visivel, fechar, user }: Props) {
  const [selecionado, setSelecionado] = useState<Role | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (visivel && user) {
      setSelecionado(user.role);
    } else {
      setSelecionado(null);
    }
  }, [visivel, user]);

  async function aplicar() {
    if (!user || !selecionado) return;
    if (selecionado === user.role) {
      fechar();
      return;
    }

    setEnviando(true);
    try {
      const msg = await promoverUtilizador(user.uid, selecionado);
      fechar();
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Sucesso', msg);
      }
    } catch (e: any) {
      const erro = e?.message || 'Não foi possível alterar.';
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Alterar função</Text>
              <Text style={styles.headerSub}>{user.nome || user.email}</Text>
            </View>
            <TouchableOpacity onPress={fechar} disabled={enviando}>
              <Ionicons name="close" size={24} color={COR.textoMedio} />
            </TouchableOpacity>
          </View>

          {/* Opções */}
          <View style={styles.opcoes}>
            {OPCOES.map((op) => {
              const ativo = selecionado === op.valor;
              const atual = user.role === op.valor;
              return (
                <TouchableOpacity
                  key={op.valor}
                  style={[styles.opcao, ativo && styles.opcaoAtiva]}
                  onPress={() => setSelecionado(op.valor)}
                  disabled={enviando}
                  activeOpacity={0.7}
                >
                  <View style={styles.opcaoLeft}>
                    <View
                      style={[
                        styles.radio,
                        ativo && styles.radioAtivo,
                      ]}
                    >
                      {ativo && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.opcaoHeader}>
                        <Text
                          style={[
                            styles.opcaoLabel,
                            ativo && styles.opcaoLabelAtivo,
                          ]}
                        >
                          {op.label}
                        </Text>
                        {atual && (
                          <View style={styles.atualBadge}>
                            <Text style={styles.atualBadgeText}>ATUAL</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.opcaoDesc}>{op.desc}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

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
                styles.btnConfirmar,
                (enviando || !selecionado) && styles.btnDisabled,
              ]}
              onPress={aplicar}
              disabled={enviando || !selecionado}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnConfirmarText}>Confirmar</Text>
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
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  headerSub: {
    fontSize: 13,
    color: COR.textoMedio,
    marginTop: 2,
  },
  opcoes: {
    gap: 8,
  },
  opcao: {
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 10,
    padding: 14,
    backgroundColor: COR.card,
  },
  opcaoAtiva: {
    borderColor: COR.acento,
    backgroundColor: COR.acentoClaro,
  },
  opcaoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COR.textoClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioAtivo: {
    borderColor: COR.acento,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COR.acento,
  },
  opcaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opcaoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COR.textoPrincipal,
  },
  opcaoLabelAtivo: {
    color: COR.acento,
  },
  opcaoDesc: {
    fontSize: 12,
    color: COR.textoMedio,
    marginTop: 2,
  },
  atualBadge: {
    backgroundColor: COR.textoClaro + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  atualBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COR.textoMedio,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COR.divisoria,
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
  btnConfirmar: {
    backgroundColor: COR.acento,
  },
  btnConfirmarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});