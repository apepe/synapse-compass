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
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Synapse Compass</h1>
          <p className="text-lg text-gray-600">
            Explore Synapse.org entities in their network context
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="synId" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Synapse ID
              </label>
              <div className="flex gap-2">
                <input
                  id="synId"
                  type="text"
                  value={synId}
                  onChange={(e) => setSynId(e.target.value)}
                  placeholder="syn7208917 or https://synapse.org/..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Lookup'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                You can enter just the ID (e.g., syn7208917) or a full Synapse URL
              </p>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Fetching entity information...</p>
          </div>
        )}

        {entityData && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{entityData.name}</h2>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {entityData.type.split('.').pop()} •{' '}
                <a
                  href={entityData.synapseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View on Synapse →
                </a>
              </p>
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

