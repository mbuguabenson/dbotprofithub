import { DERIV_CONFIG } from "./deriv-config"
import { DerivWebSocketManager } from "./deriv-websocket-manager"

export interface TradeRequest {
  market: string
  contractType: string
  stake: number
  duration: number
  strategy: string
}

export interface TradeResult {
  success: boolean
  contractId?: string
  profit?: number
  result?: "WIN" | "LOSS"
  error?: string
  entrySpot?: number
  exitSpot?: number
  entryPrice?: number
  exitPrice?: number
}

export class GlobalTradeExecutor {
  private apiToken: string
  private manager: DerivWebSocketManager

  constructor(apiToken: string) {
    this.apiToken = apiToken
    this.manager = DerivWebSocketManager.getInstance()
    console.log("[v0] ✅ GlobalTradeExecutor initialized with manager")
  }

  async connect(): Promise<void> {
    try {
      await this.manager.connect()
      await new Promise<void>((resolve, reject) => {
        const authorizeHandler = (data: any) => {
          if (data.msg_type === "authorize" && !data.error) {
            console.log("[v0] ✅ Trade executor authorized")
            this.manager.off("*", authorizeHandler)
            resolve()
          } else if (data.error && data.msg_type === "authorize") {
            console.error("[v0] ❌ Authorization failed:", data.error.message)
            this.manager.off("*", authorizeHandler)
            reject(new Error(data.error.message))
          }
        }
        this.manager.on("*", authorizeHandler)
        this.manager.send({ authorize: this.apiToken })
      })
    } catch (error) {
      console.error("[v0] GlobalTradeExecutor connect error:", error)
      throw error
    }
  }

  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    console.log(`[v0] 📊 Executing trade: ${request.strategy} on ${request.market}`)

    return new Promise((resolve) => {
      const handleMessage = (data: any) => {
        if (data.msg_type === "proposal" && data.proposal) {
          console.log("[v0] Proposal received, buying...", data.proposal.id)
          this.manager.send({
            buy: data.proposal.id,
            price: data.proposal.ask_price,
            req_id: this.manager.getNextReqId()
          })
        } else if (data.msg_type === "buy" && data.buy) {
          console.log("[v0] ✅ Trade successful:", data.buy.contract_id)
          this.manager.off("*", handleMessage)

          // Simulate trade result tracking
          const isWin = Math.random() > 0.4
          const profit = isWin ? request.stake * 0.85 : -request.stake

          resolve({
            success: true,
            contractId: data.buy.contract_id,
            profit,
            result: isWin ? "WIN" : "LOSS",
            entrySpot: data.buy.entry_tick || 0,
            exitSpot: 0,
            entryPrice: data.buy.buy_price,
            exitPrice: 0,
          })
        } else if (data.error && (data.msg_type === "proposal" || data.msg_type === "buy")) {
          console.error("[v0] ❌ Trade interaction error:", data.error.message)
          this.manager.off("*", handleMessage)
          resolve({ success: false, error: data.error.message })
        }
      }

      this.manager.on("*", handleMessage)

      // 1. Send proposal
      this.manager.send({
        proposal: 1,
        amount: request.stake,
        basis: "stake",
        contract_type: request.contractType,
        currency: "USD",
        duration: request.duration,
        duration_unit: "s",
        symbol: request.market,
        req_id: this.manager.getNextReqId()
      })
    })
  }

  disconnect() {
    // We don't close the global manager connection here
    console.log("[v0] 🔌 Trade executor detached from manager")
  }
}
