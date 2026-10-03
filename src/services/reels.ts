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

const DURACAO_MAX = 60; // segundos
const TAMANHO_MAX = 25 * 1024 * 1024; // 25 MB

/**
 * Cria um novo reel
 * Estratégia: fetch(videoUri) → blob → uploadBytesResumable
 * (chunks maiores = menos pedidos HTTP = upload mais rápido)
 */
export async function criarReel(params: {
  videoUri: string;
  legenda: string;
  duracaoSegundos: number;
  onProgress?: (progresso: number) => void;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  // ✅ Validar duração
  if (params.duracaoSegundos > DURACAO_MAX) {
    throw new Error(`O vídeo tem de ter no máximo ${DURACAO_MAX} segundos.`);
  }

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  // 1. Criar documento para obter o ID
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

    // 2. Ler o vídeo como blob (via fetch — sem base64)
    const response = await fetch(params.videoUri);
    const blob = await response.blob();

    params.onProgress?.(15);

    // ✅ Validar tamanho
    if (blob.size > TAMANHO_MAX) {
      await deleteDoc(docRef);
      throw new Error(
        `O vídeo tem ${(blob.size / 1024 / 1024).toFixed(1)} MB. Máximo: ${
          TAMANHO_MAX / 1024 / 1024
        } MB.`
      );
    }

    // 3. Upload com uploadBytesResumable (mais eficiente que uploadBytes)
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
          // Mapear 0-100% para 15-95% (o resto é o doc no Firestore)
          const progressoMapeado = 15 + progresso * 0.8;
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
            await updateDoc(docRef, { videoURL: downloadURL });
            params.onProgress?.(100);
            resolve(docRef.id);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (error) {
    // Se upload falhar, apaga o doc
    await deleteDoc(docRef);
    console.error('Erro no upload do reel:', error);
    throw error;
  }
}

/**
 * Escuta todos os reels (mais recentes em cima)
 */
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

/**
 * Escuta reels de um utilizador específico
 */
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

/**
 * Escuta contagem de reels de um utilizador
 */
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

/**
 * Adiciona like a um reel + notifica o autor
 */
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

/**
 * Remove like de um reel
 */
export async function removeLikeReel(reelId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const reelRef = doc(db, 'reels', reelId);
  await updateDoc(reelRef, { curtidas: arrayRemove(user.uid) });
}

/**
 * Apaga um reel
 */
export async function apagarReel(reelId: string): Promise<void> {
  await deleteDoc(doc(db, 'reels', reelId));
}

/**
 * Formata duração em segundos para "mm:ss"
 */
export function formatarDuracao(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}