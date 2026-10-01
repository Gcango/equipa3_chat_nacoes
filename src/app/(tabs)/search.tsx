import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';

export default function SearchScreen() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Ionicons name="search-outline" size={64} color="#ccc" />
        <Text style={styles.title}>Pesquisa</Text>
        <Text style={styles.subtitle}>Em breve</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666' },
});