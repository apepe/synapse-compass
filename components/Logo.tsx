'use client'

export default function Logo() {
  return (
    <div className="flex items-center gap-4">
      {/* Compass Icon */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle - medium blue, thick */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="5"
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
            r="5"
            fill="#F97316"
          />
        </svg>
      </div>
      
      {/* Text - medium blue, uppercase, sans-serif */}
      <div className="flex flex-col leading-tight">
        <span className="text-blue-600 font-semibold text-xl uppercase tracking-tight">
          SYNAPSE
        </span>
        <span className="text-blue-600 font-semibold text-xl uppercase tracking-tight">
          COMPASS
        </span>
      </div>
    </div>
  )
}

