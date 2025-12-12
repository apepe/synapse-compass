'use client'

import Image from 'next/image'

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Official Synapse Logo */}
      <a 
        href="https://synapse-compass.org/" 
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Image
          src="/synapse_logo.png"
          alt="Synapse"
          width={120}
          height={32}
          className="h-8 w-auto"
          priority
        />
      </a>
      
      {/* Compass emoji */}
      <span className="text-xl">🧭</span>
    </div>
  )
}

