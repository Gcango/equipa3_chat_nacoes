import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FollowButton } from '../../components/FollowButton';
import {
  escutarSeguidores,
  escutarSeguindo,
  FollowUser,
} from '../../services/follows';

const COR = {
  fundo: '#F7F8FA',
  card: '#FFFFFF',
  textoPrincipal: '#111827',
  textoMedio: '#6B7280',
  textoClaro: '#9CA3AF',
  borda: '#E5E7EB',
  divisoria: '#F3F4F6',
  acento: '#2563EB',
};

const ROLE_COR: Record<string, string> = {
  aluno: '#2563EB',
  professor: '#059669',
  admin: '#7C3AED',
};

type Tipo = 'seguidores' | 'aSeguir';

export default function FollowsScreen() {
  const router = useRouter();
  const { userId, tipo } = useLocalSearchParams<{
    userId: string;
    tipo?: string;
  }>();

  const tipoAtivo: Tipo = tipo === 'aSeguir' ? 'aSeguir' : 'seguidores';
  const [utilizadores, setUtilizadores] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    let unsub: (() => void) | undefined;

    if (tipoAtivo === 'seguidores') {
      unsub = escutarSeguidores(userId, (lista) => {
        setUtilizadores(lista);
        setLoading(false);
      });
    } else {
      unsub = escutarSeguindo(userId, (lista) => {
        setUtilizadores(lista);
        setLoading(false);
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [userId, tipoAtivo]);

  const contador = utilizadores.length;
  const titulo = tipoAtivo === 'seguidores' ? 'Seguidores' : 'A seguir';
  const subtitulo =
    tipoAtivo === 'seguidores'
      ? `${contador} ${contador === 1 ? 'seguidor' : 'seguidores'}`
      : `${contador} ${contador === 1 ? 'conta seguida' : 'contas seguidas'}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COR.textoPrincipal} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{titulo}</Text>
          <Text style={styles.headerSub}>{subtitulo}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COR.acento} />
        </View>
      ) : utilizadores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name={
                tipoAtivo === 'seguidores'
                  ? 'people-outline'
                  : 'person-add-outline'
              }
              size={36}
              color={COR.textoClaro}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {tipoAtivo === 'seguidores'
              ? 'Sem seguidores'
              : 'Ainda não segue ninguém'}
          </Text>
          <Text style={styles.emptySub}>
            {tipoAtivo === 'seguidores'
              ? 'Quando alguém te seguir, aparece aqui.'
              : 'Quando começar a seguir alguém, aparece aqui.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {utilizadores.map((u, index) => {
            const roleCor = ROLE_COR[u.role] || COR.textoMedio;
            const isUltimo = index === utilizadores.length - 1;

            return (
              <View key={u.uid}>
                <View style={styles.item}>
                  <TouchableOpacity
                    style={styles.itemLeft}
                    onPress={() => router.push(`/user/${u.uid}` as any)}
                    activeOpacity={0.7}
                  >
                    {u.fotoURL ? (
                      <Image source={{ uri: u.fotoURL }} style={styles.avatar} />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarFallback,
                          { backgroundColor: roleCor },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {u.nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.info}>
                      <Text style={styles.nome} numberOfLines={1}>
                        {u.nome}
                      </Text>
                      <Text style={styles.email} numberOfLines={1}>
                        {u.email}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.itemRight}>
                    <FollowButton userId={u.uid} compact />
                  </View>
                </View>

                {!isUltimo && <View style={styles.divisoria} />}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COR.card,
    borderBottomWidth: 1,
    borderBottomColor: COR.divisoria,
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COR.textoPrincipal,
  },
  headerSub: {
    fontSize: 12,
    color: COR.textoMedio,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    maxWidth: 300,
  },
  lista: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemRight: {
    minWidth: 100,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COR.divisoria,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontSize: 14,
    fontWeight: '600',
    color: COR.textoPrincipal,
  },
  email: {
    fontSize: 12,
    color: COR.textoMedio,
  },
  divisoria: {
    height: 1,
    backgroundColor: COR.divisoria,
    marginLeft: 72,
  },
});