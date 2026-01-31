# WebSocket Integration Guide - Complete Reference

## 🎯 Quick Start

### 1. Import the Manager
```typescript
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

// Always use singleton instance
const manager = DerivWebSocketManager.getInstance()
```

### 2. Connect to WebSocket
```typescript
try {
  await manager.connect()
  console.log("Connected to Deriv API")
} catch (error) {
  console.error("Connection failed:", error)
}
```

### 3. Subscribe to Data
```typescript
const unsubscribe = await manager.subscribeTicks("R_50", (tick) => {
  console.log(`Quote: ${tick.quote}`)
  console.log(`Last Digit: ${tick.lastDigit}`)
  console.log(`Epoch: ${tick.epoch}`)
})

// When done
unsubscribe()
```

---

## 📚 Complete API Reference

### Connection Management

#### `connect(): Promise<void>`
Establishes WebSocket connection to Deriv API.
```typescript
await manager.connect()
```

#### `disconnect(): void`
Gracefully closes WebSocket connection.
```typescript
manager.disconnect()
```

#### `isConnected(): boolean`
Check current connection status.
```typescript
if (manager.isConnected()) {
  // Safe to use
}
```

### Message Handling

#### `send(message: any): void`
Send raw message to API.
```typescript
manager.send({
  active_symbols: "brief",
  product_type: "basic"
})
```

#### `on(event: string, handler: Function): void`
Listen to specific event type.
```typescript
manager.on("tick", (data) => {
  console.log("Tick received:", data)
})
```

#### `off(event: string, handler: Function): void`
Stop listening to event.
```typescript
const handler = (data) => console.log(data)
manager.on("tick", handler)
// Later...
manager.off("tick", handler)
```

### Subscriptions

#### `subscribeTicks(symbol: string, callback: Function): Promise<string>`
Subscribe to real-time tick data.
```typescript
const subscriptionId = await manager.subscribeTicks("R_50", (tick) => {
  console.log(`Symbol: ${tick.symbol}`)
  console.log(`Quote: ${tick.quote}`)
  console.log(`Last Digit: ${tick.lastDigit}`)
  console.log(`Epoch: ${tick.epoch}`)
})
```

#### `unsubscribe(subscriptionId: string): Promise<void>`
Unsubscribe from specific subscription.
```typescript
await manager.unsubscribe(subscriptionId)
```

#### `unsubscribeAll(): Promise<void>`
Unsubscribe from all active subscriptions.
```typescript
await manager.unsubscribeAll()
```

### Symbol Information

#### `getActiveSymbols(): Promise<Array>`
Fetch all available trading symbols.
```typescript
const symbols = await manager.getActiveSymbols()
console.log(symbols)
// Output: [
//   { symbol: "R_50", display_name: "Volatility 50" },
//   { symbol: "R_100", display_name: "Volatility 100" },
//   ...
// ]
```

### Monitoring & Diagnostics

#### `getConnectionLogs(): ConnectionLog[]`
Get connection history (last 100 events).
```typescript
const logs = manager.getConnectionLogs()
logs.forEach(log => {
  console.log(`[${log.timestamp}] ${log.type}: ${log.message}`)
})
```

#### `onConnectionStatus(callback: Function): () => void`
Listen to connection status changes.
```typescript
const unsubscribe = manager.onConnectionStatus((status) => {
  console.log(`Connection status: ${status}`)
  // "connected" | "disconnected" | "reconnecting"
})

// Later, stop listening
unsubscribe()
```

---

## 🔄 Connection State Flow

```
START
  ↓
CONNECTING (notifyConnectionStatus → "reconnecting")
  ↓
✓ CONNECTED (notifyConnectionStatus → "connected")
  ↓
LISTENING (heartbeat checks, messages flow)
  ↓
[Error or Timeout]
  ↓
RECONNECTING (exponential backoff)
  ↓
[Loop back to CONNECTING]
  ↓
DISCONNECT (intentional)
  ↓
DISCONNECTED (notifyConnectionStatus → "disconnected")
```

