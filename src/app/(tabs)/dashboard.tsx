import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  DenunciasPorMotivo,
  escutarDenunciasPorMotivo,
  escutarEstatisticas,
  Estatisticas,
} from '../../services/admin';
import { auth } from '../../services/firebase';
import { getUserProfile } from '../../services/users';

type Aba = 'visao' | 'denuncias' | 'utilizadores';

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

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('visao');

  const [stats, setStats] = useState<Estatisticas>(VAZIO);
  const [motivos, setMotivos] = useState<DenunciasPorMotivo>(MOTIVOS_VAZIO);

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

  // Escutar estatísticas quando autorizado
  useEffect(() => {
    if (!autorizado) return;

    const unsub1 = escutarEstatisticas(setStats);
    const unsub2 = escutarDenunciasPorMotivo(setMotivos);

    return () => {
      unsub1();
      unsub2();
    };
  }, [autorizado]);

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

  const maxMotivo = Math.max(
    1,
    ...Object.values(motivos)
  );

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
            <Ionicons
              name="flag-outline"
              size={20}
              color={abaAtiva === 'denuncias' ? '#007AFF' : '#999'}
            />
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
          {abaAtiva === 'visao' && (
            <View>
              {/* Cards principais */}
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
                  icon="chatbubble"
                  cor="#FF9500"
                  valor={stats.comentarios}
                  label="Comentários"
                />
              </View>

              <View style={styles.cardsRow}>
                <Card
                  icon="heart"
                  cor="#FF2D55"
                  valor={stats.likes}
                  label="Likes"
                />
                <View style={styles.cardPlaceholder} />
              </View>

              {/* Denúncias por motivo */}
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

          {abaAtiva === 'denuncias' && (
            <View style={styles.placeholder}>
              <Ionicons name="flag-outline" size={64} color="#ccc" />
              <Text style={styles.placeholderText}>Denúncias</Text>
              <Text style={styles.placeholderSub}>
                A construir na Parte 3
              </Text>
            </View>
          )}

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
  content: { padding: 20, gap: 16 },
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
  cardPlaceholder: { flex: 1 },
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
    width: 100,
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
  placeholder: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#333' },
  placeholderSub: { fontSize: 14, color: '#999' },
});