import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { accountsApi } from '../api'

function Create() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const createRes = await accountsApi.create(username, password)
    if (createRes.error) {
      setError(createRes.error)
      return
    }

    // Auto-login after account creation
    const loginRes = await accountsApi.login(username, password)
    if (loginRes.error) {
      // Account created but login failed
      navigate('/login')
      return
    }

    // Redirect to dashboard with user data
    navigate('/dashboard', {
      state: {
        username: loginRes.data!.username,
        balance: loginRes.data!.balance,
        coin_name: loginRes.data!.coin_name,
        coin_symbol: loginRes.data!.coin_symbol
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
          <h1 className="text-3xl font-bold text-black dark:text-dark-text">Create Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Set up your new coinbank account
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
              className="mt-1 block w-full px-4 py-3 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-black dark:text-dark-text placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white"
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
              className="mt-1 block w-full px-4 py-3 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-black dark:text-dark-text placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-black dark:text-dark-text">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-black dark:text-dark-text placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-black dark:text-dark-text underline hover:no-underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Create
