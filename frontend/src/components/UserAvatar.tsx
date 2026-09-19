type Props = {
  name: string;
  size?: "sm" | "md" | "lg";
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserAvatar({ name, size = "md" }: Props) {
  return (
    <span className={`avatar avatar--${size}`} aria-hidden>
      {initials(name)}
    </span>
  );
}
