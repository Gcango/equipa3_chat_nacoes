import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BanirModal } from '../../components/BanirModal';
import { PromoteModal } from '../../components/PromoteModal';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  atualizarEstadoDenuncia,
  banirUtilizador,
  DenunciasPorMotivo,
  escutarDenuncias,
  escutarDenunciasPorMotivo,
  escutarEstatisticas,
  escutarUtilizadores,
  Estatisticas,
  FiltroUtilizadores,
  removerConteudo,
  Report,
  UtilizadorAdmin,
} from '../../services/admin';
import { auth } from '../../services/firebase';
import { getUserProfile } from '../../services/users';

type Aba = 'visao' | 'denuncias' | 'utilizadores';
type FiltroDenuncias = 'pendente' | 'resolvido' | 'ignorado' | 'todas';

// ============================================================
// CORES
// ============================================================
const COR = {
  fundo: '#F7F8FA',
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',

  acento: '#2563EB',
  acentoClaro: '#EFF6FF',

  perigo: '#DC2626',
  perigoClaro: '#FEF2F2',
  sucesso: '#059669',
  sucessoClaro: '#ECFDF5',
  aviso: '#D97706',
  avisoClaro: '#FFFBEB',
  roxo: '#7C3AED',
  roxoClaro: '#F5F3FF',
  neutro: '#6B7280',
  neutroClaro: '#F3F4F6',
};

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
  conteudo_inapropriado: 'Conteúdo inapropriado',
  violencia: 'Violência',
  outro: 'Outro',
};

const ROLE_COR: Record<string, string> = {
  aluno: '#2563EB',
  professor: '#059669',
  admin: '#7C3AED',
};

