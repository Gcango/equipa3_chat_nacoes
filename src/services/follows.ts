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

// ============================================================
// SEGUIR / DEIXAR DE SEGUIR
// ============================================================

function followDocId(followerId: string, followedId: string): string {
  return `${followerId}_${followedId}`;
}

export async function seguirUser(followedId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');
  if (user.uid === followedId) throw new Error('Não podes seguir-te a ti próprio');

  const followId = followDocId(user.uid, followedId);
  await setDoc(doc(db, 'follows', followId), {
    followerId: user.uid,
    followedId: followedId,
    criadoEm: serverTimestamp(),
  });
}

export async function deixarDeSeguirUser(followedId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const followId = followDocId(user.uid, followedId);
  await deleteDoc(doc(db, 'follows', followId));
}

export async function estouASeguir(followedId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const followId = followDocId(user.uid, followedId);
  const snap = await getDoc(doc(db, 'follows', followId));
  return snap.exists();
}

export async function eleSegueMe(otherUid: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const followId = followDocId(otherUid, user.uid);
  const snap = await getDoc(doc(db, 'follows', followId));
  return snap.exists();
}

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
  return onSnapshot(doc(db, 'follows', followId), (snap) => {
    callback(snap.exists());
  });
}

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
  return onSnapshot(doc(db, 'follows', followId), (snap) => {
    callback(snap.exists());
  });
}

// ============================================================
// CONTADORES
// ============================================================

export function escutarContadores(
  userId: string,
  callback: (data: { seguidores: number; aSeguir: number }) => void
): () => void {
  const followsRef = collection(db, 'follows');
  const qSeguidores = query(followsRef, where('followedId', '==', userId));
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

// ============================================================
// LISTAS
// ============================================================

export interface FollowUser {
  uid: string;
  nome: string;
  email: string;
  fotoURL: string;
  role: string;
}

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

async function buscarPerfil(uid: string): Promise<FollowUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const email = data.email || '';

    return {
      uid,
      nome: data.nome || email.split('@')[0] || 'Utilizador',
      email,
      fotoURL: data.fotoURL || '',
      role: data.role || 'aluno',
    };
  } catch {
    return null;
  }
}