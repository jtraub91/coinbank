import { useState, useEffect } from 'react'
import { Bitcoin, Wallet as WalletIcon, Upload, Send, Download } from 'lucide-react'

interface WalletData {
  tokens: string[]  // Array of cashu token strings
  createdAt: string
}

const WALLET_STORAGE_KEY = 'coinbank_wallet'

function getStoredWallet(): WalletData | null {
  const stored = localStorage.getItem(WALLET_STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function createWallet(): WalletData {
  const wallet: WalletData = {
    tokens: [],
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet))
  return wallet
}

function Wallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Check for existing wallet on mount
  useEffect(() => {
    const stored = getStoredWallet()
    if (stored) {
      setWallet(stored)
    }
    setIsInitialized(true)
  }, [])

  const handleCreateWallet = () => {
    const newWallet = createWallet()
    setWallet(newWallet)
  }

  const handleImportWallet = () => {
    // TODO: Implement import functionality
    console.log('Import wallet')
  }

  // Calculate balance from tokens (placeholder - will integrate with cashu-ts)
  const balance = 0 // TODO: Parse tokens and sum amounts

  // Don't render until we've checked localStorage
  if (!isInitialized) {
    return null
  }

  // Show wallet balance view if wallet exists
  if (wallet) {
    const hasBalance = balance > 0

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-black dark:text-dark-text">
              Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Balance
            </p>
            <p className="text-4xl font-bold text-black dark:text-dark-text" title={balance.toLocaleString() + " sats"}>
              <span>{balance.toLocaleString()}</span>
              <span className="ml-1 text-lg select-none">sats</span>
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button
              disabled={!hasBalance}
              className={`flex items-center justify-center gap-3 w-full px-6 py-3 font-medium transition-colors ${
                hasBalance
                  ? 'bg-black text-white dark:bg-dark-text dark:text-dark-bg'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
              title={!hasBalance ? 'Deposit funds to enable sending' : undefined}
            >
              <Send className="h-5 w-5" />
              Send
            </button>
            <button
              className="flex items-center justify-center gap-3 w-full px-6 py-3 font-medium border bg-white dark:bg-dark-surface text-black dark:text-dark-text border-black dark:border-dark-border transition-colors"
            >
              <Download className="h-5 w-5" />
              Receive
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show create/import view if no wallet
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Bitcoin className="h-16 w-16 text-black dark:text-dark-text" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-dark-text select-none">
            coinbank
          </h1>
        </div>

        <div className="space-y-4 pt-8">
          <button
            onClick={handleCreateWallet}
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-black text-white dark:bg-dark-text dark:text-dark-bg font-medium transition-colors"
          >
            <WalletIcon className="h-5 w-5" />
            Create a new wallet
          </button>
          <button
            onClick={handleImportWallet}
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white dark:bg-dark-surface text-black dark:text-dark-text font-medium border border-black dark:border-dark-border transition-colors"
          >
            <Upload className="h-5 w-5" />
            Import a wallet backup
          </button>
        </div>
      </div>
    </div>
  )
}

export default Wallet
