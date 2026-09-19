import { FormEvent, useEffect, useState } from "react";

export const REPORT_REASONS = [
  { value: "BULLYING", label: "Bullying / assédio" },
  { value: "INSULTO", label: "Insulto" },
  { value: "AMEACA", label: "Ameaça" },
  { value: "OFENSIVO", label: "Conteúdo ofensivo" },
  { value: "IMPROPRIO", label: "Conteúdo impróprio" },
  { value: "SPAM", label: "Spam" },
  { value: "OUTRO", label: "Outro" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
};

export default function ReportModal({ open, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<string>("SPAM");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("SPAM");
    setDescription("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(reason, description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar denúncia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 id="report-modal-title">Denunciar publicação</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <p className="modal__lead">
          A moderação da escola analisa cada denúncia. Escolhe o motivo mais adequado.
        </p>
        <form onSubmit={handleSubmit} className="form">
          <fieldset className="report-reasons">
            <legend className="sr-only">Motivo</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.value} className="report-reasons__item">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>
          <label>
            Detalhes (opcional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Contexto adicional para a equipa de moderação…"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "A enviar…" : "Enviar denúncia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
