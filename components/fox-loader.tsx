"use client"

import { useEffect, useState } from "react"

interface FoxLoaderProps {
  progress?: number
  status?: string
}

// ... imports ...

export function FoxLoader({ progress = 0, status = "Initializing..." }: FoxLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    setDisplayProgress(progress)
  }, [progress])

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Fintech Logo Small */}
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse group-hover:bg-blue-400/40 transition-all duration-500" />
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-lg">
          <circle cx="50" cy="50" r="45" fill="url(#bg-grad-small)" stroke="url(#stroke-grad-small)" strokeWidth="2" />
          <path d="M30 65 L45 50 L60 58 L75 35" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-[dash_1.5s_ease-in-out_infinite]" />
          <circle cx="75" cy="35" r="3" fill="white" className="animate-ping" />
          <defs>
            <linearGradient id="bg-grad-small" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="stroke-grad-small" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Profit Hub
        </h3>
        <p className="text-xs text-slate-400 font-medium animate-pulse">{status}</p>
      </div>

      {/* Progress bar */}
      <div className="w-48 relative">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
