import { useState, useRef, useEffect } from 'react'
import { X, User, Bitcoin, Zap, ArrowLeft, Send, Loader2 } from 'lucide-react'

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
  type: 'user' | 'bitcoin' | 'lightning'
  recipient: string
  amount: number
}

type Step = 'choose' | 'user' | 'bitcoin'

function SendModal({ isOpen, onClose, balance, coinName, coinSymbol, bankName, onSend }: SendModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [addressType, setAddressType] = useState<'bitcoin' | 'lightning'>('bitcoin')
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

    const sendType = step === 'user' ? 'user' : addressType
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

  const isLightningAddress = recipient.toLowerCase().startsWith('lnbc') || recipient.includes('@')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div
        ref={modalRef}
        className="bg-white border border-black shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step !== 'choose' && !success && (
              <button
                onClick={() => setStep('choose')}
                className="p-1 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {success ? 'Sent!' : step === 'choose' ? 'Send' : step === 'user' ? 'Send to User' : 'Send to Bitcoin'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-gray-100 border border-black flex items-center justify-center">
                  <Send className="h-8 w-8 text-black" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">Payment Sent</p>
                <p className="text-gray-500 text-sm mt-1">
                  {amount} {coinSymbol} sent to {recipient}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : step === 'choose' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Choose how to send {coinName}s
              </p>
              <button
                onClick={() => setStep('user')}
                className="flex items-center gap-4 w-full p-4 border border-gray-200 hover:border-black hover:bg-gray-50 transition-colors text-left"
              >
                <div className="h-10 w-10 bg-gray-100 border border-gray-300 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">Send to {bankName} User</p>
                  <p className="text-sm text-gray-500">Send to another user by username</p>
                </div>
              </button>
              <button
                onClick={() => setStep('bitcoin')}
                className="flex items-center gap-4 w-full p-4 border border-gray-200 hover:border-black hover:bg-gray-50 transition-colors text-left"
              >
                <div className="h-10 w-10 bg-gray-100 border border-gray-300 flex items-center justify-center">
                  <Bitcoin className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="font-medium">Send to Bitcoin Address</p>
                  <p className="text-sm text-gray-500">Send to on-chain or Lightning address</p>
                </div>
              </button>
            </div>
          ) : step === 'user' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
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
                disabled={loading || !recipient || !amount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitcoin or Lightning Address
                </label>
                <textarea
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value)
                    // Auto-detect address type
                    const val = e.target.value.toLowerCase()
                    if (val.startsWith('lnbc') || val.includes('@')) {
                      setAddressType('lightning')
                    } else {
                      setAddressType('bitcoin')
                    }
                  }}
                  placeholder="bc1... or lnbc... or user@wallet.com"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black font-mono text-sm"
                />
                {recipient && (
                  <div className="flex items-center gap-1 mt-1">
                    {isLightningAddress ? (
                      <Zap className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <Bitcoin className="h-3 w-3 text-orange-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {isLightningAddress ? 'Lightning' : 'On-chain'} address detected
                    </span>
                  </div>
                )}
              </div>
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
                disabled={loading || !recipient || !amount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isLightningAddress ? (
                      <Zap className="h-5 w-5" />
                    ) : (
                      <Bitcoin className="h-5 w-5" />
                    )}
                    Send via {isLightningAddress ? 'Lightning' : 'Bitcoin'}
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
