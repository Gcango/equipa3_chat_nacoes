import { ReactNode } from 'react';
import {
    Platform,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

interface Props {
  children: ReactNode;
  backgroundColor?: string;
}

const DESKTOP_BREAKPOINT = 768;

/**
 * Container que adapta o conteúdo:
 * - No mobile: ocupa 100% da largura
 * - No browser/desktop: largura máxima de 600px, centrado
 *   (a sidebar é renderizada pelo layout das tabs)
 */
export function ScreenContainer({
  children,
  backgroundColor = '#fff',
}: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { backgroundColor }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#f0f2f5' : '#fff',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : undefined,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
});