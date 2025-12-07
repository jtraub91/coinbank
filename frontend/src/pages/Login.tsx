import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn } from 'lucide-react'
import { accountsApi } from '../api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const res = await accountsApi.login(username, password)
    if (res.error) {
      setError(res.error)
      return
    }

    // Redirect to dashboard with user data
    navigate('/dashboard', {
      state: {
        username: res.data!.username,
        balance: res.data!.balance,
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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-black">Login</h1>
          <p className="mt-2 text-gray-600">
            Access your coinbank account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
              <p className="text-sm text-black">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-black">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            <LogIn className="h-5 w-5" />
            Login
          </button>
        </form>

        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/create" className="text-black underline hover:no-underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
