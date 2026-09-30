import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Faz upload de uma foto de perfil
 */
export async function uploadFotoPerfil(uid: string, uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `perfil/${uid}/foto.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload da foto de perfil:', error);
    throw error;
  }
}

/**
 * Faz upload de UMA imagem de post
 * @param uid - UID do autor
 * @param uri - URI local da imagem
 * @param postId - ID do post (gerado antes do upload)
 * @param index - Índice da imagem no array (0, 1, 2...)
 */
export async function uploadImagemPost(
  uid: string,
  uri: string,
  postId: string,
  index: number
): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `posts/${uid}/${postId}/imagem_${index}.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error(`Erro no upload da imagem ${index}:`, error);
    throw error;
  }
}

/**
 * Faz upload de VÁRIAS imagens em paralelo
 * @returns Array de URLs das imagens
 */
export async function uploadImagensPost(
  uid: string,
  uris: string[],
  postId: string
): Promise<string[]> {
  const promises = uris.map((uri, index) =>
    uploadImagemPost(uid, uri, postId, index)
  );
  return Promise.all(promises);
}