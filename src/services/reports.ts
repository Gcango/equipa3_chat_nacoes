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
    updateDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export type MotivoDenuncia =
  | 'spam'
  | 'assedio'
  | 'conteudo_inapropriado'
  | 'violencia'
  | 'outro';

export type TipoDenuncia = 'post' | 'comentario' | 'resposta';

export type EstadoDenuncia = 'pendente' | 'ignorado' | 'resolvido';

export interface Report {
  id: string;
  tipo: TipoDenuncia;
  alvoId: string;
  postId: string;
  autorId: string;
  autorNome: string;
  motivo: MotivoDenuncia;
  descricao: string;
  estado: EstadoDenuncia;
  conteudoDenunciado: string;
  criadoEm: Timestamp | null;
  resolvidoPor?: string;
}

export const MOTIVOS: { valor: MotivoDenuncia; label: string }[] = [
  { valor: 'spam', label: 'Spam ou conteúdo repetido' },
  { valor: 'assedio', label: 'Assédio ou bullying' },
  { valor: 'conteudo_inapropriado', label: 'Conteúdo inapropriado' },
  { valor: 'violencia', label: 'Violência ou ameaças' },
  { valor: 'outro', label: 'Outro motivo' },
];

/**
 * Cria uma denúncia
 */
export async function criarDenuncia(params: {
  tipo: TipoDenuncia;
  alvoId: string;
  postId: string;
  motivo: MotivoDenuncia;
  descricao: string;
  conteudoDenunciado: string;
  autorNome: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado');

  const reportsRef = collection(db, 'reports');
  await addDoc(reportsRef, {
    tipo: params.tipo,
    alvoId: params.alvoId,
    postId: params.postId,
    autorId: user.uid,
    autorNome: params.autorNome,
    motivo: params.motivo,
    descricao: params.descricao.trim(),
    estado: 'pendente',
    conteudoDenunciado: params.conteudoDenunciado,
    criadoEm: serverTimestamp(),
  });
}

/**
 * Escuta denúncias (só admin) — todas
 */
export function escutarDenuncias(
  callback: (reports: Report[]) => void
): () => void {
  const reportsRef = collection(db, 'reports');
  const q = query(reportsRef, orderBy('criadoEm', 'desc'));

  return onSnapshot(q, (snap) => {
    const lista: Report[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Report[];
    callback(lista);
  });
}

/**
 * Escuta denúncias pendentes (só admin)
 */
export function escutarDenunciasPendentes(
  callback: (reports: Report[]) => void
): () => void {
  const reportsRef = collection(db, 'reports');
  const q = query(
    reportsRef,
    where('estado', '==', 'pendente'),
    orderBy('criadoEm', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const lista: Report[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Report[];
    callback(lista);
  });
}

/**
 * Marca denúncia como ignorada
 */
export async function ignorarDenuncia(reportId: string): Promise<void> {
  const ref = doc(db, 'reports', reportId);
  await updateDoc(ref, {
    estado: 'ignorado',
    resolvidoPor: auth.currentUser?.uid || '',
  });
}

/**
 * Marca denúncia como resolvida (após remover conteúdo)
 */
export async function resolverDenuncia(reportId: string): Promise<void> {
  const ref = doc(db, 'reports', reportId);
  await updateDoc(ref, {
    estado: 'resolvido',
    resolvidoPor: auth.currentUser?.uid || '',
  });
}

/**
 * Apaga denúncia
 */
export async function apagarDenuncia(reportId: string): Promise<void> {
  await deleteDoc(doc(db, 'reports', reportId));
}