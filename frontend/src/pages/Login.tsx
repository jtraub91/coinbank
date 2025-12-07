import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn, Loader2 } from 'lucide-react'
import { accountsApi } from '../api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const stored = sessionStorage.getItem('userData')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        if (userData?.username) {
          navigate('/dashboard')
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const res = await accountsApi.login(username, password)
    if (res.error) {
      setError(res.error)
      setIsLoading(false)
      return
    }

    // Redirect to dashboard with user data
    navigate('/dashboard', {
      state: {
        username: res.data!.username,
        balance: res.data!.balance,
        bank_name: res.data!.bank_name,
        coin_name: res.data!.coin_name,
        coin_symbol: res.data!.coin_symbol
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-dark-text">Login</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Access your coinbank account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-gray-100 dark:bg-gray-900 border border-black dark:border-dark-border">
              <p className="text-sm text-black dark:text-dark-text">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-black dark:text-dark-text">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border text-black dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black dark:text-dark-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border text-black dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-black text-white dark:bg-dark-text dark:text-dark-bg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Login
              </>
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/create" className="text-black dark:text-dark-text underline hover:no-underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
