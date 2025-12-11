import { useEffect, useState } from 'react'
import { Bitcoin, Sun, Moon } from 'lucide-react'
import Wallet from './pages/Wallet'
import MintInfoModal from './components/MintInfoModal'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

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
      <div title="100,000,000 sats = 1 Bitcoin"
        className="absolute select-none cursor-pointer top-4 left-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span>100,000,000<span className="ml-1 select-none">sats</span></span>
        <span>=</span>
        <span>1</span>
        <Bitcoin className="h-3.5 w-3.5" />
      </div>
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
      <Wallet />
    </div>
  )
}

export default App
