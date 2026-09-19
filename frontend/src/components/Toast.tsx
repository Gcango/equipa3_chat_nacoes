type Props = {
  message: string;
  variant?: "success" | "error";
  onDismiss: () => void;
};

export default function Toast({ message, variant = "success", onDismiss }: Props) {
  return (
    <div className={`toast toast--${variant}`} role="status">
      <span>{message}</span>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="Fechar">
        ×
      </button>
    </div>
  );
}
