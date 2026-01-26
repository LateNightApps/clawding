'use client'

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
      className={className}
    >
      <style>
        {animated && `
          @keyframes wave-left {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-15deg); }
          }
          @keyframes wave-right {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(15deg); }
          }
          @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          .claw-left { animation: wave-left 2s ease-in-out infinite; transform-origin: 35px 50px; }
          .claw-right { animation: wave-right 2s ease-in-out infinite; transform-origin: 85px 50px; }
          .eye-left, .eye-right { animation: blink 4s ease-in-out infinite; }
        `}
      </style>

      {/* Left Claw */}
      <g className="claw-left">
        <ellipse cx="20" cy="50" rx="18" ry="12" fill="#ff6b6b" />
        <ellipse cx="8" cy="45" rx="10" ry="7" fill="#ff6b6b" />
        <ellipse cx="8" cy="55" rx="10" ry="7" fill="#ff6b6b" />
        <ellipse cx="20" cy="50" rx="14" ry="8" fill="#ff8585" />
      </g>

      {/* Right Claw */}
      <g className="claw-right">
        <ellipse cx="100" cy="50" rx="18" ry="12" fill="#ff6b6b" />
        <ellipse cx="112" cy="45" rx="10" ry="7" fill="#ff6b6b" />
        <ellipse cx="112" cy="55" rx="10" ry="7" fill="#ff6b6b" />
        <ellipse cx="100" cy="50" rx="14" ry="8" fill="#ff8585" />
      </g>

      {/* Legs */}
      <ellipse cx="30" cy="85" rx="6" ry="12" fill="#ff6b6b" transform="rotate(-20 30 85)" />
      <ellipse cx="45" cy="90" rx="5" ry="10" fill="#ff6b6b" transform="rotate(-10 45 90)" />
      <ellipse cx="75" cy="90" rx="5" ry="10" fill="#ff6b6b" transform="rotate(10 75 90)" />
      <ellipse cx="90" cy="85" rx="6" ry="12" fill="#ff6b6b" transform="rotate(20 90 85)" />

      {/* Body */}
      <ellipse cx="60" cy="65" rx="35" ry="28" fill="#ff6b6b" />
      <ellipse cx="60" cy="62" rx="30" ry="22" fill="#ff8585" />

      {/* Face area */}
      <ellipse cx="60" cy="55" rx="22" ry="16" fill="#ffaaaa" opacity="0.5" />

      {/* Eyes */}
      <g className="eye-left" style={{ transformOrigin: '48px 52px' }}>
        <circle cx="48" cy="52" r="8" fill="#050810" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
      </g>
      <g className="eye-right" style={{ transformOrigin: '72px 52px' }}>
        <circle cx="72" cy="52" r="8" fill="#050810" />
        <circle cx="74" cy="50" r="3" fill="#ffffff" />
      </g>

      {/* Happy mouth */}
      <path
        d="M 52 68 Q 60 75 68 68"
        stroke="#050810"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheeks */}
      <circle cx="40" cy="62" r="5" fill="#ff4d4d" opacity="0.4" />
      <circle cx="80" cy="62" r="5" fill="#ff4d4d" opacity="0.4" />
    </svg>
  )
}
