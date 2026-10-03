import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserProfile } from './users';

export interface Chat {
  id: string;
  participantes: string[];
  ultimaMensagem: string;
  ultimaMensagemPor: string;
  ultimaMensagemAt: Timestamp | null;
  naoLidas: { [uid: string]: number };
  criadoEm: Timestamp | null;
}

export interface Mensagem {
  id: string;
  autorId: string;
  texto: string;
  visto: boolean;
  apagadaPara: string[];
  apagadaParaTodos: boolean;
  criadoEm: Timestamp | null;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

export function gerarChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

// ============================================================
// CRIAR / ABRIR CHAT
// ============================================================

export async function abrirChatComUser(outroUid: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');
  if (user.uid === outroUid) throw new Error('Não podes falar contigo próprio');

  const chatId = gerarChatId(user.uid, outroUid);
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      participantes: [user.uid, outroUid],
      ultimaMensagem: '',
      ultimaMensagemPor: '',
      ultimaMensagemAt: null,
      naoLidas: { [user.uid]: 0, [outroUid]: 0 },
      criadoEm: serverTimestamp(),
    });
  }

  return chatId;
}

// ============================================================
// ENVIAR MENSAGEM
// ============================================================

export async function enviarMensagem(
  chatId: string,
  texto: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');
  if (!texto.trim()) return;

  const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
  await addDoc(mensagensRef, {
    autorId: user.uid,
    texto: texto.trim(),
    visto: false,
    apagadaPara: [],
    apagadaParaTodos: false,
    criadoEm: serverTimestamp(),
  });

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) return;

  const participantes = chatSnap.data().participantes as string[];
  const outroUid = participantes.find((p) => p !== user.uid);
  if (!outroUid) return;

  await updateDoc(chatRef, {
    ultimaMensagem: texto.trim().slice(0, 80),
    ultimaMensagemPor: user.uid,
    ultimaMensagemAt: serverTimestamp(),
    [`naoLidas.${outroUid}`]: increment(1),
  });
}

// ============================================================
// ESCUTAR MENSAGENS
// ============================================================

export function escutarMensagens(
  chatId: string,
  callback: (mensagens: Mensagem[]) => void
): () => void {
  const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
  const q = query(mensagensRef, orderBy('criadoEm', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const lista: Mensagem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          autorId: data.autorId,
          texto: data.texto || '',
          visto: data.visto || false,
          apagadaPara: data.apagadaPara || [],
          apagadaParaTodos: data.apagadaParaTodos || false,
          criadoEm: data.criadoEm,
        } as Mensagem;
      });
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar mensagens:', error);
    }
  );
}

// ============================================================
// ESCUTAR LISTA DE CHATS
// ============================================================

export function escutarChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participantes', 'array-contains', userId));

  return onSnapshot(
    q,
    (snap) => {
      const lista: Chat[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Chat[];

      lista.sort((a, b) => {
        const aT = a.ultimaMensagemAt?.toMillis?.() || 0;
        const bT = b.ultimaMensagemAt?.toMillis?.() || 0;
        return bT - aT;
      });

      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar chats:', error);
    }
  );
}

// ============================================================
// MARCAR COMO LIDO / VISTO
// ============================================================

export async function marcarChatComoLido(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`naoLidas.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Erro ao marcar chat como lido:', error);
  }
}

export async function marcarMensagensComoVistas(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
    const q = query(
      mensagensRef,
      where('autorId', '!=', userId),
      where('visto', '==', false)
    );

    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { visto: true }));
    await batch.commit();
  } catch (e) {
    console.error('Erro ao marcar mensagens como vistas:', e);
  }
}

// ============================================================
// APAGAR MENSAGENS
// ============================================================

/**
 * Apaga uma mensagem só para o user atual
 */
export async function apagarMensagemParaMim(
  chatId: string,
  mensagemId: string,
  userId: string
): Promise<void> {
  try {
    const msgRef = doc(db, 'chats', chatId, 'mensagens', mensagemId);
    await updateDoc(msgRef, {
      apagadaPara: arrayUnion(userId),
    });
  } catch (e) {
    console.error('Erro ao apagar mensagem para mim:', e);
    throw e;
  }
}

/**
 * Apaga uma mensagem para todos (só se for minha e não vista)
 */
export async function apagarMensagemParaTodos(
  chatId: string,
  mensagemId: string
): Promise<void> {
  try {
    const msgRef = doc(db, 'chats', chatId, 'mensagens', mensagemId);
    await updateDoc(msgRef, {
      apagadaParaTodos: true,
    });
  } catch (e) {
    console.error('Erro ao apagar mensagem para todos:', e);
    throw e;
  }
}

// ============================================================
// INFORMAÇÃO DO OUTRO USER
// ============================================================

export function calcularTotalNaoLidas(
  chats: Chat[],
  userId: string
): number {
  return chats.reduce((total, chat) => {
    return total + (chat.naoLidas?.[userId] || 0);
  }, 0);
}

export interface InfoOutroUser {
  uid: string;
  nome: string;
  username: string;
  fotoURL: string;
  role: string;
}

export async function getInfoOutroUser(
  chat: Chat,
  meuUid: string
): Promise<InfoOutroUser | null> {
  const outroUid = chat.participantes.find((p) => p !== meuUid);
  if (!outroUid) return null;

  const perfil = await getUserProfile(outroUid);
  if (!perfil) return null;

  return {
    uid: outroUid,
    nome: perfil.nome || perfil.username || 'Utilizador',
    username: perfil.username,
    fotoURL: perfil.fotoURL,
    role: perfil.role,
  };
}