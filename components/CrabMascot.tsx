interface CrabMascotProps {
  size?: number
  className?: string
  animated?: boolean
}

export function CrabMascot({ size = 120, className = '', animated = true }: CrabMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'crab-animated' : ''} ${className}`.trim()}
      role="img"
      aria-label="Clawding crab mascot"
    >
      {/* Left Claw */}
      <g className="claw-left">
        <ellipse cx="20" cy="50" rx="18" ry="12" className="crab-body" />
        <ellipse cx="8" cy="45" rx="10" ry="7" className="crab-body" />
        <ellipse cx="8" cy="55" rx="10" ry="7" className="crab-body" />
        <ellipse cx="20" cy="50" rx="14" ry="8" className="crab-highlight" />
      </g>

      {/* Right Claw */}
      <g className="claw-right">
        <ellipse cx="100" cy="50" rx="18" ry="12" className="crab-body" />
        <ellipse cx="112" cy="45" rx="10" ry="7" className="crab-body" />
        <ellipse cx="112" cy="55" rx="10" ry="7" className="crab-body" />
        <ellipse cx="100" cy="50" rx="14" ry="8" className="crab-highlight" />
      </g>

      {/* Legs */}
      <ellipse cx="30" cy="85" rx="6" ry="12" className="crab-body" transform="rotate(-20 30 85)" />
      <ellipse cx="45" cy="90" rx="5" ry="10" className="crab-body" transform="rotate(-10 45 90)" />
      <ellipse cx="75" cy="90" rx="5" ry="10" className="crab-body" transform="rotate(10 75 90)" />
      <ellipse cx="90" cy="85" rx="6" ry="12" className="crab-body" transform="rotate(20 90 85)" />

      {/* Body */}
      <ellipse cx="60" cy="65" rx="35" ry="28" className="crab-body" />
      <ellipse cx="60" cy="62" rx="30" ry="22" className="crab-highlight" />

      {/* Face area */}
      <ellipse cx="60" cy="55" rx="22" ry="16" className="crab-face" opacity="0.5" />

      {/* Eyes */}
      <g className="eye-left">
        <circle cx="48" cy="52" r="8" className="crab-dark" />
        <circle cx="50" cy="50" r="3" className="crab-eye-shine" />
      </g>
      <g className="eye-right">
        <circle cx="72" cy="52" r="8" className="crab-dark" />
        <circle cx="74" cy="50" r="3" className="crab-eye-shine" />
      </g>

      {/* Happy mouth */}
      <path
        d="M 52 68 Q 60 75 68 68"
        className="crab-dark"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        stroke="var(--bg-primary)"
      />

      {/* Cheeks */}
      <circle cx="40" cy="62" r="5" className="crab-cheek" opacity="0.4" />
      <circle cx="80" cy="62" r="5" className="crab-cheek" opacity="0.4" />
    </svg>
  )
}
