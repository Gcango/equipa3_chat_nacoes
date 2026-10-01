import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FollowsScreen() {
  const router = useRouter();
  const { userId, tipo } = useLocalSearchParams<{
    userId: string;
    tipo?: string;
  }>();

  const titulo = tipo === 'aSeguir' ? 'A seguir' : 'Seguidores';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{titulo}</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Em breve</Text>
        <Text style={styles.emptySub}>
          Lista de {titulo.toLowerCase()} será implementada na próxima fase.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySub: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
});