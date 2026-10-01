import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  atualizarEstadoDenuncia,
  DenunciasPorMotivo,
  escutarDenuncias,
  escutarDenunciasPorMotivo,
  escutarEstatisticas,
  Estatisticas,
  removerConteudo,
  Report
} from '../../services/admin';
import { auth } from '../../services/firebase';
import { getUserProfile } from '../../services/users';

type Aba = 'visao' | 'denuncias' | 'utilizadores';
type FiltroDenuncias = 'pendente' | 'resolvido' | 'ignorado' | 'todas';

const VAZIO: Estatisticas = {
  utilizadores: 0,
  publicacoes: 0,
  denuncias: 0,
  denunciasPendentes: 0,
  comentarios: 0,
  likes: 0,
};

const MOTIVOS_VAZIO: DenunciasPorMotivo = {
  spam: 0,
  assedio: 0,
  conteudo_inapropriado: 0,
  violencia: 0,
  outro: 0,
};

const MOTIVOS_LABEL: Record<keyof DenunciasPorMotivo, string> = {
  spam: 'Spam',
  assedio: 'Assédio',
  conteudo_inapropriado: 'Inapropriado',
  violencia: 'Violência',
  outro: 'Outro',
};

const MOTIVOS_EMOJI: Record<string, string> = {
  spam: '📢',
  assedio: '😠',
  conteudo_inapropriado: '🚫',
  violencia: '⚠️',
  outro: '❓',
};

