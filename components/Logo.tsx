export function Logo({ taille = 40 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cgpt-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2A65A" />
          <stop offset="55%" stopColor="#D9631F" />
          <stop offset="100%" stopColor="#8A2E0A" />
        </linearGradient>
      </defs>
      <path d="M32 10 L58 23.5 L32.6 37.2 L6 23.3 Z" fill="url(#cgpt-grad)" />
      <path d="M32 10 L58 23.5 L32.6 37.2 L6 23.3 Z" fill="none" stroke="#1a0f06" strokeOpacity=".18" strokeWidth="1" />
      <path d="M18 28.5 L18 41.5 C18 41.5 24.5 47 32.3 47 C40 47 46.5 41.4 46.5 41.4 L46.5 28.7" fill="none" stroke="url(#cgpt-grad)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M56.3 25 L56.8 44" stroke="url(#cgpt-grad)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="57" cy="47.5" r="3.4" fill="url(#cgpt-grad)" />
    </svg>
  );
}
