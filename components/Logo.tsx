'use client'

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Synapse.org Logo */}
      <a 
        href="https://www.synapse.org" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {/* Synapse logo - network/synapse icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Synapse network nodes and connections */}
          <circle cx="6" cy="6" r="2" fill="#3B82F6" />
          <circle cx="18" cy="6" r="2" fill="#3B82F6" />
          <circle cx="12" cy="12" r="2.5" fill="#3B82F6" />
          <circle cx="6" cy="18" r="2" fill="#3B82F6" />
          <circle cx="18" cy="18" r="2" fill="#3B82F6" />
          <line x1="6" y1="6" x2="12" y2="12" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="18" y1="6" x2="12" y2="12" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="6" y1="18" x2="12" y2="12" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="18" y1="18" x2="12" y2="12" stroke="#3B82F6" strokeWidth="1.5" />
        </svg>
        <span className="text-gray-900 font-semibold text-lg tracking-tight">
          Synapse.org
        </span>
      </a>
      
      {/* Compass Icon - smaller, after "synapse" */}
      <div className="relative w-5 h-5 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle - medium blue, thinner */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="4"
          />
          {/* Compass needle - North (green, upward triangle, angled upper right) */}
          <path
            d="M 50 50 L 58 18 L 52 28 L 50 18 L 48 28 Z"
            fill="#10B981"
          />
          {/* Compass needle - South (orange, downward triangle, angled lower left) */}
          <path
            d="M 50 50 L 42 82 L 48 72 L 50 82 L 52 72 Z"
            fill="#F97316"
          />
          {/* Center pivot point - orange circle */}
          <circle
            cx="50"
            cy="50"
            r="4"
            fill="#F97316"
          />
        </svg>
      </div>
    </div>
  )
}

