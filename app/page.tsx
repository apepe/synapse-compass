'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Breadcrumb {
  id: string
  name: string
  type: string
}

interface EntityData {
  name: string
  id: string
  type: string
  description?: string | null
  createdOn?: string | null
  modifiedOn?: string | null
  breadcrumbs: Breadcrumb[]
  project: Breadcrumb | null
  wikiContent: string | null
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
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Synapse Compass</h1>
          <p className="text-lg text-gray-600">
            Explore Synapse.org entities quickly and easily
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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

          {loading && (
            <div className="mt-4 text-center">
              <p className="text-gray-600">Fetching entity information...</p>
            </div>
          )}

          {entityData && !loading && (
            <div className="mt-6 space-y-4">
              {/* Breadcrumb Trail */}
              {entityData.breadcrumbs.length > 1 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">
                    Location
                  </h3>
                  <nav className="flex items-center space-x-2 text-sm">
                    {entityData.breadcrumbs.map((crumb, index) => (
                      <div key={crumb.id} className="flex items-center">
                        <a
                          href={`https://www.synapse.org/#!Synapse:${crumb.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                        >
                          {crumb.name}
                        </a>
                        {index < entityData.breadcrumbs.length - 1 && (
                          <span className="mx-2 text-blue-500">→</span>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              )}

              {/* Project Information */}
              {entityData.project && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <h3 className="text-xs font-semibold text-purple-800 mb-2 uppercase tracking-wide">
                    Project
                  </h3>
                  <p className="text-lg font-semibold text-purple-900">
                    {entityData.project.name}
                  </p>
                  <a
                    href={`https://www.synapse.org/#!Synapse:${entityData.project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-700 hover:text-purple-900 hover:underline mt-1 inline-block"
                  >
                    View on Synapse →
                  </a>
                </div>
              )}

              {/* Entity Information */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">
                  Entity
                </h3>
                <p className="text-lg font-semibold text-green-900 mb-2">{entityData.name}</p>
                <p className="text-sm text-green-700 mb-3">
                  <span className="font-medium">Type:</span> {entityData.type.split('.').pop()}
                </p>
                {entityData.description && (
                  <p className="text-sm text-green-700 mb-3">{entityData.description}</p>
                )}
                <a
                  href={entityData.synapseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:text-green-900 hover:underline"
                >
                  View on Synapse →
                </a>
              </div>

              {/* Wiki Content */}
              {entityData.wikiContent && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h3 className="text-xs font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                    Project Description
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {entityData.wikiContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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

