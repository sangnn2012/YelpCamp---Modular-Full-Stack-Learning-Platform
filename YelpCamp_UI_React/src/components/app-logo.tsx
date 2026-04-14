interface AppLogoProps {
  className?: string
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className="text-base font-bold text-primary">YelpCamp</span>
      <span className="text-sm text-muted-foreground">·</span>
      <ReactMark className="h-6 w-6" />
      <span className="text-base font-semibold" style={{ color: '#61DAFB' }}>
        React
      </span>
      <span className="text-sm text-muted-foreground">+</span>
      <GopherMark className="h-7 w-7" />
      <span className="text-base font-semibold" style={{ color: '#00ADD8' }}>
        Go
      </span>
    </div>
  )
}

function ReactMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-11.5 -10.23174 23 20.46348"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="React"
      role="img"
    >
      <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  )
}

function GopherMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Go gopher"
      role="img"
    >
      <ellipse cx="32" cy="34" rx="20" ry="22" fill="#00ADD8" />
      <ellipse cx="20" cy="10" rx="4" ry="7" fill="#00ADD8" />
      <ellipse cx="44" cy="10" rx="4" ry="7" fill="#00ADD8" />
      <circle cx="20" cy="10" r="2" fill="#F6D2A2" />
      <circle cx="44" cy="10" r="2" fill="#F6D2A2" />
      <circle cx="24" cy="28" r="6" fill="#FFFFFF" />
      <circle cx="40" cy="28" r="6" fill="#FFFFFF" />
      <circle cx="25" cy="29" r="2.5" fill="#0A0A0A" />
      <circle cx="41" cy="29" r="2.5" fill="#0A0A0A" />
      <circle cx="25.5" cy="28.3" r="0.8" fill="#FFFFFF" />
      <circle cx="41.5" cy="28.3" r="0.8" fill="#FFFFFF" />
      <ellipse cx="32" cy="38" rx="2.5" ry="2" fill="#0A0A0A" />
    </svg>
  )
}
