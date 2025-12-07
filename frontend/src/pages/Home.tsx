import { Link } from 'react-router-dom'
import { Bitcoin, UserPlus, LogIn } from 'lucide-react'
import MintInfoModal from '../components/MintInfoModal'
import StatsFooter from '../components/StatsFooter'

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <MintInfoModal />
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Bitcoin className="h-16 w-16 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-black">
            coinbank
          </h1>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            to="/create"
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Create new account
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-lg border border-black transition-colors"
          >
            <LogIn className="h-5 w-5" />
            Login with existing account
          </Link>
        </div>
      </div>
      <StatsFooter />
    </div>
  )
}

export default Home
