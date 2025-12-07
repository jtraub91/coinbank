import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Copy, Check, Loader2, Zap, AlertCircle, Coins } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { transactionsApi } from '../api'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  coinSymbol: string
  onDeposit: (amount: number, newBalance: number) => void
}

type DepositMethod = 'lightning' | 'token'
type DepositStep = 'method' | 'amount' | 'invoice' | 'token' | 'success' | 'error' | 'expired'

const POLL_INTERVAL_MS = 3000 // Poll every 3 seconds

function DepositModal({ isOpen, onClose, coinSymbol, onDeposit }: DepositModalProps) {
  const [step, setStep] = useState<DepositStep>('method')
  const [amount, setAmount] = useState('')
  const [invoice, setInvoice] = useState('')
  const [quoteId, setQuoteId] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [newBalance, setNewBalance] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<number | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('method')
        setAmount('')
        setInvoice('')
        setQuoteId('')
        setExpiresAt(null)
        setReceivedAmount(0)
        setNewBalance(0)
        setCopied(false)
        setError('')
        setLoading(false)
        setTokenInput('')
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }, 200)
    }
  }, [isOpen])

  // Click outside to close (only when not loading/polling)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (step === 'method' || step === 'amount' || step === 'token' || step === 'success' || step === 'error' || step === 'expired') {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, step])

  // Poll for payment status when we have an invoice
  const checkPaymentStatus = useCallback(async () => {
    if (!quoteId) return

    try {
      const response = await fetch('/api/accounts/deposit/check/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quote_id: quoteId }),
      })
      const data = await response.json()
      console.log(data)
      if (data.paid) {
        // Payment received!
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setReceivedAmount(data.amount)
        setNewBalance(data.new_balance)
        setStep('success')
        onDeposit(data.amount, data.new_balance)
        // Trigger stats refresh
        window.dispatchEvent(new Event('stats-refresh'))
      } else if (data.expired) {
        // Invoice expired
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setStep('expired')
      }
    } catch (err) {
      console.error('Error checking payment status:', err)
    }
  }, [quoteId, onDeposit])

  // Start polling when we have an invoice
  useEffect(() => {
    if (step === 'invoice' && quoteId && !pollIntervalRef.current) {
      // Start polling
      pollIntervalRef.current = window.setInterval(checkPaymentStatus, POLL_INTERVAL_MS)
      // Also check immediately
      checkPaymentStatus()
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [step, quoteId, checkPaymentStatus])

  // Create deposit invoice
  const createInvoice = async () => {
    const amountNum = parseInt(amount, 10)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/accounts/deposit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: amountNum }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice')
      }

      setInvoice(data.invoice)
      setQuoteId(data.quote_id)
      setExpiresAt(new Date(data.expires_at))
      setReceivedAmount(amountNum)
      setStep('invoice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(invoice)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const truncateInvoice = (inv: string) => {
    if (inv.length <= 40) return inv
    return `${inv.slice(0, 20)}...${inv.slice(-20)}`
  }

  const handleBack = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setStep('method')
    setInvoice('')
    setQuoteId('')
    setAmount('')
    setTokenInput('')
    setError('')
  }

  // Redeem cashu token
  const redeemToken = async () => {
    if (!tokenInput.trim()) {
      setError('Please paste a cashu token')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await transactionsApi.redeemBearer(tokenInput.trim())
      
      if (res.error) {
        throw new Error(res.error)
      }

      if (res.data?.success) {
        setReceivedAmount(res.data.amount)
        setNewBalance(res.data.new_balance)
        setStep('success')
        onDeposit(res.data.amount, res.data.new_balance)
        window.dispatchEvent(new Event('stats-refresh'))
      } else {
        throw new Error('Failed to redeem token')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem token')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const selectMethod = (m: DepositMethod) => {
    setStep(m === 'lightning' ? 'amount' : 'token')
  }

  if (!isOpen) return null

  const getTitle = () => {
    switch (step) {
      case 'success': return 'Deposit Received!'
      case 'expired': return 'Invoice Expired'
      case 'error': return 'Error'
      case 'token': return 'Deposit Token'
      case 'amount': return 'Deposit Lightning'
      case 'invoice': return 'Pay Invoice'
      default: return 'Deposit'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white dark:bg-dark-surface border border-black dark:border-dark-border shadow-xl w-full max-w-md my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border/50">
          <h2 className="text-lg font-semibold dark:text-dark-text">{getTitle()}</h2>
          <button 
            onClick={onClose} 
            className="p-1 dark:hover:bg-dark"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-dark-muted text-center mb-2">Choose deposit method</p>
              <button
                onClick={() => selectMethod('lightning')}
                className="w-full flex items-center gap-3 px-4 py-4 border border-gray-300 dark:border-dark-border transition-colors"
              >
                <Zap className="h-6 w-6 text-gray-600 dark:text-dark-muted" />
                <div className="text-left">
                  <p className="font-medium dark:text-dark-text">Lightning</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Pay a Lightning invoice</p>
                </div>
              </button>
              <button
                onClick={() => selectMethod('token')}
                className="w-full flex items-center gap-3 px-4 py-4 border border-gray-300 dark:border-dark-border transition-colors"
              >
                <Coins className="h-6 w-6 text-gray-600 dark:text-dark-muted" />
                <div className="text-left">
                  <p className="font-medium dark:text-dark-text">Cashu Token</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Paste a cashu bearer token</p>
                </div>
              </button>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Amount ({coinSymbol})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to deposit"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-black dark:focus:border-white focus:outline-none"
                  min="1"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              )}

              <button
                onClick={createInvoice}
                disabled={loading || !amount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Generate Invoice
                  </>
                )}
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {step === 'token' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Cashu Token
                </label>
                <textarea
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste cashu token (cashuA... or cashuB...)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-black dark:focus:border-white focus:outline-none font-mono text-xs h-24 resize-none"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              )}

              <button
                onClick={redeemToken}
                disabled={loading || !tokenInput.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Coins className="h-5 w-5" />
                    Redeem Token
                  </>
                )}
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {step === 'invoice' && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="py-4">
                <div className="w-48 h-48 bg-white border-2 border-black flex items-center justify-center mx-auto p-2">
                  <QRCodeSVG value={invoice} size={176} level="M" />
                </div>
              </div>

              <p className="text-center text-sm text-gray-600 dark:text-dark-muted">
                Pay <span className="font-bold">{receivedAmount.toLocaleString()} {coinSymbol}</span>
              </p>

              {/* Invoice */}
              <div className="bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-gray-600 dark:text-dark-text break-all">
                    {truncateInvoice(invoice)}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                    title="Copy invoice"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-black dark:text-dark-text" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for payment...
              </div>

              {expiresAt && (
                <p className="text-xs text-gray-400 dark:text-dark-muted text-center">
                  Invoice expires at {expiresAt.toLocaleTimeString()}
                </p>
              )}

              <button
                onClick={handleBack}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-dark-bg border border-black dark:border-dark-border flex items-center justify-center">
                  <Check className="h-8 w-8 text-black dark:text-dark-text" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">Payment Received</p>
                <p className="text-3xl font-bold text-black dark:text-dark-text mt-2">
                  +{receivedAmount.toLocaleString()} {coinSymbol}
                </p>
                <p className="text-gray-500 dark:text-dark-muted text-sm mt-2">
                  New balance: {newBalance.toLocaleString()} {coinSymbol}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {step === 'expired' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-dark-bg border border-black dark:border-dark-border flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-gray-600 dark:text-dark-muted" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">Invoice Expired</p>
                <p className="text-gray-500 dark:text-dark-muted text-sm mt-2">
                  The invoice has expired. Please try again.
                </p>
              </div>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-dark-bg border border-black dark:border-dark-border flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-black dark:text-dark-text" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">Error</p>
                <p className="text-gray-500 dark:text-dark-muted text-sm mt-2">{error}</p>
              </div>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 bg-black text-white dark:bg-dark-text dark:text-dark-bg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DepositModal
