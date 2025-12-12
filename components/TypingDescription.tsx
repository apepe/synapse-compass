'use client'

import { useState, useEffect } from 'react'

interface TypingDescriptionProps {
  text: string
  onComplete?: () => void
}

export default function TypingDescription({ text, onComplete }: TypingDescriptionProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (!text) return

    setDisplayedText('')
    setIsTyping(true)
    let currentIndex = 0

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(typingInterval)
        if (onComplete) {
          onComplete()
        }
      }
    }, 20) // Typing speed: 20ms per character

    return () => clearInterval(typingInterval)
  }, [text, onComplete])

  return (
    <p className="text-gray-700 leading-relaxed">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 bg-gray-700 ml-1 animate-pulse">|</span>
      )}
    </p>
  )
}