---

## 💡 Common Use Cases

### Use Case 1: Monitor Symbol Prices
```typescript
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

async function monitorPrices() {
  const manager = DerivWebSocketManager.getInstance()
  
  // Connect
  await manager.connect()
  
  // Subscribe to multiple symbols
  const symbols = ["R_50", "R_100", "EURUSD"]
  const unsubscribers = []
  
  for (const symbol of symbols) {
    const unsub = await manager.subscribeTicks(symbol, (tick) => {
      console.log(`${tick.symbol}: ${tick.quote}`)
    })
    unsubscribers.push(unsub)
  }
  
  // Cleanup
  return () => {
    unsubscribers.forEach(fn => fn())
    manager.disconnect()
  }
}
```

### Use Case 2: React Hook
```typescript
import { useEffect, useState } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

export function useTicks(symbol: string) {
  const [ticks, setTicks] = useState([])
  const [status, setStatus] = useState("connecting")
  
  useEffect(() => {
    const manager = DerivWebSocketManager.getInstance()
    let unsubscribe: any
    
    const setup = async () => {
      try {
        // Connect
        if (!manager.isConnected()) {
          await manager.connect()
        }
        
        // Listen to connection status
        manager.onConnectionStatus((status) => {
          setStatus(status)
        })
        
        // Subscribe to ticks
        unsubscribe = await manager.subscribeTicks(symbol, (tick) => {
          setTicks(prev => [...prev.slice(-99), tick]) // Keep last 100
        })
      } catch (error) {
        console.error("Setup failed:", error)
      }
    }
    
    setup()
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [symbol])
  
  return { ticks, status }
}

// Usage
export function PriceMonitor() {
  const { ticks, status } = useTicks("R_50")
  
  return (
    <div>
      <p>Status: {status}</p>
      <p>Latest Price: {ticks[ticks.length - 1]?.quote}</p>
    </div>
  )
}
```

### Use Case 3: Custom Event Handling
```typescript
async function setupCustomHandling() {
  const manager = DerivWebSocketManager.getInstance()
  
  // Connect
  await manager.connect()
  
  // Handle all messages
  manager.on("*", (message) => {
    console.log("Message received:", message)
  })
  
  // Handle specific message types
  manager.on("tick", (data) => {
    console.log("Tick:", data)
  })
  
  manager.on("active_symbols", (data) => {
    console.log("Symbols:", data)
  })
  
  manager.on("error", (data) => {
    console.error("API Error:", data.error)
  })
  
  // Send request
  manager.send({
    active_symbols: "brief",
    product_type: "basic"
  })
}
```

---

## 🔍 Debugging & Diagnostics

### Enable Debug Logging
```typescript
// Access logs
const manager = DerivWebSocketManager.getInstance()
const logs = manager.getConnectionLogs()

// Filter by type
const errors = logs.filter(l => l.type === "error")
const warnings = logs.filter(l => l.type === "warning")
const infos = logs.filter(l => l.type === "info")

// Print formatted
logs.forEach(log => {
  console.log(`[${log.timestamp.toISOString()}] ${log.type}: ${log.message}`)
})
```

### Run Diagnostics
```typescript
import { WebSocketVerifier } from "@/lib/websocket-connection-verifier"

// Full diagnostic
const result = await WebSocketVerifier.runDiagnostics()
console.log(result)

// Monitor live
WebSocketVerifier.monitorConnection("R_50")

// Print logs
WebSocketVerifier.printLogs()

// Get formatted report
const report = await WebSocketVerifier.getDiagnosticsString()
console.log(report)
```

---

## ⚠️ Error Handling

### Connection Errors
```typescript
try {
  await manager.connect()
} catch (error) {
  console.error("Connection failed:", error.message)
  // Retry logic here if needed
}
```

### Message Errors
```typescript
manager.on("error", (response) => {
  if (response.error) {
    console.error("API Error:", response.error)
    // Handle based on error type
  }
})
```

