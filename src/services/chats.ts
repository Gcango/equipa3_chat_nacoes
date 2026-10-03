import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where
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
  criadoEm: Timestamp | null;
}

/**
 * Gera um ID único para o chat (par ordenado de uids)
 */
export function gerarChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * Abre (ou cria) um chat com outro user
 * Devolve o chatId
 */
export async function abrirChatComUser(
  outroUid: string
): Promise<string> {
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

/**
 * Envia uma mensagem
 */
export async function enviarMensagem(
  chatId: string,
  texto: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');
  if (!texto.trim()) return;

  // Adiciona a mensagem na subcoleção
  const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
  await addDoc(mensagensRef, {
    autorId: user.uid,
    texto: texto.trim(),
    criadoEm: serverTimestamp(),
  });

  // Atualiza o chat com info da última mensagem
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

/**
 * Escuta as mensagens de um chat (tempo real)
 */
export function escutarMensagens(
  chatId: string,
  callback: (mensagens: Mensagem[]) => void
): () => void {
  const mensagensRef = collection(db, 'chats', chatId, 'mensagens');
  const q = query(mensagensRef, orderBy('criadoEm', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const lista: Mensagem[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Mensagem[];
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar mensagens:', error);
    }
  );
}

/**
 * Escuta a lista de chats de um utilizador
 */
export function escutarChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participantes', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const lista: Chat[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Chat[];

      // Ordena por última mensagem (mais recente primeiro)
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

/**
 * Marca um chat como lido (zera o contador de não lidas do user)
 */
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

/**
 * Calcula total de não lidas para o badge
 */
export function calcularTotalNaoLidas(chats: Chat[], userId: string): number {
  return chats.reduce((total, chat) => {
    return total + (chat.naoLidas?.[userId] || 0);
  }, 0);
}

/**
 * Info do outro participante de um chat
 */
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