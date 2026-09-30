import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Faz upload de uma foto de perfil para o Firebase Storage
 * @param uid - UID do utilizador
 * @param uri - URI local do ficheiro (da galeria/câmara)
 * @returns URL público da imagem no Firebase
 */
export async function uploadFotoPerfil(uid: string, uri: string): Promise<string> {
  try {
    // Converte a URI local num blob (formato que o Firebase aceita)
    const response = await fetch(uri);
    const blob = await response.blob();

    // Cria a referência no Storage: perfil/{uid}/foto.jpg
    const storageRef = ref(storage, `perfil/${uid}/foto.jpg`);

    // Faz upload
    await uploadBytes(storageRef, blob);

    // Obtém o URL público
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload da foto de perfil:', error);
    throw error;
  }
}