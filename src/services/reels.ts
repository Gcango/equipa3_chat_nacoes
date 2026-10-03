import * as VideoThumbnails from 'expo-video-thumbnails';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { criarNotificacao } from './notifications';
import { getUserProfile } from './users';

export interface Reel {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  autorRole: string;
  videoURL: string;
  thumbURL: string;
  legenda: string;
  duracao: number;
  curtidas: string[];
  criadoEm: Timestamp | null;
}

const DURACAO_MAX = 60;
const TAMANHO_MAX = 25 * 1024 * 1024;

/**
 * Gera um thumbnail a partir do vídeo local
 */
async function gerarThumbnail(videoUri: string): Promise<string | null> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000, // 1 segundo
      quality: 0.7,
    });
    return uri;
  } catch (e) {
    console.error('Erro ao gerar thumbnail:', e);
    return null;
  }
}

/**
 * Upload de thumbnail para o Storage
 */
async function uploadThumbnail(
  uid: string,
  postId: string,
  thumbUri: string
): Promise<string> {
  const response = await fetch(thumbUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `reels/${uid}/${postId}_thumb.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

/**
 * Cria um novo reel com thumbnail
 */
export async function criarReel(params: {
  videoUri: string;
  legenda: string;
  duracaoSegundos: number;
  onProgress?: (progresso: number) => void;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  if (params.duracaoSegundos > DURACAO_MAX) {
    throw new Error(`O vídeo tem de ter no máximo ${DURACAO_MAX} segundos.`);
  }

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  const reelsRef = collection(db, 'reels');
  const docRef = await addDoc(reelsRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    autorRole: perfil.role || 'aluno',
    videoURL: '',
    thumbURL: '',
    legenda: params.legenda.trim(),
    duracao: params.duracaoSegundos,
    curtidas: [],
    criadoEm: serverTimestamp(),
  });

  try {
    params.onProgress?.(5);

    // 1. Gerar thumbnail local
    const thumbUri = await gerarThumbnail(params.videoUri);
    params.onProgress?.(10);

    // 2. Ler o vídeo como blob
    const response = await fetch(params.videoUri);
    const blob = await response.blob();
    params.onProgress?.(15);

    if (blob.size > TAMANHO_MAX) {
      await deleteDoc(docRef);
      throw new Error(
        `O vídeo tem ${(blob.size / 1024 / 1024).toFixed(1)} MB. Máximo: ${
          TAMANHO_MAX / 1024 / 1024
        } MB.`
      );
    }

    // 3. Upload do thumbnail (se conseguiu gerar)
    let thumbURL = '';
    if (thumbUri) {
      try {
        thumbURL = await uploadThumbnail(user.uid, docRef.id, thumbUri);
      } catch (e) {
        console.error('Erro no upload do thumbnail:', e);
      }
    }
    params.onProgress?.(25);

    // 4. Upload do vídeo com progresso
    const storageRef = ref(storage, `reels/${user.uid}/${docRef.id}.mp4`);

    return new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'video/mp4',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progresso =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const progressoMapeado = 25 + progresso * 0.7;
          params.onProgress?.(Math.round(progressoMapeado));
        },
        (error) => {
          console.error('Erro no upload:', error);
          deleteDoc(docRef);
          reject(error);
        },
        async () => {
          try {
            params.onProgress?.(95);
            const downloadURL = await getDownloadURL(storageRef);
            await updateDoc(docRef, {
              videoURL: downloadURL,
              thumbURL: thumbURL,
            });
            params.onProgress?.(100);
            resolve(docRef.id);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (error) {
    await deleteDoc(docRef);
    console.error('Erro no upload do reel:', error);
    throw error;
  }
}

export function escutarReels(callback: (reels: Reel[]) => void): () => void {
  const reelsRef = collection(db, 'reels');
  const q = query(reelsRef, orderBy('criadoEm', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const lista: Reel[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            curtidas: data.curtidas || [],
          } as Reel;
        })
        .filter((r) => r.videoURL && r.videoURL.length > 0);

      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar reels:', error);
    }
  );
}

export function escutarReelsDoUser(
  userId: string,
  callback: (reels: Reel[]) => void
): () => void {
  const reelsRef = collection(db, 'reels');
  const q = query(
    reelsRef,
    where('autorId', '==', userId),
    orderBy('criadoEm', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const lista: Reel[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            curtidas: data.curtidas || [],
          } as Reel;
        })
        .filter((r) => r.videoURL && r.videoURL.length > 0);

      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar reels do user:', error);
    }
  );
}

export function escutarContagemReels(
  userId: string,
  callback: (total: number) => void
): () => void {
  const reelsRef = collection(db, 'reels');
  const q = query(reelsRef, where('autorId', '==', userId));

  return onSnapshot(q, (snap) => {
    callback(snap.size);
  });
}

export async function addLikeReel(reelId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const reelRef = doc(db, 'reels', reelId);
  await updateDoc(reelRef, { curtidas: arrayUnion(user.uid) });

  try {
    const snap = await getDoc(reelRef);
    if (snap.exists()) {
      const autorId = snap.data().autorId;
      if (autorId && autorId !== user.uid) {
        await criarNotificacao({
          destinatarioId: autorId,
          tipo: 'like',
          postId: reelId,
        });
      }
    }
  } catch (e) {
    console.error('Erro ao criar notificação de like (reel):', e);
  }
}

export async function removeLikeReel(reelId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const reelRef = doc(db, 'reels', reelId);
  await updateDoc(reelRef, { curtidas: arrayRemove(user.uid) });
}

export async function apagarReel(reelId: string): Promise<void> {
  await deleteDoc(doc(db, 'reels', reelId));
}

export function formatarDuracao(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Regenera o thumbnail de um reel antigo (one-time)
 */
export async function regenerarThumbnailReel(
  reelId: string,
  videoUri: string
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const thumbUri = await gerarThumbnail(videoUri);
    if (!thumbUri) return null;

    const thumbURL = await uploadThumbnail(user.uid, reelId, thumbUri);
    await updateDoc(doc(db, 'reels', reelId), { thumbURL });
    return thumbURL;
  } catch (e) {
    console.error('Erro ao regenerar thumbnail:', e);
    return null;
  }
}