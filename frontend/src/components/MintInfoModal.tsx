import { useState, useEffect, useRef } from 'react'
import { Info, X, Mail, Globe, MessageCircle, Copy, Check } from 'lucide-react'
import { mintApi, MintInfo, statsApi, Stats } from '../api'

function MintInfoModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mintInfo, setMintInfo] = useState<MintInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !mintInfo) {
      fetchData()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    const [mintResponse, statsResponse] = await Promise.all([
      mintApi.info(),
      statsApi.get()
    ])
    if (mintResponse.error) {
      setError(mintResponse.error)
    } else if (mintResponse.data) {
      setMintInfo(mintResponse.data)
    }
    if (statsResponse.data) {
      setStats(statsResponse.data)
    }
    setLoading(false)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getContactIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'twitter':
      case 'nostr':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const truncatePubkey = (pubkey: string) => {
    if (pubkey.length <= 16) return pubkey
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
  }

  const reserves = stats && stats.total_liabilities > 0 
    ? (stats.total_liabilities) : '0'

  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-black transition-colors"
        aria-label="Mint Information"
      >
        <Info className="h-5 w-5" />
      </button>

      {isOpen && (
        <div 
          ref={modalRef}
          className="absolute top-10 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-80"
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {mintInfo && stats && !loading && (
            <div className="divide-y divide-gray-100">
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mintInfo.icon_url && (
                    <img
                      src={mintInfo.icon_url}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{mintInfo.name || 'Mint'}</p>
                    {mintInfo.version && (
                      <p className="text-xs text-gray-400">v{mintInfo.version}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Stats */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Accounts</p>
                  <p className="text-lg font-semibold">{stats.total_accounts.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Reserves</p>
                  <p className="text-lg font-semibold">{reserves} {stats.coin_symbol}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Assets</p>
                  <p className="text-sm font-medium">{stats.total_assets.toLocaleString()} {stats.coin_symbol}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Liabilities</p>
                  <p className="text-sm font-medium">{stats.total_liabilities.toLocaleString()} {stats.coin_symbol}</p>
                </div>
              </div>

              {/* Description */}
              {mintInfo.description && (
                <div className="p-4">
                  <p className="text-xs text-gray-500">{mintInfo.description}</p>
                </div>
              )}

              {/* Pubkey */}
              {mintInfo.pubkey && (
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Public Key</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-gray-600">
                      {truncatePubkey(mintInfo.pubkey)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(mintInfo.pubkey!, 'pubkey')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {copiedField === 'pubkey' ? (
                        <Check className="h-3 w-3 text-black" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Contact */}
              {mintInfo.contact && mintInfo.contact.length > 0 && (
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-2">Contact</p>
                  <div className="space-y-1">
                    {mintInfo.contact.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {getContactIcon(c.method)}
                        <span className="text-gray-400">{c.method}:</span>
                        <span className="text-gray-600 break-all">{c.info}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MintInfoModal
