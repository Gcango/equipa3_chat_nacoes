import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserProfile } from './users';

export interface Post {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  autorRole: string;
  conteudo: string;
  likes: number;
  criadoEm: Timestamp | null;
}

/**
 * Cria uma nova publicação
 */
export async function criarPost(conteudo: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  const postsRef = collection(db, 'posts');
  await addDoc(postsRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    autorRole: perfil.role || 'aluno',
    conteudo: conteudo.trim(),
    likes: 0,
    criadoEm: serverTimestamp(),
  });
}

/**
 * Escuta publicações em tempo real (onSnapshot)
 * Devolve a função unsubscribe para parar de escutar
 */
export function escutarPosts(callback: (posts: Post[]) => void): () => void {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('criadoEm', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const lista: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar posts:', error);
    }
  );

  return unsubscribe;
}

/**
 * Apaga uma publicação (só o autor)
 */
export async function apagarPost(postId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  await deleteDoc(postRef);
}

/**
 * Converte timestamp em texto relativo ("há 5 min")
 */
export function formatarTempoRelativo(timestamp: Timestamp | null): string {
  if (!timestamp) return 'agora';

  const agora = Date.now();
  const dataPost = timestamp.toMillis();
  const diferenca = Math.floor((agora - dataPost) / 1000); // segundos

  if (diferenca < 60) return 'agora';
  if (diferenca < 3600) return `há ${Math.floor(diferenca / 60)} min`;
  if (diferenca < 86400) return `há ${Math.floor(diferenca / 3600)} h`;
  if (diferenca < 604800) return `há ${Math.floor(diferenca / 86400)} dias`;
  if (diferenca < 2592000) return `há ${Math.floor(diferenca / 604800)} sem`;
  if (diferenca < 31536000) return `há ${Math.floor(diferenca / 2592000)} meses`;
  return `há ${Math.floor(diferenca / 31536000)} anos`;
}