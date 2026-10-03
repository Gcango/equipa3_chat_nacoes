import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserProfile } from './users';

export type TipoNotificacao = 'like' | 'comentario' | 'resposta' | 'seguir';

export interface Notificacao {
  id: string;
  destinatarioId: string;
  tipo: TipoNotificacao;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  postId?: string;
  comentarioId?: string;
  texto?: string;
  lida: boolean;
  criadoEm: Timestamp | null;
}

/**
 * Cria uma notificação (ignora se for ação no próprio conteúdo)
 */
export async function criarNotificacao(params: {
  destinatarioId: string;
  tipo: TipoNotificacao;
  postId?: string;
  comentarioId?: string;
  texto?: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  // ❌ Não criar se for o próprio destinatário
  if (params.destinatarioId === user.uid) return;

  try {
    const perfil = await getUserProfile(user.uid);
    if (!perfil) return;

    const notifsRef = collection(db, 'notifications');
    await addDoc(notifsRef, {
      destinatarioId: params.destinatarioId,
      tipo: params.tipo,
      autorId: user.uid,
      autorNome: perfil.nome || perfil.username || 'Utilizador',
      autorFotoURL: perfil.fotoURL || '',
      postId: params.postId || '',
      comentarioId: params.comentarioId || '',
      texto: params.texto || '',
      lida: false,
      criadoEm: serverTimestamp(),
    });
  } catch (error) {
    // Não bloqueia a ação principal se falhar
    console.error('Erro ao criar notificação:', error);
  }
}

/**
 * Escuta notificações de um utilizador (tempo real)
 */
export function escutarNotificacoes(
  userId: string,
  callback: (notifs: Notificacao[]) => void
): () => void {
  const notifsRef = collection(db, 'notifications');
  const q = query(
    notifsRef,
    where('destinatarioId', '==', userId),
    orderBy('criadoEm', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const lista: Notificacao[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Notificacao[];
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar notificações:', error);
    }
  );
}

/**
 * Escuta apenas a contagem de não lidas (para o badge)
 */
export function escutarContagemNaoLidas(
  userId: string,
  callback: (total: number) => void
): () => void {
  const notifsRef = collection(db, 'notifications');
  const q = query(
    notifsRef,
    where('destinatarioId', '==', userId),
    where('lida', '==', false)
  );

  return onSnapshot(q, (snap) => {
    callback(snap.size);
  });
}

/**
 * Marca uma notificação como lida
 */
export async function marcarComoLida(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { lida: true });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function marcarTodasComoLidas(userId: string): Promise<void> {
  try {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('destinatarioId', '==', userId),
      where('lida', '==', false)
    );
    const snap = await getDocs(q);

    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { lida: true }));
    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
  }
}

/**
 * Apaga todas as notificações relacionadas com um post
 * (chamado quando o post é apagado)
 */
export async function apagarNotificacoesDoPost(
  postId: string
): Promise<void> {
  try {
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('postId', '==', postId));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    console.error('Erro ao apagar notificações do post:', error);
  }
}