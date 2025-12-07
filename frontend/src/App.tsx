import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Bitcoin, Sun, Moon } from 'lucide-react'
import Home from './pages/Home'
import Create from './pages/Create'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MintInfoModal from './components/MintInfoModal'
import { statsApi, Stats } from './api'

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    statsApi.get().then((res) => {
      if (res.data) {
        setStats(res.data)
        if (res.data.bank_name) {
          document.title = res.data.bank_name
        }
      }
    })
  }, [])

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  return (
    <div className="relative min-h-screen bg-white dark:bg-dark-bg transition-colors duration-200">
      {/* Top left - Bitcoin conversion */}
      {stats && (
        <div title={"100,000,000 " + stats.coin_name + "s" + " = 1 Bitcoin"}
          className="absolute select-none cursor-pointer top-4 left-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span>100,000,000<span className="ml-1 select-none">{stats.coin_symbol}</span></span>
          <span>=</span>
          <span>1</span>
          <Bitcoin className="h-3.5 w-3.5" />
        </div>
      )}
      {/* Top right - Dark mode toggle & Mint info */}
      <div className="absolute top-4 right-4 flex items-center">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-400 hover:text-black dark:hover:text-dark-text transition-colors"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <MintInfoModal />
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App
