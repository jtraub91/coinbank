import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Bitcoin } from 'lucide-react'
import Home from './pages/Home'
import Create from './pages/Create'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MintInfoModal from './components/MintInfoModal'
import { statsApi, Stats } from './api'

function App() {
  const [stats, setStats] = useState<Stats | null>(null)

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

  return (
    <div className="relative min-h-screen">
      {/* Bitcoin conversion indicator */}
      {stats && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-gray-400">
          <span>100,000,000 {stats.coin_symbol}</span>
          <span>=</span>
          <span>1</span>
          <Bitcoin className="h-3.5 w-3.5" />
        </div>
      )}
      <MintInfoModal />
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
