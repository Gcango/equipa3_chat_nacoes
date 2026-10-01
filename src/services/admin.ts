import {
  collection,
  getCountFromServer,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

// ============================================================
// CLOUD FUNCTIONS
// ============================================================

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
 * Se banir === true, apaga posts/comentários/follows.
 */
export async function banirUtilizador(
  targetUid: string,
  banir: boolean
): Promise<void> {
  const fn = httpsCallable(functions, 'banirUtilizador');
  await fn({ targetUid, banir });
}

// ============================================================
// ESTATÍSTICAS — Visão Geral
// ============================================================

export interface Estatisticas {
  utilizadores: number;
  publicacoes: number;
  denuncias: number;
  denunciasPendentes: number;
  comentarios: number;
  likes: number;
}

export interface DenunciasPorMotivo {
  spam: number;
  assedio: number;
  conteudo_inapropriado: number;
  violencia: number;
  outro: number;
}

/**
 * Escuta contagens em tempo real (users, posts, reports, likes, comentários).
 */
export function escutarEstatisticas(
  callback: (stats: Estatisticas) => void
): () => void {
  const usersRef = collection(db, 'users');
  const postsRef = collection(db, 'posts');
  const reportsRef = collection(db, 'reports');
  const reportsPendentesQuery = query(
    reportsRef,
    where('estado', '==', 'pendente')
  );

  let utilizadores = 0;
  let publicacoes = 0;
  let denuncias = 0;
  let denunciasPendentes = 0;
  let comentarios = 0;
  let likes = 0;

  function emitir() {
    callback({
      utilizadores,
      publicacoes,
      denuncias,
      denunciasPendentes,
      comentarios,
      likes,
    });
  }

  // Contagens (rápidas, do lado do servidor)
  async function atualizarContagens() {
    try {
      const [u, p, r, rp] = await Promise.all([
        getCountFromServer(usersRef),
        getCountFromServer(postsRef),
        getCountFromServer(reportsRef),
        getCountFromServer(reportsPendentesQuery),
      ]);
      utilizadores = u.data().count;
      publicacoes = p.data().count;
      denuncias = r.data().count;
      denunciasPendentes = rp.data().count;
      emitir();
    } catch (e) {
      console.error('Erro ao contar estatísticas:', e);
    }
  }

  atualizarContagens();
  const interval = setInterval(atualizarContagens, 30000);

  // Likes + comentários: escutar posts e agregar
  const unsubPosts = onSnapshot(postsRef, (snap) => {
    let totalLikes = 0;
    snap.docs.forEach((doc) => {
      const data = doc.data();
      totalLikes += data.curtidas?.length || 0;
    });
    likes = totalLikes;
    publicacoes = snap.size;
    emitir();
  });

  return () => {
    clearInterval(interval);
    unsubPosts();
  };
}

/**
 * Conta denúncias agrupadas por motivo.
 */
export function escutarDenunciasPorMotivo(
  callback: (stats: DenunciasPorMotivo) => void
): () => void {
  const reportsRef = collection(db, 'reports');

  return onSnapshot(reportsRef, (snap) => {
    const contagem: DenunciasPorMotivo = {
      spam: 0,
      assedio: 0,
      conteudo_inapropriado: 0,
      violencia: 0,
      outro: 0,
    };

    snap.docs.forEach((doc) => {
      const motivo = doc.data().motivo;
      if (motivo && motivo in contagem) {
        contagem[motivo as keyof DenunciasPorMotivo]++;
      }
    });

    callback(contagem);
  });
}