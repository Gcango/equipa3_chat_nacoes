import {
  collection,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

// ============================================================
// CLOUD FUNCTIONS
// ============================================================

export async function promoverPrimeiroAdmin(): Promise<string> {
  const fn = httpsCallable(functions, 'promoverPrimeiroAdmin');
  const result = await fn();
  const data = result.data as { success: boolean; message: string };
  return data.message;
}

export async function promoverUtilizador(
  targetUid: string,
  novoRole: 'aluno' | 'professor' | 'admin'
): Promise<string> {
  const fn = httpsCallable(functions, 'promoverUtilizador');
  const result = await fn({ targetUid, novoRole });
  const data = result.data as { success: boolean; message: string };
  return data.message;
}

export async function banirUtilizador(
  targetUid: string,
  banir: boolean
): Promise<void> {
  const fn = httpsCallable(functions, 'banirUtilizador');
  await fn({ targetUid, banir });
}

export async function removerConteudo(params: {
  tipo: 'post' | 'comentario' | 'resposta';
  alvoId: string;
  postId: string;
  respostaId?: string;
}): Promise<void> {
  const fn = httpsCallable(functions, 'removerConteudo');
  await fn(params);
}

// ============================================================
// ESTATÍSTICAS
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
  let likes = 0;

  function emitir() {
    callback({
      utilizadores,
      publicacoes,
      denuncias,
      denunciasPendentes,
      comentarios: 0,
      likes,
    });
  }

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

// ============================================================
// DENÚNCIAS
// ============================================================

export interface Report {
  id: string;
  tipo: 'post' | 'comentario' | 'resposta';
  alvoId: string;
  postId: string;
  autorId: string;
  autorNome: string;
  motivo: string;
  descricao: string;
  estado: 'pendente' | 'ignorado' | 'resolvido';
  conteudoDenunciado: string;
  criadoEm: any;
}

export function escutarDenuncias(
  filtro: 'todas' | 'pendente' | 'resolvido' | 'ignorado',
  callback: (reports: Report[]) => void
): () => void {
  const reportsRef = collection(db, 'reports');
  const q =
    filtro === 'todas'
      ? query(reportsRef, orderBy('criadoEm', 'desc'))
      : query(
          reportsRef,
          where('estado', '==', filtro),
          orderBy('criadoEm', 'desc')
        );

  return onSnapshot(q, (snap) => {
    const lista = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Report[];
    callback(lista);
  });
}

/**
 * Atualiza estado de uma denúncia
 */
export async function atualizarEstadoDenuncia(
  reportId: string,
  novoEstado: 'pendente' | 'ignorado' | 'resolvido'
): Promise<void> {
  const { doc, updateDoc } = await import('firebase/firestore');
  const ref = doc(db, 'reports', reportId);
  await updateDoc(ref, { estado: novoEstado });
}

/**
 * Apaga uma denúncia
 */
export async function apagarDenuncia(reportId: string): Promise<void> {
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'reports', reportId));
}