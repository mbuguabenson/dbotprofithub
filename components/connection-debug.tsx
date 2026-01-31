"use client"

import { useEffect, useState } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

export function ConnectionDebug() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = DerivWebSocketManager.getInstance()
    
    const unsubscribe = ws.onConnectionStatus((status) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Status: ${status}`].slice(-10))
      setIsConnected(status === "connected")
    })

    // Check initial state
    if (ws.isConnected()) {
      setIsConnected(true)
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Already connected`])
    }

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="text-xs space-y-1 bg-gray-900/50 p-2 rounded border border-gray-700">
      <div className="font-mono">
        {logs.map((log, i) => (
          <div key={i} className={isConnected ? "text-green-400" : "text-red-400"}>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