const ROLE_LABEL: Record<string, string> = {
  aluno: 'ALUNO',
  professor: 'PROFESSOR',
  admin: 'ADMIN',
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

function labelTipo(tipo: string): string {
  if (tipo === 'post') return 'Publicação';
  if (tipo === 'comentario') return 'Comentário';
  if (tipo === 'resposta') return 'Resposta';
  return tipo;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('visao');

  // Estatísticas + motivos
  const [stats, setStats] = useState<Estatisticas>(VAZIO);
  const [motivos, setMotivos] = useState<DenunciasPorMotivo>(MOTIVOS_VAZIO);

  // Denúncias
  const [filtro, setFiltro] = useState<FiltroDenuncias>('pendente');
  const [denuncias, setDenuncias] = useState<Report[]>([]);

  // Utilizadores
  const [filtroUsers, setFiltroUsers] = useState<FiltroUtilizadores>('todos');
  const [utilizadores, setUtilizadores] = useState<UtilizadorAdmin[]>([]);

  // Modais
  const [promoverUser, setPromoverUser] = useState<UtilizadorAdmin | null>(null);
  const [banirUser, setBanirUser] = useState<UtilizadorAdmin | null>(null);

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

  useEffect(() => {
    if (!autorizado) return;
    const unsub = escutarUtilizadores(filtroUsers, setUtilizadores);
    return () => unsub();
  }, [autorizado, filtroUsers]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      </ScreenContainer>
    );
  }

  if (!autorizado) return null;

  const meuUid = auth.currentUser?.uid;
  const maxMotivo = Math.max(1, ...Object.values(motivos));

  // ============ AÇÕES DENÚNCIAS ============
  async function handleIgnorar(r: Report) {
    const executar = async () => {
      try {
        await atualizarEstadoDenuncia(r.id, 'ignorado');
      } catch (e) {
        console.error(e);
        if (Platform.OS === 'web') window.alert('Erro ao ignorar.');
        else Alert.alert('Erro', 'Não foi possível ignorar.');
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

    const msg =
      'Vais apagar este conteúdo permanentemente. Esta ação não pode ser desfeita. Continuar?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executar();
    } else {
      Alert.alert('Remover conteúdo', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: executar },
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

  // ============ AÇÕES UTILIZADORES ============
  async function handleDesbanir(u: UtilizadorAdmin) {
    const executar = async () => {
      try {
        await banirUtilizador(u.uid, false);
      } catch (e) {
        console.error(e);
        if (Platform.OS === 'web') window.alert('Erro ao desbanir.');
        else Alert.alert('Erro', 'Não foi possível desbanir.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Desbanir este utilizador?')) executar();
    } else {
      Alert.alert('Desbanir', 'Confirmas?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desbanir', onPress: executar },
      ]);
    }
  }

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Painel de Administração</Text>
            <Text style={styles.headerSub}>Gestão da comunidade escolar</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COR.acento} />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TabBtn
            label="Visão geral"
            icon="stats-chart-outline"
            active={abaAtiva === 'visao'}
            onPress={() => setAbaAtiva('visao')}
          />
          <TabBtn
            label="Denúncias"
            icon="flag-outline"
            active={abaAtiva === 'denuncias'}
            onPress={() => setAbaAtiva('denuncias')}
            badge={stats.denunciasPendentes}
          />
          <TabBtn
            label="Utilizadores"
            icon="people-outline"
            active={abaAtiva === 'utilizadores'}
            onPress={() => setAbaAtiva('utilizadores')}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* ====== VISÃO GERAL ====== */}
          {abaAtiva === 'visao' && (
            <View>
              <View style={styles.cardsRow}>
                <StatCard
                  icon="people-outline"
                  label="Utilizadores"
                  valor={stats.utilizadores}
                  sub="contas registadas"
                />
                <StatCard
                  icon="document-text-outline"
                  label="Publicações"
                  valor={stats.publicacoes}
                  sub="no total"
                />
              </View>
              <View style={styles.cardsRow}>
                <StatCard
                  icon="flag-outline"
                  label="Denúncias"
                  valor={stats.denuncias}
                  sub={
                    stats.denunciasPendentes > 0
                      ? `${stats.denunciasPendentes} pendentes`
                      : 'sem pendentes'
                  }
                  destaque={stats.denunciasPendentes > 0}
                />
                <StatCard
                  icon="heart-outline"
                  label="Likes"
                  valor={stats.likes}
                  sub="no total"
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
                          {MOTIVOS_LABEL[motivo]}
                        </Text>
                        <View style={styles.barraWrapper}>
                          <View
                            style={[
                              styles.barra,
                              {
                                width: `${percentagem}%`,
                                backgroundColor:
                                  valor > 0 ? COR.perigo : COR.divisoria,
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
                    activeOpacity={0.7}
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
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="checkmark-done-outline"
                      size={36}
                      color={COR.sucesso}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Sem denúncias</Text>
                  <Text style={styles.emptySub}>
                    Nada para moderar nesta categoria.
                  </Text>
                </View>
              ) : (
                denuncias.map((r) => {
                  const corEstado =
                    r.estado === 'pendente'
                      ? COR.aviso
                      : r.estado === 'resolvido'
                      ? COR.sucesso
                      : COR.neutro;

                  const labelEstado =
                    r.estado === 'pendente'
                      ? 'PENDENTE'
                      : r.estado === 'resolvido'
                      ? 'RESOLVIDO'
                      : 'IGNORADO';

                  return (
                    <View
                      key={r.id}
                      style={[styles.reportCard, { borderLeftColor: corEstado }]}
                    >
                      <View style={styles.reportHeader}>
                        <Text style={styles.reportMotivo}>
                          {MOTIVOS_LABEL[
                            r.motivo as keyof DenunciasPorMotivo
                          ] || r.motivo}
                        </Text>
                        <View style={styles.estadoWrapper}>
                          <View
                            style={[
                              styles.estadoDot,
                              { backgroundColor: corEstado },
                            ]}
                          />
                          <Text
                            style={[styles.estadoLabel, { color: corEstado }]}
                          >
                            {labelEstado}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.reportMetaRow}>
                        <Text style={styles.reportMetaLabel}>Denunciado por</Text>
                        <Text style={styles.reportMetaValue}>
                          {r.autorNome}
                        </Text>
                      </View>
                      <View style={styles.reportMetaRow}>
                        <Text style={styles.reportMetaLabel}>Há</Text>
                        <Text style={styles.reportMetaValue}>
                          {formatarTempo(r.criadoEm).replace('há ', '')}
                        </Text>
                      </View>
                      <View style={styles.reportMetaRow}>
                        <Text style={styles.reportMetaLabel}>Tipo</Text>
                        <Text style={styles.reportMetaValue}>
                          {labelTipo(r.tipo)}
                        </Text>
                      </View>

                      <View style={styles.bloco}>
                        <Text style={styles.blocoLabel}>
                          CONTEÚDO DENUNCIADO
                        </Text>
                        <Text style={styles.blocoText} numberOfLines={4}>
                          {r.conteudoDenunciado || '—'}
                        </Text>
                      </View>

                      {r.descricao ? (
                        <View style={styles.bloco}>
                          <Text style={styles.blocoLabel}>
                            DESCRIÇÃO DO DENUNCIANTE
                          </Text>
                          <Text style={styles.blocoText}>{r.descricao}</Text>
                        </View>
                      ) : null}

                      {r.estado === 'pendente' && (
                        <View style={styles.reportActions}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionVer]}
                            onPress={() => handleVerPost(r)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="eye-outline"
                              size={16}
                              color={COR.acento}
                            />
                            <Text
                              style={[styles.actionText, { color: COR.acento }]}
                            >
                              Ver
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionIgnorar]}
                            onPress={() => handleIgnorar(r)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="close-outline"
                              size={16}
                              color={COR.textoMedio}
                            />
                            <Text
                              style={[
                                styles.actionText,
                                { color: COR.textoMedio },
                              ]}
                            >
                              Ignorar
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionRemover]}
                            onPress={() => handleRemover(r)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#fff"
                            />
                            <Text style={[styles.actionText, { color: '#fff' }]}>
                              Remover
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ====== UTILIZADORES ====== */}
          {abaAtiva === 'utilizadores' && (
            <View>
              {/* Filtros */}
              <View style={styles.filtros}>
                {(
                  [
                    { v: 'todos', label: 'Todos' },
                    { v: 'aluno', label: 'Alunos' },
                    { v: 'professor', label: 'Professores' },
                    { v: 'admin', label: 'Admins' },
                    { v: 'banido', label: 'Banidos' },
                  ] as { v: FiltroUtilizadores; label: string }[]
                ).map((f) => (
                  <TouchableOpacity
                    key={f.v}
                    style={[
                      styles.filtroBtn,
                      filtroUsers === f.v && styles.filtroBtnActive,
                    ]}
                    onPress={() => setFiltroUsers(f.v)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filtroText,
                        filtroUsers === f.v && styles.filtroTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {utilizadores.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name="people-outline"
                      size={36}
                      color={COR.textoClaro}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Sem utilizadores</Text>
                  <Text style={styles.emptySub}>
                    Nenhum utilizador nesta categoria.
                  </Text>
                </View>
              ) : (
                utilizadores.map((u) => {
                  const souEu = u.uid === meuUid;
                  const roleCor = ROLE_COR[u.role] || COR.neutro;
                  const roleLabel = ROLE_LABEL[u.role] || u.role;
                  const nomeExibir = u.nome || u.email.split('@')[0];

                  return (
                    <View
                      key={u.uid}
                      style={[
                        styles.userCard,
                        u.banido && { borderLeftColor: COR.perigo },
                        !u.banido && { borderLeftColor: roleCor },
                      ]}
                    >
                      {/* Header do user */}
                      <View style={styles.userHeader}>
                        {u.fotoURL ? (
                          <Image
                            source={{ uri: u.fotoURL }}
                            style={styles.userAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.userAvatar,
                              styles.userAvatarFallback,
                              { backgroundColor: roleCor },
                            ]}
                          >
                            <Text style={styles.userAvatarText}>
                              {nomeExibir.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.userInfo}>
                          <View style={styles.userNameRow}>
                            <Text style={styles.userName} numberOfLines={1}>
                              {nomeExibir}
                            </Text>
                            {souEu && (
                              <View style={styles.souEuBadge}>
                                <Text style={styles.souEuText}>VOCÊ</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.userEmail} numberOfLines={1}>
                            {u.email}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.roleBadge,
                            u.banido
                              ? {
                                  backgroundColor: COR.perigoClaro,
                                  borderColor: COR.perigo + '40',
                                }
                              : {
                                  backgroundColor: roleCor + '15',
                                  borderColor: roleCor + '40',
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: u.banido ? COR.perigo : roleCor },
                            ]}
                          >
                            {u.banido ? 'BANIDO' : roleLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Meta */}
                      <View style={styles.userMeta}>
                        <Text style={styles.userMetaText}>
                          Registado {formatarTempo(u.criadoEm)}
                        </Text>
                      </View>

                      {/* Ações (só se não for eu) */}
                      {!souEu && (
                        <View style={styles.userActions}>
                          {!u.banido && (
                            <TouchableOpacity
                              style={[styles.userBtn, styles.userBtnPromover]}
                              onPress={() => setPromoverUser(u)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name="shield-outline"
                                size={16}
                                color={COR.acento}
                              />
                              <Text
                                style={[
                                  styles.userBtnText,
                                  { color: COR.acento },
                                ]}
                              >
                                Promover
                              </Text>
                            </TouchableOpacity>
                          )}

                          {u.banido ? (
                            <TouchableOpacity
                              style={[styles.userBtn, styles.userBtnDesbanir]}
                              onPress={() => handleDesbanir(u)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name="checkmark-outline"
                                size={16}
                                color={COR.sucesso}
                              />
                              <Text
                                style={[
                                  styles.userBtnText,
                                  { color: COR.sucesso },
                                ]}
                              >
                                Desbanir
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={[styles.userBtn, styles.userBtnBanir]}
                              onPress={() => setBanirUser(u)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name="ban-outline"
                                size={16}
                                color={COR.perigo}
                              />
                              <Text
                                style={[
                                  styles.userBtnText,
                                  { color: COR.perigo },
                                ]}
                              >
                                Banir
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Modais */}
        <PromoteModal
          visivel={!!promoverUser}
          fechar={() => setPromoverUser(null)}
          user={
            promoverUser
              ? {
                  uid: promoverUser.uid,
                  nome: promoverUser.nome,
                  email: promoverUser.email,
                  role: promoverUser.role,
                }
              : null
          }
        />

        <BanirModal
          visivel={!!banirUser}
          fechar={() => setBanirUser(null)}
          user={
            banirUser
              ? {
                  uid: banirUser.uid,
                  nome: banirUser.nome,
                  email: banirUser.email,
                }
              : null
          }
        />
      </SafeAreaView>
    </ScreenContainer>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function TabBtn({
  label,
  icon,
  active,
  onPress,
  badge,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tabIconWrapper}>
        <Ionicons
          name={icon}
          size={20}
          color={active ? COR.acento : COR.textoMedio}
        />
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatCard({
  icon,
  label,
  valor,
  sub,
  destaque,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  valor: number;
  sub: string;
  destaque?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        destaque && { borderColor: COR.perigo, borderWidth: 1.5 },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{label.toUpperCase()}</Text>
        <Ionicons
          name={icon}
          size={18}
          color={destaque ? COR.perigo : COR.textoClaro}
        />
      </View>
      <Text style={styles.cardValor}>{valor}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  );
}
// ============================================================
// ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR.fundo,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COR.fundo,
  },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COR.card,
    borderBottomWidth: 1,
    borderBottomColor: COR.borda,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COR.textoPrincipal,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: COR.textoMedio,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COR.acentoClaro,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COR.acento + '30',
  },
  adminBadgeText: {
    color: COR.acento,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // ============ ABAS ============
  tabs: {
    flexDirection: 'row',
    backgroundColor: COR.card,
    borderBottomWidth: 1,
    borderBottomColor: COR.borda,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COR.acento,
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COR.textoMedio,
  },
  tabTextActive: {
    color: COR.acento,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COR.perigo,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COR.card,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // ============ CONTEÚDO ============
  content: {
    padding: 24,
    gap: 12,
  },

  // ============ CARDS DE ESTATÍSTICAS ============
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COR.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COR.borda,
    padding: 20,
    gap: 6,
    minHeight: 130,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COR.textoMedio,
    letterSpacing: 0.8,
  },
  cardValor: {
    fontSize: 32,
    fontWeight: '700',
    color: COR.textoPrincipal,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  cardSub: {
    fontSize: 12,
    color: COR.textoMedio,
  },

  // ============ SECÇÃO ============
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COR.textoPrincipal,
    marginTop: 12,
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  // ============ MOTIVOS ============
  motivosLista: {
    gap: 14,
  },
  motivoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  motivoLabel: {
    width: 160,
    fontSize: 13,
    color: COR.textoPrincipal,
    fontWeight: '500',
  },
  barraWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: COR.divisoria,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: 4,
  },
  motivoValor: {
    width: 32,
    fontSize: 14,
    fontWeight: '700',
    color: COR.textoPrincipal,
    textAlign: 'right',
  },

  // ============ FILTROS ============
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filtroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: COR.card,
    borderWidth: 1,
    borderColor: COR.borda,
  },
  filtroBtnActive: {
    backgroundColor: COR.acento,
    borderColor: COR.acento,
  },
  filtroText: {
    fontSize: 13,
    color: COR.textoMedio,
    fontWeight: '600',
  },
  filtroTextActive: {
    color: '#fff',
  },

  // ============ ESTADO VAZIO ============
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COR.divisoria,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  emptySub: {
    fontSize: 13,
    color: COR.textoMedio,
    textAlign: 'center',
    maxWidth: 320,
  },

  // ============ CARDS DE DENÚNCIA ============
  reportCard: {
    backgroundColor: COR.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COR.borda,
    borderLeftWidth: 4,
    padding: 20,
    marginBottom: 12,
    gap: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }),
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  reportMotivo: {
    fontSize: 15,
    fontWeight: '700',
    color: COR.textoPrincipal,
    letterSpacing: -0.2,
  },
  estadoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportMetaLabel: {
    fontSize: 12,
    color: COR.textoClaro,
    width: 110,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  reportMetaValue: {
    fontSize: 13,
    color: COR.textoPrincipal,
    fontWeight: '500',
    flex: 1,
  },
  bloco: {
    backgroundColor: COR.divisoria,
    borderRadius: 8,
    padding: 14,
    marginTop: 4,
    gap: 6,
  },
  blocoLabel: {
    fontSize: 10,
    color: COR.textoClaro,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  blocoText: {
    fontSize: 14,
    color: COR.textoPrincipal,
    lineHeight: 20,
  },
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
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionVer: {
    backgroundColor: COR.acentoClaro,
    borderColor: COR.acento + '30',
  },
  actionIgnorar: {
    backgroundColor: COR.neutroClaro,
    borderColor: COR.borda,
  },
  actionRemover: {
    backgroundColor: COR.perigo,
    borderColor: COR.perigo,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ============ CARDS DE UTILIZADOR ============
  userCard: {
    backgroundColor: COR.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COR.borda,
    borderLeftWidth: 4,
    padding: 18,
    marginBottom: 10,
    gap: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }),
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COR.divisoria,
  },
  userAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COR.textoPrincipal,
    flexShrink: 1,
  },
  souEuBadge: {
    backgroundColor: COR.acentoClaro,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COR.acento + '30',
  },
  souEuText: {
    fontSize: 9,
    fontWeight: '700',
    color: COR.acento,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 12,
    color: COR.textoMedio,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userMeta: {
    paddingTop: 4,
  },
  userMetaText: {
    fontSize: 12,
    color: COR.textoClaro,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COR.divisoria,
  },
  userBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  userBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  userBtnPromover: {
    backgroundColor: COR.acentoClaro,
    borderColor: COR.acento + '30',
  },
  userBtnBanir: {
    backgroundColor: COR.perigoClaro,
    borderColor: COR.perigo + '30',
  },
  userBtnDesbanir: {
    backgroundColor: COR.sucessoClaro,
    borderColor: COR.sucesso + '30',
  },

  // ============ PLACEHOLDER ============
  placeholder: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
});