import { useState, useRef, useEffect } from 'react'
import { X, User, Zap, ArrowLeft, Send, Loader2 } from 'lucide-react'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
  coinName: string
  coinSymbol: string
  bankName: string
  onSend: (data: SendData) => Promise<{ success: boolean; error?: string }>
}

export interface SendData {
  type: 'user' | 'lightning'
  recipient: string
  amount: number
}

type Step = 'choose' | 'user' | 'lightning'

function SendModal({ isOpen, onClose, balance, coinName, coinSymbol, bankName, onSend }: SendModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep('choose')
        setRecipient('')
        setAmount('')
        setError(null)
        setSuccess(false)
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
    if (!recipient || !amount) {
      setError('Please fill in all fields')
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

    const sendType = step === 'user' ? 'user' : 'lightning'
    const result = await onSend({
      type: sendType,
      recipient,
      amount: amountNum,
    })

    setLoading(false)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Failed to send')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white dark:bg-dark-surface border border-black dark:border-dark-border shadow-xl w-full max-w-md my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border/50">
          <div className="flex items-center gap-2">
            {step !== 'choose' && !success && (
              <button
                onClick={() => setStep('choose')}
                className="p-1 dark:hover:bg-dark"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
            )}
            <h2 className="text-lg font-semibold dark:text-dark-text">
              {success ? 'Sent!' : step === 'choose' ? 'Send' : step === 'user' ? 'Send to User' : 'Send to Lightning'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 dark:hover:bg-dark">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-dark-bg border border-black dark:border-dark-border flex items-center justify-center">
                  <Send className="h-8 w-8 text-black dark:text-dark-text" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">Payment Sent</p>
                <p className="text-gray-500 dark:text-dark-muted text-sm mt-1">
                  {amount} {coinSymbol} sent to {recipient}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors"
              >
                Done
              </button>
            </div>
          ) : step === 'choose' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-dark-muted mb-4">
                Choose how to send {coinName}s
              </p>
              <button
                onClick={() => setStep('user')}
                className="flex items-center gap-4 w-full p-4 border border-gray-200 dark:border-dark-border transition-colors text-left"
              >
                <div className="h-10 w-10 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600 dark:text-dark-muted" />
                </div>
                <div>
                  <p className="font-medium dark:text-dark-text">Send to {bankName} User</p>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">Send to another user by username</p>
                </div>
              </button>
              <button
                onClick={() => setStep('lightning')}
                className="flex items-center gap-4 w-full p-4 border border-gray-200 dark:border-dark-border transition-colors text-left"
              >
                <div className="h-10 w-10 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border flex items-center justify-center">
                  <Zap className="h-5 w-5 text-gray-600 dark:text-dark-muted" />
                </div>
                <div>
                  <p className="font-medium dark:text-dark-text">Send to Lightning</p>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">Send to a Lightning invoice or address</p>
                </div>
              </button>
            </div>
          ) : step === 'user' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Amount ({coinSymbol})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  max={balance}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:outline-none focus:border-black dark:focus:border-white"
                />
                <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">
                  Available: {balance.toLocaleString()} {coinSymbol}
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || !recipient || !amount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send to User
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Lightning Invoice or Address
                </label>
                <textarea
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="lnbc... or user@wallet.com"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:outline-none focus:border-black dark:focus:border-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Amount ({coinSymbol})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  max={balance}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:outline-none focus:border-black dark:focus:border-white"
                />
                <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">
                  Available: {balance.toLocaleString()} {coinSymbol}
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || !recipient || !amount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Send via Lightning
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

export default SendModal
