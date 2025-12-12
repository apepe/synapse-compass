'use client'

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Official Synapse Logo */}
      <a 
        href="https://www.synapse.org" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {/* Official Synapse network icon - three interconnected circles */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Top circle - blue */}
          <circle cx="50" cy="20" r="12" fill="#3B82F6" />
          {/* Bottom-left circle - green */}
          <circle cx="20" cy="80" r="12" fill="#10B981" />
          {/* Bottom-right circle - orange */}
          <circle cx="80" cy="80" r="12" fill="#F97316" />
          {/* Blue line: top blue to bottom-left green */}
          <path
            d="M 50 32 Q 35 50 20 68"
            stroke="#3B82F6"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Green line: bottom-left green to bottom-right orange */}
          <path
            d="M 32 80 Q 50 85 68 80"
            stroke="#10B981"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Orange line: bottom-right orange to top blue */}
          <path
            d="M 80 68 Q 65 50 50 32"
            stroke="#F97316"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span className="text-blue-600 font-semibold text-lg tracking-tight uppercase">
          SYNAPSE
        </span>
      </a>
      
      {/* Compass emoji */}
      <span className="text-xl">🧭</span>
    </div>
  )
}

