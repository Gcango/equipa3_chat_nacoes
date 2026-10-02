import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Converte uma URI local num Blob compatível com Firebase Storage
 * (usa FileSystem para ler o ficheiro como base64 e converter em blob)
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

/**
 * Faz upload de uma foto de perfil
 */
export async function uploadFotoPerfil(
  uid: string,
  uri: string
): Promise<string> {
  try {
    const blob = await uriToBlob(uri);
    const storageRef = ref(storage, `perfil/${uid}/foto.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload da foto de perfil:', error);
    throw error;
  }
}

/**
 * Faz upload de UMA imagem de post
 */
export async function uploadImagemPost(
  uid: string,
  uri: string,
  postId: string,
  index: number
): Promise<string> {
  try {
    const blob = await uriToBlob(uri);
    const storageRef = ref(
      storage,
      `posts/${uid}/${postId}/imagem_${index}.jpg`
    );
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error(`Erro no upload da imagem ${index}:`, error);
    throw error;
  }
}

/**
 * Faz upload de VÁRIAS imagens SEQUENCIALMENTE
 */
export async function uploadImagensPost(
  uid: string,
  uris: string[],
  postId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const url = await uploadImagemPost(uid, uris[i], postId, i);
    urls.push(url);

    if (i < uris.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return urls;
}