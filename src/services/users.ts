import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type UserRole = 'aluno' | 'professor' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  bio: string;
  fotoURL: string;
  role: UserRole;
  banido: boolean;
  emailVerificado: boolean;
  criadoEm?: any;
}

/**
 * Busca o perfil do utilizador no Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid,
        email: data.email || '',
        nome: data.nome || '',
        bio: data.bio || '',
        fotoURL: data.fotoURL || '',
        role: data.role || 'aluno',
        banido: data.banido || false,
        emailVerificado: data.emailVerificado || false,
        criadoEm: data.criadoEm,
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    throw error;
  }
}

/**
 * Atualiza campos do perfil
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'nome' | 'bio' | 'fotoURL' | 'emailVerificado'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

/**
 * Marca o email como verificado
 */
export async function marcarEmailVerificado(uid: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { emailVerificado: true });
  } catch (error) {
    console.error('Erro ao marcar email como verificado:', error);
  }
}