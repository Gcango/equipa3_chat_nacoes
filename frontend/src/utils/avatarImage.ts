const MAX_BYTES = 280_000;

export async function fileToAvatarDataUrl(file: File, maxPx = 320): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolhe uma imagem (JPEG, PNG ou WebP).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A imagem é demasiado grande (máx. 8 MB).");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_BYTES) {
    throw new Error("Imagem demasiado complexa. Tenta outra foto mais simples.");
  }
  return dataUrl;
}
