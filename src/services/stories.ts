import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch
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

export interface StoryViewer {
  uid: string;
  nome: string;
  fotoURL: string;
  visualizadoEm: Timestamp | null;
}

// ============================================================
// CRIAR
// ============================================================

export async function criarStory(uri: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const perfil = await getUserProfile(user.uid);
  if (!perfil) throw new Error('Perfil não encontrado');

  const storiesRef = collection(db, 'stories');
  const agora = Date.now();
  const expiraEm = new Date(agora + 24 * 60 * 60 * 1000);

  const docRef = await addDoc(storiesRef, {
    autorId: user.uid,
    autorNome: perfil.nome || user.email?.split('@')[0] || 'Utilizador',
    autorFotoURL: perfil.fotoURL || '',
    imagemURL: '',
    criadoEm: serverTimestamp(),
    expiraEm: Timestamp.fromDate(expiraEm),
  });

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `stories/${user.uid}/${docRef.id}.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(storageRef);

    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(docRef, { imagemURL: downloadURL });
  } catch (error) {
    await deleteDoc(docRef);
    console.error('Erro no upload do story:', error);
    throw error;
  }
}

// ============================================================
// ESCUTAR STORIES ATIVOS
// ============================================================

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
        .filter((s) => s.imagemURL && s.imagemURL.length > 0);

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

// ============================================================
// AGRUPAR
// ============================================================

export interface GrupoStories {
  autorId: string;
  autorNome: string;
  autorFotoURL: string;
  stories: Story[];
  maisRecente: number;
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

  const grupos = Array.from(mapa.values());
  grupos.forEach((g) => {
    g.stories.sort((a, b) => {
      const aT = a.criadoEm?.toMillis?.() || 0;
      const bT = b.criadoEm?.toMillis?.() || 0;
      return aT - bT;
    });
  });

  grupos.sort((a, b) => b.maisRecente - a.maisRecente);

  return grupos;
}

// ============================================================
// VISUALIZAÇÕES
// ============================================================

/**
 * Regista uma visualização (ignora o próprio autor e duplicados).
 * Usa setDoc simples sem getDoc para evitar permission denied na leitura.
 * Se o viewer já existir, o setDoc falha silenciosamente (timestamp mantém-se).
 */
export async function registrarVisualizacao(
  storyId: string,
  storyAutorId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  // Não registar o próprio autor
  if (user.uid === storyAutorId) return;

  try {
    const perfil = await getUserProfile(user.uid);
    if (!perfil) return;

    const viewerRef = doc(db, 'stories', storyId, 'viewers', user.uid);

    // Tenta criar. Se já existir (permission denied no create porque a regra
    // bloqueia updates), ignora silenciosamente.
    await setDoc(viewerRef, {
      uid: user.uid,
      nome: perfil.nome || perfil.username || 'Utilizador',
      fotoURL: perfil.fotoURL || '',
      visualizadoEm: serverTimestamp(),
    });
  } catch (e: any) {
    // Ignora "permission denied" (viewer já existe)
    if (!e?.message?.includes('permission')) {
      console.error('Erro ao registar visualização:', e);
    }
  }
}

/**
 * Escuta a lista de viewers de um story (só o autor deve poder usar)
 */
export function escutarViewers(
  storyId: string,
  callback: (viewers: StoryViewer[]) => void
): () => void {
  const viewersRef = collection(db, 'stories', storyId, 'viewers');
  const q = query(viewersRef, orderBy('visualizadoEm', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const lista: StoryViewer[] = snap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as StoryViewer[];
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar viewers:', error);
    }
  );
}

/**
 * Escuta a contagem de viewers de um story
 */
export function escutarContagemViewers(
  storyId: string,
  callback: (total: number) => void
): () => void {
  const viewersRef = collection(db, 'stories', storyId, 'viewers');

  return onSnapshot(viewersRef, (snap) => {
    callback(snap.size);
  });
}

// ============================================================
// APAGAR STORY
// ============================================================

/**
 * Apaga um story (só o autor).
 * Apaga: subcoleção viewers + documento principal (batch atómico)
 */
export async function apagarStoryCompleto(storyId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  try {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error('Story não encontrado');
    }

    const data = storySnap.data();
    if (data.autorId !== user.uid) {
      throw new Error('Só podes apagar o teu próprio story');
    }

    // Apaga subcoleção de viewers
    const { getDocs } = await import('firebase/firestore');
    const viewersRef = collection(db, 'stories', storyId, 'viewers');
    const viewersSnap = await getDocs(viewersRef);

    const batch = writeBatch(db);
    viewersSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(storyRef);
    await batch.commit();

    console.log(`🗑️ Story ${storyId} apagado com ${viewersSnap.size} viewers`);
  } catch (e) {
    console.error('Erro ao apagar story:', e);
    throw e;
  }
}

// ============================================================
// APAGAR (legacy)
// ============================================================

export async function apagarStory(storyId: string): Promise<void> {
  await deleteDoc(doc(db, 'stories', storyId));
}