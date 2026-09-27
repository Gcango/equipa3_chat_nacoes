import { useRef, useState } from "react";
import { updateProfile } from "../api";
import { fileToAvatarDataUrl } from "../utils/avatarImage";
import UserAvatar from "./UserAvatar";

type Props = {
  name: string;
  avatarUrl?: string | null;
  onUpdated: (avatarUrl: string | null) => void;
};

export default function ProfileAvatarEditor({ name, avatarUrl, onUpdated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(file: File) {
    setError("");
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const updated = await updateProfile({ avatarUrl: dataUrl });
      onUpdated(updated.avatarUrl ?? dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao guardar foto.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setError("");
    setBusy(true);
    try {
      await updateProfile({ avatarUrl: null });
      onUpdated(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-avatar-editor">
      <div className="profile-avatar-editor__visual">
        <UserAvatar name={name} avatarUrl={avatarUrl} size="xl" />
        <button
          type="button"
          className="profile-avatar-editor__change"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "A guardar…" : "Alterar foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="profile-avatar-editor__file"
          aria-label="Escolher foto de perfil"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void onPick(f);
          }}
        />
      </div>
      <p className="profile-avatar-editor__hint">
        JPG ou PNG · visível no feed, mensagens e cabeçalho
      </p>
      {avatarUrl && (
        <button
          type="button"
          className="profile-avatar-editor__remove"
          disabled={busy}
          onClick={() => void onRemove()}
        >
          Remover foto
        </button>
      )}
      {error && <p className="profile-avatar-editor__error">{error}</p>}
    </div>
  );
}
