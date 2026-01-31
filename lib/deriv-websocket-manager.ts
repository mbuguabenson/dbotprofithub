"use client"

type MessageHandler = (message: any) => void

interface TickData {
  quote: number
  lastDigit: number
  epoch: number
  symbol: string
  id?: string
}

interface ConnectionLog {
  type: "info" | "error" | "warning"
  message: string
  timestamp: Date
}

import { DERIV_CONFIG } from "./deriv-config"

// ... imports

/**
 * Unified Deriv WebSocket Manager - Single source of truth for all WebSocket operations
 * Handles connection, reconnection, message routing, and subscription management
 */
export class DerivWebSocketManager {
  private static instance: DerivWebSocketManager | null = null
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 2000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastMessageTime = Date.now()
  private messageQueue: any[] = []
  private subscriptions: Map<string, string> = new Map()
  private subscriptionRefCount: Map<string, number> = new Map()
  private connectionPromise: Promise<void> | null = null
  private reqIdCounter = 1000

  public getNextReqId(): number {
    return ++this.reqIdCounter;
  }
  private connectionLogs: ConnectionLog[] = []
  private maxLogs = 100
  private readonly appId = DERIV_CONFIG.APP_ID
  private readonly wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_CONFIG.APP_ID}`

  private constructor() {}

  public static getInstance(): DerivWebSocketManager {
    if (!DerivWebSocketManager.instance) {
      DerivWebSocketManager.instance = new DerivWebSocketManager()
    }
    return DerivWebSocketManager.instance
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.log("info", "WebSocket already connected")
        return Promise.resolve()
      }
      if (this.connectionPromise) {
        return this.connectionPromise
      }
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log("[v0] Connecting to Deriv WebSocket:", this.wsUrl)
        this.log("info", "Initiating WebSocket connection")
        this.notifyConnectionStatus("reconnecting")

        this.ws = new WebSocket(this.wsUrl)

        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.error("[v0] WebSocket connection timeout")
            this.log("error", "Connection timeout after 10 seconds")
            this.ws?.close()
            this.connectionPromise = null
            this.notifyConnectionStatus("disconnected")
            reject(new Error("Connection timeout"))
          }
        }, 10000)

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log("[v0] WebSocket connected successfully")
          this.log("info", "WebSocket connected successfully")
          this.reconnectAttempts = 0
          this.lastMessageTime = Date.now()
          this.notifyConnectionStatus("connected")
          this.startHeartbeat()
          this.processMessageQueue()
          this.connectionPromise = null
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            this.lastMessageTime = Date.now()
            const message = JSON.parse(event.data)
            this.routeMessage(message)
          } catch (error) {
            console.error("[v0] Failed to parse message:", error)
            this.log("error", `Failed to parse message: ${error}`)
          }
        }

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          console.error("[v0] WebSocket error:", error)
          this.log("error", `WebSocket error: ${error}`)
          this.connectionPromise = null
          this.notifyConnectionStatus("disconnected")
          reject(error)
        }

        this.ws.onclose = () => {
          clearTimeout(connectionTimeout)
          console.log("[v0] WebSocket closed, attempting reconnect...")
          this.log("warning", "WebSocket closed, reconnecting...")
          
          if (this.connectionPromise) {
            // Rejection will only trigger if it hasn't resolved yet
            reject(new Error("WebSocket closed during connection attempt"))
          }
          
          this.connectionPromise = null
          this.stopHeartbeat()
          this.notifyConnectionStatus("disconnected")
          this.handleReconnect()
        }
      } catch (error) {
        console.error("[v0] Connection setup error:", error)
        this.log("error", `Connection setup error: ${error}`)
        this.connectionPromise = null
        this.notifyConnectionStatus("disconnected")
        reject(error)
      }
    })

    return this.connectionPromise
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log("error", "Max reconnection attempts reached, resetting counter")
      setTimeout(() => {
        this.reconnectAttempts = 0
        this.log("info", "Reconnection counter reset, will attempt again")
        this.handleReconnect()
      }, 60000)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
    console.log(`[v0] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    this.log("info", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[v0] Reconnection failed:", error)
        this.log("error", `Reconnection failed: ${error}`)
      })
    }, delay)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime

      if (timeSinceLastMessage > 30000) {
        console.warn("[v0] No messages received for 30 seconds, reconnecting...")
        this.log("warning", "No messages for 30 seconds, reconnecting")
        this.ws?.close()
        return
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.send({ ping: 1, req_id: this.getNextReqId() })
        } catch (error) {
          console.error("[v0] Heartbeat ping failed:", error)
          this.log("error", `Heartbeat ping failed: ${error}`)
        }
      }
    }, 15000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.ws.send(JSON.stringify(message))
    }
  }

  public send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.log("[v0] WebSocket not ready, queueing message")
      this.log("info", "Message queued - WebSocket not ready")
      this.messageQueue.push(message)
    }
  }

  private pendingRequests: Map<number, (data: any) => void> = new Map()

  private routeMessage(message: any) {
    try {
      this.lastMessageTime = Date.now()

      // 1. Resolve pending request-response patterns first
      if (message.req_id) {
        const callback = this.pendingRequests.get(message.req_id)
        if (callback) {
          // Note: We don't delete yet if it's a subscription response to allow it to pass through
          // but for standard requests, we resolve them here.
          // Actually, standard requests should be deleted.
          // Subscriptions are handled by msg_type handlers or wildcard.
          // Let's check if it's an error. Errors should always resolve the request.
          if (message.error || !message.subscription) {
              this.pendingRequests.delete(message.req_id)
          }
          callback(message)
          // If resolved by callback, we still allow msg_type routing for legacy support
          // but we might want to return early if it's a pure request-response.
        }
      }

      // 2. Route by message type
      if (message.msg_type) {
        const handlers = this.messageHandlers.get(message.msg_type) || []
        handlers.forEach((handler) => handler(message))
      }

      // 3. Special handling for legacy keys if msg_type is missing
      if (!message.msg_type) {
          if (message.tick) (this.messageHandlers.get('tick') || []).forEach(h => h(message));
          if (message.proposal) (this.messageHandlers.get('proposal') || []).forEach(h => h(message));
          if (message.buy) (this.messageHandlers.get('buy') || []).forEach(h => h(message));
      }

      // 4. Global error handling (only if not handled by a specific request)
      if (message.error) {
        // Only log/emit global error if it wasn't a targeted request-response error
        // or if explicitly desired. For now, let's keep it but make it quieter.
        const handlers = this.messageHandlers.get("error") || []
        handlers.forEach((handler) => handler(message))
      }

      // 5. Route to wildcard handlers
      const wildcardHandlers = this.messageHandlers.get("*") || []
      wildcardHandlers.forEach((handler) => handler(message))
    } catch (error) {
      console.error("[v0] Error routing message:", error)
      this.log("error", `Error routing message: ${error}`)
    }
  }

  /**
   * Send a message and wait for its specific response using req_id
   */
  public async sendAndWait(message: any, timeoutMs = 15000): Promise<any> {
      const req_id = message.req_id || this.getNextReqId();
      const payload = { ...message, req_id };

      return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
              this.pendingRequests.delete(req_id);
              reject(new Error(`Request ${req_id} timed out after ${timeoutMs}ms`));
          }, timeoutMs);

          this.pendingRequests.set(req_id, (data: any) => {
              clearTimeout(timeout);
              if (data.error) {
                  reject(data.error);
              } else {
                  resolve(data);
              }
          });

          this.send(payload);
      });
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, [])
    }
    this.messageHandlers.get(event)!.push(handler)
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private symbolToSubscriptionMap: Map<string, string> = new Map() // symbol -> ID
  private activeSubscriptions: Set<string> = new Set() // Track symbols currently being subscribed to prevent race conditions

  public async subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
    // 1. Check if already subscribed to this symbol
    const existingId = this.symbolToSubscriptionMap.get(symbol)
    if (existingId) {
      // Already subscribed, increment ref count and register the callback
      const currentRef = this.subscriptionRefCount.get(existingId) || 0
      this.subscriptionRefCount.set(existingId, currentRef + 1)
      
      console.log(`[v0] Reusing existing subscription for ${symbol}: ${existingId} (Refs: ${currentRef + 1})`)
      this.on("tick", (message: any) => {
          if (message.tick && message.tick.symbol === symbol) {
              const quote = message.tick.quote
              callback({
                  quote,
                  lastDigit: this.extractLastDigit(quote),
                  epoch: message.tick.epoch,
                  symbol: message.tick.symbol,
                  id: existingId
              })
          }
      })
      return existingId
    }

    // 2. Prevent concurrent duplicate subscription requests
    if (this.activeSubscriptions.has(symbol)) {
        console.log(`[v0] Subscription in progress for ${symbol}, waiting...`)
        return new Promise((resolve) => {
            const check = setInterval(() => {
                const id = this.symbolToSubscriptionMap.get(symbol)
                if (id) {
                    clearInterval(check)
                    this.subscribeTicks(symbol, callback).then(resolve)
                }
            }, 500)
        })
    }

    this.activeSubscriptions.add(symbol)
    const requestId = this.getNextReqId()
    let subscriptionId: string | null = null

    const handler = (message: any) => {
      // Capture the subscription ID from the initial response
      if (message.req_id === requestId && message.subscription) {
        subscriptionId = message.subscription.id
        if (subscriptionId) {
          this.subscriptions.set(subscriptionId, symbol)
          this.symbolToSubscriptionMap.set(symbol, subscriptionId)
          this.subscriptionRefCount.set(subscriptionId, 1) // Initial ref count
          this.activeSubscriptions.delete(symbol)
        }
        return
      }

      // Handle subsequent ticks using the captured subscription ID
      if (message.tick && message.subscription?.id === subscriptionId) {
        const quote = message.tick.quote
        const lastDigit = this.extractLastDigit(quote)

        callback({
          quote,
          lastDigit,
          epoch: message.tick.epoch,
          symbol: message.tick.symbol,
          id: subscriptionId || undefined
        })
      }
    }

    this.on("tick", handler)

    this.send({
      ticks: symbol,
      subscribe: 1,
      req_id: requestId,
    })

    return new Promise((resolve) => {
      const checkId = setInterval(() => {
        if (subscriptionId) {
          clearInterval(checkId)
          resolve(subscriptionId)
        }
      }, 100)
      
      setTimeout(() => {
        clearInterval(checkId)
        if (!subscriptionId) {
            this.activeSubscriptions.delete(symbol)
            resolve("") 
        }
      }, 5000)
    })
  }

  public extractLastDigit(quote: number): number {
    const quoteStr = quote.toString().replace(".", "")
    const lastChar = quoteStr[quoteStr.length - 1]
    const digit = Number.parseInt(lastChar, 10)

    if (isNaN(digit)) return 0
    return digit
  }

  public async unsubscribe(subscriptionId: string) {
    if (!subscriptionId || subscriptionId.length < 32) {
      console.warn("[v0] Skipping invalid subscription ID for forget:", subscriptionId)
      return
    }

    const currentRef = this.subscriptionRefCount.get(subscriptionId) || 1
    if (currentRef > 1) {
        this.subscriptionRefCount.set(subscriptionId, currentRef - 1)
        console.log(`[v0] Decremented ref count for ${subscriptionId}. Remaining: ${currentRef - 1}`)
        return
    }

    // Actually unsubscribe when ref count hits 1 (and we are about to delete it)
    const symbol = this.subscriptions.get(subscriptionId)
    if (symbol) {
        this.symbolToSubscriptionMap.delete(symbol)
    }
    this.send({ forget: subscriptionId, req_id: this.getNextReqId() })
    this.subscriptions.delete(subscriptionId)
    this.subscriptionRefCount.delete(subscriptionId)
    this.log("info", `Unsubscribed from ${subscriptionId} (${symbol || 'unknown symbol'})`)
  }

  public async unsubscribeAll() {
    this.send({ forget_all: ["ticks", "candles"], req_id: this.getNextReqId() })
    this.subscriptions.clear()
    this.log("info", "Unsubscribed from all subscriptions")
  }

  public async getActiveSymbols(): Promise<Array<{ symbol: string; display_name: string; market?: string; market_display_name?: string }>> {
    return new Promise((resolve, reject) => {
      const requestId = this.getNextReqId()
      const timeout = setTimeout(() => {
        this.off("*", handler)
        console.warn("[v0] getActiveSymbols timeout, using default symbols")
        this.log("warning", "getActiveSymbols timeout, using defaults")
        // Return default symbols if timeout
        resolve([
          { symbol: "R_50", display_name: "Volatility 50", market: "synthetic_index", market_display_name: "Volatility Indices" },
          { symbol: "R_100", display_name: "Volatility 100", market: "synthetic_index", market_display_name: "Volatility Indices" },
          { symbol: "EURUSD", display_name: "EUR/USD", market: "forex", market_display_name: "Forex" },
          { symbol: "GBPUSD", display_name: "GBP/USD", market: "forex", market_display_name: "Forex" },
          { symbol: "USDJPY", display_name: "USD/JPY", market: "forex", market_display_name: "Forex" },
        ])
      }, 10000)

      const handler = (message: any) => {
        if (message.active_symbols && Array.isArray(message.active_symbols) && message.req_id === requestId) {
          clearTimeout(timeout)
          this.off("*", handler)
          console.log("[v0] Active symbols received:", message.active_symbols.length)
          this.log("info", `Received ${message.active_symbols.length} active symbols`)
          resolve(
            message.active_symbols.map((s: any) => ({
              symbol: s.symbol,
              display_name: s.display_name,
              market: s.market,
              market_display_name: s.market_display_name
            })),
          )
        } else if (message.error && message.req_id === requestId) {
          clearTimeout(timeout)
          this.off("*", handler)
          console.error("[v0] Active symbols error:", JSON.stringify(message.error, null, 2))
          this.log("error", `Active symbols error: ${JSON.stringify(message.error)}`)
          // Still return defaults on error
          resolve([
            { symbol: "R_50", display_name: "Volatility 50", market: "synthetic_index", market_display_name: "Volatility Indices" },
            { symbol: "R_100", display_name: "Volatility 100", market: "synthetic_index", market_display_name: "Volatility Indices" },
            { symbol: "EURUSD", display_name: "EUR/USD", market: "forex", market_display_name: "Forex" },
            { symbol: "GBPUSD", display_name: "GBP/USD", market: "forex", market_display_name: "Forex" },
            { symbol: "USDJPY", display_name: "USD/JPY", market: "forex", market_display_name: "Forex" },
          ])
        }
      }

      this.on("*", handler)
      
      if (!this.isConnected()) {
        clearTimeout(timeout)
        console.warn("[v0] WebSocket not connected, cannot fetch active symbols")
        this.log("warning", "WebSocket not connected")
        reject(new Error("WebSocket not connected"))
        return
      }

      this.send({
        active_symbols: "brief",
        product_type: "basic",
        req_id: requestId,
      })
    })
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  public disconnect() {
    this.stopHeartbeat()
    this.unsubscribeAll()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.log("info", "Disconnected from WebSocket")
  }

  private log(type: "info" | "error" | "warning", message: string) {
    const log: ConnectionLog = {
      type,
      message,
      timestamp: new Date(),
    }
    this.connectionLogs.push(log)

    if (this.connectionLogs.length > this.maxLogs) {
      this.connectionLogs.shift()
    }
  }

  public getConnectionLogs(): ConnectionLog[] {
    return [...this.connectionLogs]
  }

  private connectionStatusListeners: Set<(status: "connected" | "disconnected" | "reconnecting") => void> = new Set()

  public onConnectionStatus(callback: (status: "connected" | "disconnected" | "reconnecting") => void): () => void {
    this.connectionStatusListeners.add(callback)
    return () => {
      this.connectionStatusListeners.delete(callback)
    }
  }

  private notifyConnectionStatus(status: "connected" | "disconnected" | "reconnecting") {
    this.connectionStatusListeners.forEach((callback) => callback(status))
  }

  public static subscribe(symbol: string, callback: (data: any) => void): () => void {
    const instance = DerivWebSocketManager.getInstance()
    let subscriptionId: string | null = null

    // Connect if not already connected
    if (!instance.isConnected()) {
      instance.connect().catch((err: any) => {
        console.error("[v0] Failed to connect for subscription:", err)
      })
    }

    // Subscribe to ticks
    instance
      .subscribeTicks(symbol, callback)
      .then((id: string) => {
        subscriptionId = id
        console.log("[v0] Subscribed to", symbol, "with ID:", id)
      })
      .catch((err: any) => {
        console.error("[v0] Subscription failed:", err)
      })

    // Return unsubscribe function
    return () => {
      if (subscriptionId) {
        instance.unsubscribe(subscriptionId)
        console.log("[v0] Unsubscribed from", symbol)
      }
    }
  }
}

export const derivWebSocket = DerivWebSocketManager.getInstance()