### Stalled Connection
```typescript
// Automatically handled by manager
// If no messages for 30 seconds, auto-reconnects
// Heartbeat sent every 15 seconds

// You can listen to status changes
manager.onConnectionStatus((status) => {
  if (status === "reconnecting") {
    console.log("Connection was lost, reconnecting...")
  }
  if (status === "connected") {
    console.log("Connection restored!")
  }
})
```

---

## 🎯 Best Practices

### 1. Always Use Singleton
```typescript
// ✅ CORRECT
const manager = DerivWebSocketManager.getInstance()

// ❌ WRONG
const manager = new DerivWebSocketManager() // Don't do this!
```

### 2. Cleanup on Unmount
```typescript
useEffect(() => {
  const unsubscribe = await manager.subscribeTicks(symbol, callback)
  
  return () => {
    unsubscribe() // Always cleanup!
  }
}, [symbol])
```

### 3. Handle Connection Status
```typescript
manager.onConnectionStatus((status) => {
  switch (status) {
    case "connected":
      console.log("Ready to trade")
      break
    case "disconnected":
      console.log("Connection lost")
      break
    case "reconnecting":
      console.log("Attempting to reconnect...")
      break
  }
})
```

### 4. Check Before Sending
```typescript
if (manager.isConnected()) {
  manager.send(message)
} else {
  console.log("Not connected, will retry when ready")
  // Message queued automatically
}
```

### 5. Limit Log Storage
```typescript
// Logs are automatically limited to 100
// Check periodically to avoid memory issues
const logs = manager.getConnectionLogs()
if (logs.length > 50) {
  console.log("Many logs accumulated")
}
```

---

## 📊 Supported Symbols

Common trading symbols available via `getActiveSymbols()`:
- **Volatility**: R_50, R_100, R_200
- **Forex**: EURUSD, GBPUSD, AUDUSD
- **Commodities**: XAUUSD (Gold), XAGUSD (Silver)
- **Indices**: SPX500, NDX100, FTSE100

---

## 🚀 Performance Considerations

- **Heartbeat Interval**: 15 seconds (configurable in code)
- **Timeout Detection**: 30 seconds (configurable in code)
- **Max Logs**: 100 events (oldest pruned automatically)
- **Message Queue**: Unlimited (until connection restored)
- **Reconnect Delay**: 2s → 30s (exponential backoff)

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection timeout | Check internet, verify app_id is correct |
| No messages received | Check symbol is valid, verify subscription |
| Auto-reconnect not working | Check browser console for errors |
| Memory usage growing | Ensure subscriptions are cleaned up |
| Stale data | Check heartbeat is functioning |

---

## 📝 Example Application

```typescript
"use client"

import { useEffect, useState } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

export function TradingDashboard() {
  const [price, setPrice] = useState<number | null>(null)
  const [status, setStatus] = useState("connecting")
  const [lastDigit, setLastDigit] = useState<number | null>(null)

  useEffect(() => {
    const manager = DerivWebSocketManager.getInstance()
    let unsubscribe: any

    const setup = async () => {
      try {
        // Connect
        if (!manager.isConnected()) {
          await manager.connect()
        }

        // Monitor status
        const unsubscribeStatus = manager.onConnectionStatus((s) => {
          setStatus(s)
        })

        // Subscribe to ticks
        unsubscribe = await manager.subscribeTicks("R_50", (tick) => {
          setPrice(tick.quote)
          setLastDigit(tick.lastDigit)
        })

        return () => {
          unsubscribeStatus()
          unsubscribe?.()
        }
      } catch (error) {
        console.error("Setup error:", error)
        setStatus("error")
      }
    }

    const cleanup = setup()
    return () => cleanup?.()
  }, [])

  return (
    <div className="p-4 border rounded">
      <p className="text-sm text-gray-500">Status: {status}</p>
      <p className="text-2xl font-bold">${price?.toFixed(2)}</p>
      <p className="text-sm">Last Digit: {lastDigit}</p>
    </div>
  )
}
```

---

**Version**: 1.0  
**Last Updated**: January 31, 2026  
**Status**: Production Ready
