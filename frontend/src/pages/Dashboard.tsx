import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Download } from 'lucide-react'
import { useEffect } from 'react'

interface UserData {
  username: string
  balance: number
  coin_name: string
  coin_symbol: string
}

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const userData = location.state as UserData | null

  useEffect(() => {
    if (!userData) {
      navigate('/login')
    }
  }, [userData, navigate])

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/"
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
            {userData.balance.toLocaleString()} {userData.coin_symbol}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <button
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            <Send className="h-5 w-5" />
            Send
          </button>
          <button
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-lg border border-black transition-colors"
          >
            <Download className="h-5 w-5" />
            Withdraw
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
