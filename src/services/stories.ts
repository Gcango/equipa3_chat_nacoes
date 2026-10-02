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
    where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { getUserProfile } from './users';

export interface Story {
  id: string;
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  imagemURL: string;
  criadoEm: Timestamp | null;
  expiraEm: Timestamp | null;
}

/**
 * Faz upload da imagem e cria o story no Firestore
 */
export async function criarStory(uri: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  // 1. Cria o documento para obter o ID
  const storiesRef = collection(db, 'stories');
  const agora = Date.now();
  const expiraEm = new Date(agora + 24 * 60 * 60 * 1000); // +24h

  const docRef = await addDoc(storiesRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    imagemURL: '',
    criadoEm: serverTimestamp(),
    expiraEm: Timestamp.fromDate(expiraEm),
  });

  // 2. Faz upload da imagem para o Storage
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `stories/${user.uid}/${docRef.id}.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(storageRef);

    // 3. Atualiza o documento com o URL
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(docRef, { imagemURL: downloadURL });
  } catch (error) {
    // Se o upload falhar, apaga o documento
    await deleteDoc(docRef);
    console.error('Erro no upload do story:', error);
    throw error;
  }
}

/**
 * Escuta TODOS os stories ativos (não expirados)
 * Depois agrupa no cliente por autorId
 */
export function escutarStoriesAtivos(
  callback: (stories: Story[]) => void
): () => void {
  const storiesRef = collection(db, 'stories');
  const agora = Timestamp.now();

  const q = query(
    storiesRef,
    where('expiraEm', '>', agora),
    orderBy('expiraEm', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lista: Story[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
          } as Story;
        })
        // Filtro extra: ignora stories com imagem vazia (upload incompleto)
        .filter((s) => s.imagemURL && s.imagemURL.length > 0);

      // Ordena por criadoEm (mais recente primeiro)
      lista.sort((a, b) => {
        const aT = a.criadoEm?.toMillis?.() || 0;
        const bT = b.criadoEm?.toMillis?.() || 0;
        return bT - aT;
      });

      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar stories:', error);
    }
  );
}

/**
 * Agrupa stories por utilizador
 */
export interface GrupoStories {
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  stories: Story[];
  maisRecente: number; // timestamp para ordenação
}

export function agruparPorAutor(stories: Story[]): GrupoStories[] {
  const mapa = new Map<string, GrupoStories>();

  stories.forEach((s) => {
    if (!mapa.has(s.autorId)) {
      mapa.set(s.autorId, {
        autorId: s.autorId,
        autorNome: s.autorNome,
        autorFotoURL: s.autorFotoURL,
        stories: [],
        maisRecente: 0,
      });
    }
    const grupo = mapa.get(s.autorId)!;
    grupo.stories.push(s);

    const ts = s.criadoEm?.toMillis?.() || 0;
    if (ts > grupo.maisRecente) grupo.maisRecente = ts;
  });

  // Ordena cada grupo internamente por criadoEm (mais antigo primeiro)
  const grupos = Array.from(mapa.values());
  grupos.forEach((g) => {
    g.stories.sort((a, b) => {
      const aT = a.criadoEm?.toMillis?.() || 0;
      const bT = b.criadoEm?.toMillis?.() || 0;
      return aT - bT;
    });
  });

  // Ordena os grupos por mais recente
  grupos.sort((a, b) => b.maisRecente - a.maisRecente);

  return grupos;
}

/**
 * Apaga um story (só o autor)
 */
export async function apagarStory(storyId: string): Promise<void> {
  await deleteDoc(doc(db, 'stories', storyId));
}