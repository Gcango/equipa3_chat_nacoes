type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserAvatar({ name, avatarUrl, size = "md", className }: Props) {
  const classes = ["avatar", `avatar--${size}`, className].filter(Boolean).join(" ");
  if (avatarUrl) {
    return <img className={classes} src={avatarUrl} alt="" aria-hidden />;
  }
  return (
    <span className={classes} aria-hidden>
      {initials(name)}
    </span>
  );
}