function formatarTempo(valor: any): string {
  if (!valor) return 'agora';
  let dataMs: number;
  if (typeof valor === 'string') dataMs = new Date(valor).getTime();
  else if (valor.toMillis) dataMs = valor.toMillis();
  else return 'agora';

  const d = Math.floor((Date.now() - dataMs) / 1000);
  if (d < 60) return 'agora';
  if (d < 3600) return `há ${Math.floor(d / 60)} min`;
  if (d < 86400) return `há ${Math.floor(d / 3600)} h`;
  if (d < 604800) return `há ${Math.floor(d / 86400)} dias`;
  return `há ${Math.floor(d / 2592000)} meses`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('visao');

  const [stats, setStats] = useState<Estatisticas>(VAZIO);
  const [motivos, setMotivos] = useState<DenunciasPorMotivo>(MOTIVOS_VAZIO);
  const [filtro, setFiltro] = useState<FiltroDenuncias>('pendente');
  const [denuncias, setDenuncias] = useState<Report[]>([]);

  useEffect(() => {
    verificarAcesso();
  }, []);

  async function verificarAcesso() {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    const perfil = await getUserProfile(user.uid);
    if (perfil?.role !== 'admin') {
      router.replace('/(tabs)/profile');
      return;
    }
    setAutorizado(true);
    setLoading(false);
  }

  useEffect(() => {
    if (!autorizado) return;
    const unsub1 = escutarEstatisticas(setStats);
    const unsub2 = escutarDenunciasPorMotivo(setMotivos);
    return () => {
      unsub1();
      unsub2();
    };
  }, [autorizado]);

  useEffect(() => {
    if (!autorizado) return;
    const unsub = escutarDenuncias(filtro, setDenuncias);
    return () => unsub();
  }, [autorizado, filtro]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  if (!autorizado) return null;

  const maxMotivo = Math.max(1, ...Object.values(motivos));

  // ============ AÇÕES ============
  async function handleIgnorar(r: Report) {
    const executar = async () => {
      try {
        await atualizarEstadoDenuncia(r.id, 'ignorado');
      } catch (e) {
        alert('Erro ao ignorar.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Marcar esta denúncia como ignorada?')) executar();
    } else {
      Alert.alert('Ignorar denúncia', 'Confirmas?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ignorar', onPress: executar },
      ]);
    }
  }

  async function handleRemover(r: Report) {
    const executar = async () => {
      try {
        await removerConteudo({
          tipo: r.tipo,
          alvoId: r.tipo === 'post' ? r.postId : r.alvoId,
          postId: r.postId,
        });
        await atualizarEstadoDenuncia(r.id, 'resolvido');
        if (Platform.OS === 'web') window.alert('Conteúdo removido.');
        else Alert.alert('Sucesso', 'Conteúdo removido.');
      } catch (e) {
        console.error(e);
        if (Platform.OS === 'web') window.alert('Erro ao remover.');
        else Alert.alert('Erro', 'Não foi possível remover.');
      }
    };

    const msg = 'Vais apagar este conteúdo permanentemente. Continuar?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executar();
    } else {
      Alert.alert('Remover conteúdo', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: executar },
      ]);
    }
  }

  async function handleBanir(r: Report) {
    // Para banir, precisamos do autorId do conteúdo — não está no report
    // Vamos usar o autorNome como referência e pedir confirmação simples
    const msg =
      'Isto vai banir o autor E apagar TODOS os posts/comentários dele. Continuar?';

    const executar = async () => {
      // Buscar o autor original — no report temos o `postId` mas não o autorId
      // Solução: usar o autorId do post (que obtemos ao abrir)
      // Para simplificar, pedimos ao admin para ir ao post e banir de lá
      if (Platform.OS === 'web') {
        window.alert(
          'Para banir, abre o post denunciado e clica em banir a partir do perfil do autor.'
        );
      } else {
        Alert.alert(
          'Banir',
          'Para banir, abre o post denunciado e clica em banir a partir do perfil do autor.'
        );
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executar();
    } else {
      Alert.alert('Banir autor', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', style: 'destructive', onPress: executar },
      ]);
    }
  }

  function handleVerPost(r: Report) {
    if (r.tipo === 'post') {
      router.push(`/post/${r.postId}` as any);
    } else {
      router.push(`/comments/${r.postId}?postAutorId=` as any);
    }
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Painel</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'visao' && styles.tabActive]}
            onPress={() => setAbaAtiva('visao')}
          >
            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={abaAtiva === 'visao' ? '#007AFF' : '#999'}
            />
            <Text
              style={[
                styles.tabText,
                abaAtiva === 'visao' && styles.tabTextActive,
              ]}
            >
              Visão geral
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'denuncias' && styles.tabActive]}
            onPress={() => setAbaAtiva('denuncias')}
          >
            <View style={styles.tabIconWrapper}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={abaAtiva === 'denuncias' ? '#007AFF' : '#999'}
              />
              {stats.denunciasPendentes > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {stats.denunciasPendentes}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabText,
                abaAtiva === 'denuncias' && styles.tabTextActive,
              ]}
            >
              Denúncias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              abaAtiva === 'utilizadores' && styles.tabActive,
            ]}
            onPress={() => setAbaAtiva('utilizadores')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={abaAtiva === 'utilizadores' ? '#007AFF' : '#999'}
            />
            <Text
              style={[
                styles.tabText,
                abaAtiva === 'utilizadores' && styles.tabTextActive,
              ]}
            >
              Utilizadores
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* ====== VISÃO GERAL ====== */}
          {abaAtiva === 'visao' && (
            <View>
              <View style={styles.cardsRow}>
                <Card
                  icon="people"
                  cor="#007AFF"
                  valor={stats.utilizadores}
                  label="Utilizadores"
                />
                <Card
                  icon="document-text"
                  cor="#34C759"
                  valor={stats.publicacoes}
                  label="Publicações"
                />
              </View>
              <View style={styles.cardsRow}>
                <Card
                  icon="flag"
                  cor="#FF3B30"
                  valor={stats.denuncias}
                  label="Denúncias"
                  destaque={stats.denunciasPendentes > 0}
                  subtexto={
                    stats.denunciasPendentes > 0
                      ? `${stats.denunciasPendentes} pendentes`
                      : undefined
                  }
                />
                <Card
                  icon="heart"
                  cor="#FF2D55"
                  valor={stats.likes}
                  label="Likes"
                />
              </View>

              <Text style={styles.sectionTitle}>Denúncias por motivo</Text>
              <View style={styles.motivosLista}>
                {(Object.keys(motivos) as (keyof DenunciasPorMotivo)[]).map(
                  (motivo) => {
                    const valor = motivos[motivo];
                    const percentagem = (valor / maxMotivo) * 100;
                    return (
                      <View key={motivo} style={styles.motivoRow}>
                        <Text style={styles.motivoLabel}>
                          {MOTIVOS_EMOJI[motivo]} {MOTIVOS_LABEL[motivo]}
                        </Text>
                        <View style={styles.barraWrapper}>
                          <View
                            style={[
                              styles.barra,
                              {
                                width: `${percentagem}%`,
                                backgroundColor:
                                  valor > 0 ? '#FF3B30' : '#f0f0f0',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.motivoValor}>{valor}</Text>
                      </View>
                    );
                  }
                )}
              </View>
            </View>
          )}

          {/* ====== DENÚNCIAS ====== */}
          {abaAtiva === 'denuncias' && (
            <View>
              {/* Filtros */}
              <View style={styles.filtros}>
                {(
                  [
                    { v: 'pendente', label: 'Pendentes' },
                    { v: 'resolvido', label: 'Resolvidas' },
                    { v: 'ignorado', label: 'Ignoradas' },
                    { v: 'todas', label: 'Todas' },
                  ] as { v: FiltroDenuncias; label: string }[]
                ).map((f) => (
                  <TouchableOpacity
                    key={f.v}
                    style={[
                      styles.filtroBtn,
                      filtro === f.v && styles.filtroBtnActive,
                    ]}
                    onPress={() => setFiltro(f.v)}
                  >
                    <Text
                      style={[
                        styles.filtroText,
                        filtro === f.v && styles.filtroTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {denuncias.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>Sem denúncias</Text>
                  <Text style={styles.emptySub}>
                    Nada para moderar nesta categoria.
                  </Text>
                </View>
              ) : (
                denuncias.map((r) => (
                  <View key={r.id} style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportMotivo}>
                        {MOTIVOS_EMOJI[r.motivo] || '❓'}{' '}
                        {MOTIVOS_LABEL[r.motivo as keyof DenunciasPorMotivo] ||
                          r.motivo}
                      </Text>
                      <View
                        style={[
                          styles.estadoBadge,
                          {
                            backgroundColor:
                              r.estado === 'pendente'
                                ? '#FFF3CD'
                                : r.estado === 'resolvido'
                                ? '#D4EDDA'
                                : '#E2E3E5',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.estadoText,
                            {
                              color:
                                r.estado === 'pendente'
                                  ? '#856404'
                                  : r.estado === 'resolvido'
                                  ? '#155724'
                                  : '#383D41',
                            },
                          ]}
                        >
                          {r.estado.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.reportMeta}>
                      <Text style={styles.bold}>Por:</Text> {r.autorNome} ·{' '}
                      {formatarTempo(r.criadoEm)}
                    </Text>

                    <Text style={styles.reportMeta}>
                      <Text style={styles.bold}>Tipo:</Text>{' '}
                      {r.tipo === 'post'
                        ? 'Publicação'
                        : r.tipo === 'comentario'
                        ? 'Comentário'
                        : 'Resposta'}
                    </Text>

                    <View style={styles.reportContent}>
                      <Text style={styles.reportContentLabel}>
                        Conteúdo denunciado:
                      </Text>
                      <Text style={styles.reportContentText} numberOfLines={4}>
                        {r.conteudoDenunciado || '[sem texto]'}
                      </Text>
                    </View>

                    {r.descricao ? (
                      <View style={styles.reportContent}>
                        <Text style={styles.reportContentLabel}>
                          Descrição do denunciante:
                        </Text>
                        <Text style={styles.reportContentText}>
                          {r.descricao}
                        </Text>
                      </View>
                    ) : null}

                    {r.estado === 'pendente' && (
                      <View style={styles.reportActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionVer]}
                          onPress={() => handleVerPost(r)}
                        >
                          <Ionicons name="eye-outline" size={16} color="#fff" />
                          <Text style={styles.actionText}>Ver</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionIgnorar]}
                          onPress={() => handleIgnorar(r)}
                        >
                          <Ionicons
                            name="close-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.actionText}>Ignorar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionRemover]}
                          onPress={() => handleRemover(r)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.actionText}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* ====== UTILIZADORES ====== */}
          {abaAtiva === 'utilizadores' && (
            <View style={styles.placeholder}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.placeholderText}>Utilizadores</Text>
              <Text style={styles.placeholderSub}>
                A construir na Parte 4
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
}

function Card({
  icon,
  cor,
  valor,
  label,
  destaque,
  subtexto,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  cor: string;
  valor: number;
  label: string;
  destaque?: boolean;
  subtexto?: string;
}) {
  return (
    <View
      style={[
        styles.card,
        destaque && { borderColor: '#FF3B30', borderWidth: 2 },
      ]}
    >
      <View style={[styles.cardIconCircle, { backgroundColor: cor + '20' }]}>
        <Ionicons name={icon} size={22} color={cor} />
      </View>
      <Text style={styles.cardValor}>{valor}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      {subtexto && (
        <Text style={[styles.cardSub, { color: cor }]}>{subtexto}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 12, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  tabIconWrapper: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  content: { padding: 20, gap: 8 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 16,
    alignItems: 'center',
    gap: 6,
    minHeight: 130,
    justifyContent: 'center',
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardValor: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  cardLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  cardSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  motivosLista: { gap: 12 },
  motivoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  motivoLabel: {
    width: 120,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  barraWrapper: {
    flex: 1,
    height: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barra: { height: '100%', borderRadius: 10 },
  motivoValor: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filtroBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filtroBtnActive: { backgroundColor: '#007AFF' },
  filtroText: { fontSize: 13, color: '#333', fontWeight: '500' },
  filtroTextActive: { color: '#fff' },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySub: { fontSize: 14, color: '#999' },
  reportCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportMotivo: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  estadoText: { fontSize: 10, fontWeight: '700' },
  reportMeta: { fontSize: 13, color: '#666' },
  bold: { fontWeight: '700', color: '#333' },
  reportContent: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  reportContentLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  reportContentText: { fontSize: 14, color: '#333', lineHeight: 20 },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionVer: { backgroundColor: '#007AFF' },
  actionIgnorar: { backgroundColor: '#999' },
  actionRemover: { backgroundColor: '#FF3B30' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  placeholder: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#333' },
  placeholderSub: { fontSize: 14, color: '#999' },
});