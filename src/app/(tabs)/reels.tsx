import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';

export default function ReelsScreen() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Ionicons name="videocam-outline" size={64} color="#ccc" />
        <Text style={styles.title}>Reels</Text>
        <Text style={styles.subtitle}>
          Vídeos curtos da comunidade chegam em breve
        </Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});