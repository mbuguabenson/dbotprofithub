"use client"

import { useEffect, useState } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_CONFIG } from "@/lib/deriv-config"

interface Balance {
  amount: number
  currency: string
}

interface Account {
  id: string
  type: "Demo" | "Real"
  currency: string
}

export function useDerivAuth() {
  const [token, setToken] = useState<string>("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [accountType, setAccountType] = useState<"Demo" | "Real" | null>(null)
  const [accountCode, setAccountCode] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeLoginId, setActiveLoginId] = useState<string | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [balanceSubscribed, setBalanceSubscribed] = useState(false)
  const manager = DerivWebSocketManager.getInstance()

  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Check for OAuth tokens in URL
    const urlParams = new URLSearchParams(window.location.search)
    const token1 = urlParams.get("token1")
    const acct1 = urlParams.get("acct1")
    
    if (token1) {
      console.log("[v0] 🔑 OAuth tokens detected in URL")
      localStorage.setItem("deriv_api_token", token1)
      if (acct1) localStorage.setItem("active_login_id", acct1)
      
      // Clean up URL without refreshing
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
      
      setToken(token1)
      connectWithToken(token1)
      return
    }

    // 2. Fallback to stored token
    const storedToken = localStorage.getItem("deriv_api_token")
    if (storedToken && storedToken.length > 10) {
      console.log("[v0] ✅ Existing API token found")
      setToken(storedToken)
      connectWithToken(storedToken)
    } else {
      console.log("[v0] ℹ️ No session found, user is guest")
      // We don't force the modal anymore, user can browse as guest
      // or click Login in the header
    }

    return () => {
      // Cleanup handled by manager
    }
  }, [])

  const connectWithToken = async (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      console.error("[v0] ❌ Invalid API token")
      return
    }

    console.log("[v0] 🔌 Connecting via manager...")
    await manager.connect()
    
    const authorizeHandler = (data: any) => {
      // 1. Handle Authorization Specific messages (Success or Error)
      if (data.msg_type === "authorize") {
        if (data.error) {
          console.error("[v0] ❌ Auth error:", data.error.message)
          if (data.error.code === "InvalidToken") {
            setShowTokenModal(true)
            setIsLoggedIn(false)
          }
          return
        }

        const { authorize } = data
        const accType = authorize.is_virtual ? "Demo" : "Real"
        const accCode = authorize.loginid || ""

        console.log("[v0] ✅ Authorized:", authorize.loginid, `(${accType})`)
        setAccountType(accType)
        setActiveLoginId(authorize.loginid)
        setAccountCode(accCode)
        setIsLoggedIn(true)
        setShowTokenModal(false)

        if (authorize.account_list && Array.isArray(authorize.account_list)) {
          const formatted = authorize.account_list.map((acc: any) => ({
            id: acc.loginid,
            type: acc.is_virtual ? "Demo" : "Real",
            currency: acc.currency,
          }))
          setAccounts(formatted)
        }

        if (!balanceSubscribed) {
          manager.send({ balance: 1, subscribe: 1 })
          setBalanceSubscribed(true)
          console.log("[v0] ✅ Balance subscription started")
        }
      }

      // 2. Handle Balance updates
      if (data.msg_type === "balance" && data.balance) {
        setBalance({
          amount: data.balance.balance,
          currency: data.balance.currency,
        })
      }
    }

    // Use a specific event for ticks if possible, but keep wildcard if necessary.
    // For Auth, we actually only care about authorize and balance messages.
    manager.on("authorize", authorizeHandler)
    manager.on("balance", authorizeHandler)
    
    // Initial authorization
    manager.send({ authorize: apiToken })
  }

  const submitApiToken = (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      alert("Please enter a valid API token (at least 10 characters)")
      return
    }

    localStorage.setItem("deriv_api_token", apiToken)
    setToken(apiToken)
    connectWithToken(apiToken)
  }

  const openTokenSettings = () => {
    setShowTokenModal(true)
  }

  const loginWithDeriv = () => {
    if (typeof window === "undefined") return

    const redirectUri = encodeURIComponent(`${window.location.origin}`)
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_CONFIG.APP_ID}&redirect_uri=${redirectUri}`

    console.log("[v0] 🔐 Initiating OAuth login...")
    window.location.href = oauthUrl
  }

  const requestLogin = () => {
    loginWithDeriv()
  }

  const handleApproval = () => {
    loginWithDeriv()
  }

  const cancelApproval = () => {
    setShowApprovalModal(false)
  }

  const logout = () => {
    if (typeof window === "undefined") return

    console.log("[v0] 👋 Logging out...")
    manager.send({ forget_all: ["balance", "ticks", "proposal_open_contract"] })
    
    localStorage.removeItem("deriv_api_token")
    localStorage.removeItem("deriv_token")
    localStorage.removeItem("deriv_account")
    setToken("")
    setIsLoggedIn(false)
    setBalance(null)
    setAccountType(null)
    setAccountCode("")
    setAccounts([])
    setActiveLoginId(null)
    setShowTokenModal(true)
    setBalanceSubscribed(false)
    console.log("[v0] ✅ Logged out successfully")
  }

  const switchAccount = (loginId: string) => {
    if (!token || !loginId || typeof window === "undefined") return

    console.log("[v0] 🔄 Switching to account:", loginId)
    manager.send({ authorize: token, loginid: loginId })
  }

  return {
    token,
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    loginWithDeriv,
    requestLogin,
    showApprovalModal,
    handleApproval,
    cancelApproval,
    logout,
    balance,
    accountType,
    accountCode,
    accounts,
    switchAccount,
    activeLoginId,
    showTokenModal,
    submitApiToken,
    openTokenSettings,
  }
}
