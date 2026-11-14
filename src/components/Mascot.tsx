// "Mầm": the site's leaf-sprite mascot and the face of every AI feature.
export function Mascot({ size = 40, onDark = false, className }: { size?: number; onDark?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path d="M24 12V6" stroke={onDark ? "#cfe3d3" : "#2f6b47"} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 7C18 2 12 4 12 8C16 10 21 10 24 7Z" fill={onDark ? "#9ad69a" : "#7cc47f"} />
      <path d="M24 6C29 0 36 2 36 6C32 9 27 9 24 6Z" fill={onDark ? "#7cc47f" : "#5fae6e"} />
      <ellipse cx="24" cy="30" rx="17" ry="15" fill={onDark ? "#6fbf78" : "#5fae6e"} />
      <ellipse cx="24" cy="32" rx="11" ry="9" fill="#fff" />
      <circle cx="20" cy="31" r="1.8" fill="#1b2e24" />
      <circle cx="28" cy="31" r="1.8" fill="#1b2e24" />
      <ellipse cx="16.5" cy="35" rx="2" ry="1.2" fill="#f4b6b6" />
      <ellipse cx="31.5" cy="35" rx="2" ry="1.2" fill="#f4b6b6" />
      <path d="M22.5 35Q24 36.5 25.5 35" stroke="#1b2e24" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
