'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EntityGraph from '@/components/EntityGraph'

interface EntityData {
  name: string
  id: string
  type: string
  parentId: string | null
  parentName: string | null
  siblings: Array<{ id: string; name: string; type: string }>
  synapseUrl: string
}

function HomeContent() {
  const [synId, setSynId] = useState('')
  const [entityData, setEntityData] = useState<EntityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Check for synId in URL parameter on mount
  useEffect(() => {
    const urlSynId = searchParams.get('synId') || searchParams.get('syn')
    if (urlSynId) {
      // Extract synId from various formats
      const extracted = extractSynId(urlSynId)
      if (extracted) {
        setSynId(extracted)
        fetchEntityInfo(extracted)
      }
    }
  }, [searchParams])

  // Extract SynID from various input formats
  const extractSynId = (input: string): string | null => {
    // Remove whitespace
    const cleaned = input.trim()
    
    // Check if it's a full URL
    const urlMatch = cleaned.match(/synapse\.org.*[:\/](syn\d+)/i) || cleaned.match(/[:\/](syn\d+)/i)
    if (urlMatch) {
      return urlMatch[1]
    }
    
    // Check if it's just the synID (syn1234567)
    if (/^syn\d+$/i.test(cleaned)) {
      return cleaned.toLowerCase()
    }
    
    return null
  }

  const fetchEntityInfo = async (id: string) => {
    if (!id) return

    setLoading(true)
    setError(null)
    setEntityData(null)

    try {
      const response = await fetch(`/api/synapse-entity?id=${encodeURIComponent(id)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch entity' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setEntityData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setEntityData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const extracted = extractSynId(synId)
    if (extracted) {
      fetchEntityInfo(extracted)
      // Update URL without reload
      window.history.pushState({}, '', `/?synId=${extracted}`)
    } else {
      setError('Please enter a valid SynID (e.g., syn7208917)')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Synapse Compass
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Navigate Synapse.org entities in their network context
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="synId" className="block text-sm font-semibold text-slate-700 mb-3">
                Enter Synapse ID
              </label>
              <div className="flex gap-3">
                <input
                  id="synId"
                  type="text"
                  value={synId}
                  onChange={(e) => setSynId(e.target.value)}
                  placeholder="syn7208917 or https://synapse.org/..."
                  className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Lookup'
                  )}
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                You can enter just the ID (e.g., syn7208917) or a full Synapse URL
              </p>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50/80 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Fetching entity information...</p>
          </div>
        )}

        {entityData && !loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="mb-6 pb-4 border-b border-slate-200">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{entityData.name}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {entityData.type.split('.').pop()}
                </span>
                <a
                  href={entityData.synapseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1 transition-colors"
                >
                  View on Synapse
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <EntityGraph
              currentEntityId={entityData.id}
              currentEntityName={entityData.name}
              parentId={entityData.parentId}
              parentName={entityData.parentName}
              siblings={entityData.siblings}
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Synapse Compass</h1>
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}

