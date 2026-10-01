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
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { uploadImagensPost } from './storage';
import { getUserProfile } from './users';

export interface Post {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  autorRole: string;
  conteudo: string;
  imagens: string[];
  curtidas: string[];
  criadoEm: Timestamp | null;
}

/**
 * Cria uma nova publicação
 */
export async function criarPost(
  conteudo: string,
  imagensLocais: string[] = []
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  const postsRef = collection(db, 'posts');
  const docRef = await addDoc(postsRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    autorRole: perfil.role || 'aluno',
    conteudo: conteudo.trim(),
    imagens: [],
    curtidas: [],
    criadoEm: serverTimestamp(),
  });

  if (imagensLocais.length > 0) {
    const urls = await uploadImagensPost(user.uid, imagensLocais, docRef.id);
    await updateDoc(docRef, { imagens: urls });
  }
}

/**
 * Escuta TODAS as publicações em tempo real
 */
export function escutarPosts(callback: (posts: Post[]) => void): () => void {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('criadoEm', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const lista: Post[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          imagens: data.imagens || [],
          curtidas: data.curtidas || [],
        } as Post;
      });
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar posts:', error);
    }
  );
}

/**
 * Escuta posts de um utilizador específico (para grid de perfil)
 */
export function escutarPostsDoUser(
  userId: string,
  callback: (posts: Post[]) => void
): () => void {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('autorId', '==', userId),
    orderBy('criadoEm', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lista: Post[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          imagens: data.imagens || [],
          curtidas: data.curtidas || [],
        } as Post;
      });
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar posts do user:', error);
    }
  );
}

/**
 * Escuta contagem de posts de um utilizador (para perfil)
 */
export function escutarContagemPosts(
  userId: string,
  callback: (total: number) => void
): () => void {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, where('autorId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
}

/**
 * Apaga uma publicação
 */
export async function apagarPost(postId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  await deleteDoc(postRef);
}

/**
 * Adiciona um like
 */
export async function addLike(postId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { curtidas: arrayUnion(user.uid) });
}

/**
 * Remove um like
 */
export async function removeLike(postId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { curtidas: arrayRemove(user.uid) });
}

/**
 * Converte timestamp em texto relativo
 */
export function formatarTempoRelativo(timestamp: Timestamp | null): string {
  if (!timestamp) return 'agora';

  const agora = Date.now();
  const dataPost = timestamp.toMillis();
  const diferenca = Math.floor((agora - dataPost) / 1000);

  if (diferenca < 60) return 'agora';
  if (diferenca < 3600) return `há ${Math.floor(diferenca / 60)} min`;
  if (diferenca < 86400) return `há ${Math.floor(diferenca / 3600)} h`;
  if (diferenca < 604800) return `há ${Math.floor(diferenca / 86400)} dias`;
  if (diferenca < 2592000) return `há ${Math.floor(diferenca / 604800)} sem`;
  if (diferenca < 31536000) return `há ${Math.floor(diferenca / 2592000)} meses`;
  return `há ${Math.floor(diferenca / 31536000)} anos`;
}