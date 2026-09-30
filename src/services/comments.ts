import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserProfile } from './users';

export interface Resposta {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  autorRole: string;
  texto: string;
  criadoEm: any; // Timestamp do Firestore
}

export interface Comentario {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  autorRole: string;
  texto: string;
  criadoEm: Timestamp | null;
  respostas: Resposta[];
}

/**
 * Cria um comentário num post
 */
export async function criarComentario(
  postId: string,
  texto: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  const comentariosRef = collection(db, 'posts', postId, 'comentarios');
  await addDoc(comentariosRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    autorRole: perfil.role || 'aluno',
    texto: texto.trim(),
    criadoEm: serverTimestamp(),
    respostas: [],
  });
}

/**
 * Escuta comentários em tempo real
 */
export function escutarComentarios(
  postId: string,
  callback: (comentarios: Comentario[]) => void
): () => void {
  const comentariosRef = collection(db, 'posts', postId, 'comentarios');
  const q = query(comentariosRef, orderBy('criadoEm', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const lista: Comentario[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          respostas: data.respostas || [],
        } as Comentario;
      });
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar comentários:', error);
    }
  );

  return unsubscribe;
}

/**
 * Apaga um comentário
 */
export async function apagarComentario(
  postId: string,
  comentarioId: string
): Promise<void> {
  const comentarioRef = doc(db, 'posts', postId, 'comentarios', comentarioId);
  await deleteDoc(comentarioRef);
}

/**
 * Conta comentários (para o feed)
 */
export function escutarContagemComentarios(
  postId: string,
  callback: (total: number) => void
): () => void {
  const comentariosRef = collection(db, 'posts', postId, 'comentarios');
  const unsubscribe = onSnapshot(comentariosRef, (snapshot) => {
    callback(snapshot.size);
  });
  return unsubscribe;
}

/**
 * Adiciona uma resposta a um comentário
 */
export async function responderComentario(
  postId: string,
  comentarioId: string,
  texto: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  const novaResposta: Resposta = {
    id: `${Date.now()}_${user.uid.slice(0, 6)}`,
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    autorRole: perfil.role || 'aluno',
    texto: texto.trim(),
    criadoEm: new Date().toISOString(),
  };

  const comentarioRef = doc(db, 'posts', postId, 'comentarios', comentarioId);
  await updateDoc(comentarioRef, {
    respostas: arrayUnion(novaResposta),
  });
}

/**
 * Apaga uma resposta
 */
export async function apagarResposta(
  postId: string,
  comentarioId: string,
  resposta: Resposta
): Promise<void> {
  const comentarioRef = doc(db, 'posts', postId, 'comentarios', comentarioId);
  await updateDoc(comentarioRef, {
    respostas: arrayRemove(resposta),
  });
}