import { useState, useEffect } from 'react'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import { statsApi, Stats } from '../api'

function StatsFooter() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const response = await statsApi.get()
    if (response.data) {
      setStats(response.data)
    }
    setLoading(false)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 py-2 px-4">
        <div className="flex justify-center">
          <div className="animate-pulse text-sm text-gray-400">Loading stats...</div>
        </div>
      </footer>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 py-2 px-4">
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">Accounts:</span>
          <span className="font-medium text-gray-900">{formatNumber(stats.total_accounts)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-gray-400">Assets:</span>
          <span className="font-medium text-green-600">{formatNumber(stats.total_assets)} {stats.coin_symbol}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <span className="text-gray-400">Liabilities:</span>
          <span className="font-medium text-red-600">{formatNumber(stats.total_liabilities)} {stats.coin_symbol}</span>
        </div>
      </div>
    </footer>
  )
}

export default StatsFooter
