import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Gera o ID do documento a partir do par follower/followed
 */
function followDocId(followerId: string, followedId: string): string {
  return `${followerId}_${followedId}`;
}

/**
 * Segue um utilizador
 */
export async function seguirUser(followedId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');
  if (user.uid === followedId) throw new Error('Não podes seguir-te a ti próprio');

  const followId = followDocId(user.uid, followedId);
  const followRef = doc(db, 'follows', followId);

  await setDoc(followRef, {
    followerId: user.uid,
    followedId: followedId,
    criadoEm: serverTimestamp(),
  });
}

/**
 * Deixa de seguir um utilizador
 */
export async function deixarDeSeguirUser(followedId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const followId = followDocId(user.uid, followedId);
  const followRef = doc(db, 'follows', followId);

  await deleteDoc(followRef);
}

/**
 * Verifica se EU sigo o utilizador (uma vez)
 */
export async function estouASeguir(followedId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const followId = followDocId(user.uid, followedId);
  const followRef = doc(db, 'follows', followId);
  const snap = await getDoc(followRef);
  return snap.exists();
}

/**
 * Verifica se ELE me segue (uma vez) — para "Seguir de volta"
 */
export async function eleSegueMe(otherUid: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const followId = followDocId(otherUid, user.uid);
  const followRef = doc(db, 'follows', followId);
  const snap = await getDoc(followRef);
  return snap.exists();
}

/**
 * Escuta em tempo real se eu sigo o utilizador
 */
export function escutarEstouASeguir(
  followedId: string,
  callback: (estou: boolean) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    callback(false);
    return () => {};
  }

  const followId = followDocId(user.uid, followedId);
  const followRef = doc(db, 'follows', followId);

  return onSnapshot(followRef, (snap) => {
    callback(snap.exists());
  });
}

/**
 * Escuta em tempo real se ele me segue
 */
export function escutarEleSegueMe(
  otherUid: string,
  callback: (segue: boolean) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    callback(false);
    return () => {};
  }

  const followId = followDocId(otherUid, user.uid);
  const followRef = doc(db, 'follows', followId);

  return onSnapshot(followRef, (snap) => {
    callback(snap.exists());
  });
}

/**
 * Escuta contadores: seguidores (quem me segue) e a seguir (quem eu sigo)
 */
export function escutarContadores(
  userId: string,
  callback: (data: { seguidores: number; aSeguir: number }) => void
): () => void {
  const followsRef = collection(db, 'follows');

  // Query: quem segue este user
  const qSeguidores = query(followsRef, where('followedId', '==', userId));
  // Query: quem este user segue
  const qSeguindo = query(followsRef, where('followerId', '==', userId));

  let seguidores = 0;
  let aSeguir = 0;

  const unsub1 = onSnapshot(qSeguidores, (snap) => {
    seguidores = snap.size;
    callback({ seguidores, aSeguir });
  });

  const unsub2 = onSnapshot(qSeguindo, (snap) => {
    aSeguir = snap.size;
    callback({ seguidores, aSeguir });
  });

  return () => {
    unsub1();
    unsub2();
  };
}

export interface FollowUser {
  uid: string;
  nome: string;
  fotoURL: string;
  role: string;
}

/**
 * Escuta a lista de seguidores (quem me segue) e devolve os dados do perfil
 */
export function escutarSeguidores(
  userId: string,
  callback: (users: FollowUser[]) => void
): () => void {
  const followsRef = collection(db, 'follows');
  const q = query(followsRef, where('followedId', '==', userId));

  return onSnapshot(q, async (snap) => {
    const uids = snap.docs.map((d) => d.data().followerId as string);
    const perfis = await Promise.all(uids.map((uid) => buscarPerfil(uid)));
    callback(perfis.filter((p): p is FollowUser => p !== null));
  });
}

/**
 * Escuta a lista de quem o user segue e devolve os dados do perfil
 */
export function escutarSeguindo(
  userId: string,
  callback: (users: FollowUser[]) => void
): () => void {
  const followsRef = collection(db, 'follows');
  const q = query(followsRef, where('followerId', '==', userId));

  return onSnapshot(q, async (snap) => {
    const uids = snap.docs.map((d) => d.data().followedId as string);
    const perfis = await Promise.all(uids.map((uid) => buscarPerfil(uid)));
    callback(perfis.filter((p): p is FollowUser => p !== null));
  });
}

/**
 * Auxiliar: busca perfil de um utilizador
 */
async function buscarPerfil(uid: string): Promise<FollowUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      nome: data.nome || data.email?.split('@')[0] || 'Utilizador',
      fotoURL: data.fotoURL || '',
      role: data.role || 'aluno',
    };
  } catch {
    return null;
  }
}