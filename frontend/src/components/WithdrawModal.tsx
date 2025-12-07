import { useState, useRef, useEffect } from 'react'
import { X, Loader2, Copy, Check, Banknote } from 'lucide-react'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
  coinSymbol: string
  onWithdraw: (amount: number) => Promise<{ success: boolean; token?: string; error?: string }>
}

function WithdrawModal({ isOpen, onClose, balance, coinSymbol, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bearerToken, setBearerToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => {
        setAmount('')
        setError(null)
        setBearerToken(null)
        setCopied(false)
      }, 200)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!amount) {
      setError('Please enter an amount')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amountNum > balance) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)
    setError(null)

    const result = await onWithdraw(amountNum)

    setLoading(false)

    if (result.success && result.token) {
      setBearerToken(result.token)
    } else {
      setError(result.error || 'Failed to withdraw')
    }
  }

  const copyToken = async () => {
    if (bearerToken) {
      await navigator.clipboard.writeText(bearerToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-dark-bg border border-black dark:border-dark-border shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-lg font-semibold dark:text-dark-text">
            {bearerToken ? 'Your Cash Token' : 'Withdraw'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {bearerToken ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-black p-4">
                <div className="flex gap-3">
                  <Banknote className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-black">
                      Treat this like cash!
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Anyone with this token can spend it. Keep it safe. There is no way to recover funds if lost.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 p-4">
                <div className="flex items-start justify-between gap-2">
                  <code className="text-xs font-mono text-gray-600 break-all flex-1">
                    {bearerToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="flex-shrink-0 p-2 hover:bg-gray-200 transition-colors"
                    title="Copy token"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Value: <span className="font-semibold">{amount} {coinSymbol}</span>
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Trade privately with others or redeem it back to your account.
              </p>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Withdraw as a bearer token you can trade or redeem later.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({coinSymbol})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  max={balance}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Available: {balance.toLocaleString()} {coinSymbol}
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !amount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Banknote className="h-5 w-5" />
                    Get Cash Token
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WithdrawModal
