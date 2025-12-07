import { useState, useEffect, useRef } from 'react'
import { Info, X, Mail, Globe, MessageCircle, Copy, Check } from 'lucide-react'
import { mintApi, MintInfo, statsApi, Stats } from '../api'

// X (Twitter) logo SVG
const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

function MintInfoModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mintInfo, setMintInfo] = useState<MintInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Listen for stats refresh events
  useEffect(() => {
    const handleRefresh = async () => {
      if (isOpen) {
        const statsResponse = await statsApi.get()
        if (statsResponse.data) {
          setStats(statsResponse.data)
        }
      }
    }
    window.addEventListener('stats-refresh', handleRefresh)
    return () => window.removeEventListener('stats-refresh', handleRefresh)
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
        return <XLogo className="h-4 w-4" />
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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-black dark:hover:text-dark-text transition-colors"
        title="Mint Information"
        aria-label="Mint Information"
      >
        <Info className="h-5 w-5" />
      </button>

      {isOpen && (
        <div 
          ref={modalRef}
          className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-dark-surface border border-black dark:border-dark-border shadow-lg w-80"
        >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-b-2 border-black dark:border-dark-border" />
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {mintInfo && !loading && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mintInfo.icon_url && (
                    <img
                      src={mintInfo.icon_url}
                      alt=""
                      className="h-8 w-8"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm text-black dark:text-dark-text">{mintInfo.name || 'Mint'}</p>
                    {mintInfo.version && (
                      <p className="text-xs text-gray-400">v{mintInfo.version}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface"
                >
                  <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              {/* Reserves */}
              {stats && (
                <div className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Reserves</p>
                  <p className="text-lg font-semibold text-black dark:text-dark-text">{reserves.toLocaleString()} <span className="text-xs text-gray-400 select-none">{stats.coin_symbol}</span></p>
                </div>
              )}

              {/* Description */}
              {mintInfo.description && (
                <div className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{mintInfo.description}</p>
                </div>
              )}

              {/* Mint URL */}
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">Mint URL</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                    {mintInfo.urls?.[0]}
                  </code>
                  <button
                    onClick={() => copyToClipboard(mintInfo.urls?.[0] || '', 'url')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface flex-shrink-0"
                  >
                    {copiedField === 'url' ? (
                      <Check className="h-3 w-3 text-black dark:text-dark-text" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Wallet API URL */}
              {stats?.wallet_api_url && (
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Wallet API</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                      {stats.wallet_api_url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(stats.wallet_api_url!, 'wallet_url')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface flex-shrink-0"
                    >
                      {copiedField === 'wallet_url' ? (
                        <Check className="h-3 w-3 text-black dark:text-dark-text" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Pubkey */}
              {mintInfo.pubkey && (
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Public Key</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {truncatePubkey(mintInfo.pubkey)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(mintInfo.pubkey!, 'pubkey')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface"
                    >
                      {copiedField === 'pubkey' ? (
                        <Check className="h-3 w-3 text-black dark:text-dark-text" />
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
                  <div className="space-y-2">
                    {mintInfo.contact.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <a 
                            target="_blank" 
                            rel="noopener noreferrer"
                            href={c.method === 'email' ? `mailto:${c.info}` : `https://x.com/${c.info.replace('@', '')}`}
                            className="flex-shrink-0 hover:text-black dark:hover:text-white text-gray-500"
                          >
                            {getContactIcon(c.method)}
                          </a>
                          <span className="text-gray-600 dark:text-gray-400 truncate">{c.info}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(c.info, `contact-${i}`)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-dark-surface flex-shrink-0"
                        >
                          {copiedField === `contact-${i}` ? (
                            <Check className="h-3 w-3 text-black dark:text-dark-text" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
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
