import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Apaga um post ou reel (só o autor).
 * A Cloud Function garante eliminação atómica:
 *  - Notificações relacionadas
 *   - Comentários (se for post)
 *   - Ficheiros do Storage
 *   - Documento principal
 */
export async function apagarConteudo(
  tipo: 'post' | 'reel',
  conteudoId: string
): Promise<{
  notificacoes: number;
  comentarios: number;
  ficheiros: number;
}> {
  const fn = httpsCallable(functions, 'apagarConteudo');
  const result = await fn({ tipo, conteudoId });
  const data = result.data as {
    success: boolean;
    eliminados: {
      notificacoes: number;
      comentarios: number;
      ficheiros: number;
    };
  };
  return data.eliminados;
}