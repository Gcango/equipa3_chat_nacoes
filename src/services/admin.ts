import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Promove o utilizador atual como o PRIMEIRO admin do sistema.
 * Só funciona se ainda não existir nenhum admin.
 */
export async function promoverPrimeiroAdmin(): Promise<string> {
  const fn = httpsCallable(functions, 'promoverPrimeiroAdmin');
  const result = await fn();
  const data = result.data as { success: boolean; message: string };
  return data.message;
}

/**
 * Promove ou muda o role de outro utilizador (só admin).
 */
export async function promoverUtilizador(
  targetUid: string,
  novoRole: 'aluno' | 'professor' | 'admin'
): Promise<string> {
  const fn = httpsCallable(functions, 'promoverUtilizador');
  const result = await fn({ targetUid, novoRole });
  const data = result.data as { success: boolean; message: string };
  return data.message;
}

/**
 * Bane ou desbane um utilizador (só admin).
 */
export async function banirUtilizador(
  targetUid: string,
  banir: boolean
): Promise<void> {
  const fn = httpsCallable(functions, 'banirUtilizador');
  await fn({ targetUid, banir });
}