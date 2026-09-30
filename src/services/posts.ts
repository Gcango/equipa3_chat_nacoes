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
import { uploadImagensPost } from './storage';
import { getUserProfile } from './users';

export interface Post {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  autorRole: string;
  conteudo: string;
  imagens: string[]; // URLs das imagens
  likes: number;
  criadoEm: Timestamp | null;
}

/**
 * Cria uma nova publicação (com ou sem imagens)
 * @param conteudo - Texto do post
 * @param imagensLocais - URIs locais das imagens (para upload)
 */
export async function criarPost(
  conteudo: string,
  imagensLocais: string[] = []
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  // 1. Criar o post primeiro (sem imagens) para obter o ID
  const postsRef = collection(db, 'posts');
  const docRef = await addDoc(postsRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    autorRole: perfil.role || 'aluno',
    conteudo: conteudo.trim(),
    imagens: [],
    likes: 0,
    criadoEm: serverTimestamp(),
  });

  // 2. Se houver imagens, fazer upload e atualizar o post
  if (imagensLocais.length > 0) {
    const urls = await uploadImagensPost(user.uid, imagensLocais, docRef.id);
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(docRef, { imagens: urls });
  }
}

/**
 * Escuta publicações em tempo real
 */
export function escutarPosts(callback: (posts: Post[]) => void): () => void {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('criadoEm', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const lista: Post[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          imagens: data.imagens || [],
        } as Post;
      });
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar posts:', error);
    }
  );

  return unsubscribe;
}

/**
 * Apaga uma publicação
 */
export async function apagarPost(postId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  await deleteDoc(postRef);
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