import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Download, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import SendModal, { SendData } from '../components/SendModal'
import DepositModal from '../components/DepositModal'
import WithdrawModal from '../components/WithdrawModal'
import { transactionsApi } from '../api'

interface UserData {
  username: string
  balance: number
  coin_name: string
  coin_symbol: string
  bank_name: string
}

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Try to get user data from location state first, then sessionStorage
  const getInitialUserData = (): UserData | null => {
    const stateData = location.state as UserData | null
    if (stateData) {
      // Save to sessionStorage for persistence
      sessionStorage.setItem('userData', JSON.stringify(stateData))
      return stateData
    }
    // Try sessionStorage
    const stored = sessionStorage.getItem('userData')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  }
  
  const [userData, setUserData] = useState<UserData | null>(getInitialUserData)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)

  // Fetch fresh user data from server on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/accounts/me/', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
          sessionStorage.setItem('userData', JSON.stringify(data))
        } else if (response.status === 401) {
          // Not authenticated, redirect to login
          sessionStorage.removeItem('userData')
          navigate('/login')
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    
    // Only fetch if we have initial data (meaning we're logged in)
    if (userData) {
      fetchUserData()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist userData changes to sessionStorage
  useEffect(() => {
    if (userData) {
      sessionStorage.setItem('userData', JSON.stringify(userData))
    }
  }, [userData])

  useEffect(() => {
    if (!userData) {
      navigate('/login')
    }
  }, [userData, navigate])

  if (!userData) {
    return null
  }

  const hasBalance = userData.balance > 0

  const handleSend = async (data: SendData): Promise<{ success: boolean; error?: string }> => {
    if (data.type === 'user') {
      const res = await transactionsApi.sendToUser({
        recipient_username: data.recipient,
        amount: data.amount,
      })
      if (res.error) {
        return { success: false, error: res.error }
      }
      // Update local balance
      if (res.data?.new_balance !== undefined) {
        setUserData(prev => prev ? { ...prev, balance: res.data!.new_balance! } : null)
        window.dispatchEvent(new Event('stats-refresh'))
      }
      return { success: true }
    }
    // For bitcoin/lightning sends, just simulate for now
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUserData(prev => prev ? { ...prev, balance: prev.balance - data.amount } : null)
    return { success: true }
  }

  const handleDeposit = async (_amount: number, newBalance: number) => {
    // Update balance from the deposit response
    setUserData(prev => prev ? { ...prev, balance: newBalance } : null)
  }

  const handleWithdraw = async (amount: number): Promise<{ success: boolean; token?: string; error?: string }> => {
    const res = await transactionsApi.withdrawBearer(amount)
    if (res.error) {
      return { success: false, error: res.error }
    }
    // Update local balance
    if (res.data?.new_balance !== undefined) {
      setUserData(prev => prev ? { ...prev, balance: res.data!.new_balance! } : null)
      window.dispatchEvent(new Event('stats-refresh'))
    }
    return { success: true, token: res.data?.token }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/"
            onClick={() => sessionStorage.removeItem('userData')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Logout
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">
            Welcome, {userData.username}!
          </h1>
          <p className="text-gray-600">
            Your account balance is
          </p>
          <p className="text-4xl font-bold text-black" title={userData.balance.toLocaleString() + " " + userData.coin_name + "s"}>
            <span>{userData.balance.toLocaleString()}</span>
            <span className="select-none">{userData.coin_symbol}</span>
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={() => setSendModalOpen(true)}
            disabled={!hasBalance}
            className={`flex items-center justify-center gap-3 w-full px-6 py-3 font-medium transition-colors ${
              hasBalance
                ? 'bg-black hover:bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={!hasBalance ? 'Deposit funds to enable sending' : undefined}
          >
            <Send className="h-5 w-5" />
            Send
          </button>
          <button
            onClick={() => setDepositModalOpen(true)}
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white hover:bg-gray-100 text-black border-black font-medium border border-black b-2 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Deposit
          </button>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            disabled={!hasBalance}
            className={`flex items-center justify-center gap-3 w-full px-6 py-3 font-medium border transition-colors ${
              hasBalance
                ? 'bg-white hover:bg-gray-100 text-black border-black'
                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            title={!hasBalance ? 'Deposit funds to enable withdrawals' : undefined}
          >
            <Download className="h-5 w-5" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Modals */}
      <SendModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        balance={userData.balance}
        coinName={userData.coin_name}
        coinSymbol={userData.coin_symbol}
        bankName={userData.bank_name}
        onSend={handleSend}
      />
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        coinSymbol={userData.coin_symbol}
        onDeposit={handleDeposit}
      />
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        balance={userData.balance}
        coinSymbol={userData.coin_symbol}
        onWithdraw={handleWithdraw}
      />
    </div>
  )
}

export default Dashboard
