'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FolderTree from '@/components/FolderTree'
import TypingDescription from '@/components/TypingDescription'
import CreatorInfoWidget from '@/components/CreatorInfoWidget'
import AccessInfoWidget from '@/components/AccessInfoWidget'

interface CreatorInfo {
  id: string
  userName: string
  displayName: string | null
  profilePicUrl: string | null
}

interface AccessInfo {
  canView: boolean
  canEdit: boolean
  canDownload: boolean
  accessControlList: any[]
}

interface EntityData {
  name: string
  id: string
  type: string
  description: string | null
  createdOn: string | null
  modifiedOn: string | null
  createdBy: string | null
  creatorInfo: CreatorInfo | null
  annotations: Record<string, any> | null
  accessInfo: AccessInfo | null
  parentId: string | null
  parentName: string | null
  parentDescription: string | null
  projectId: string | null
  projectName: string | null
  projectWiki: string | null
  siblings: Array<{ id: string; name: string; type: string }>
  synapseUrl: string
}

function HomeContent() {
  const [synId, setSynId] = useState('')
  const [entityData, setEntityData] = useState<EntityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiDescription, setAiDescription] = useState<string | null>(null)
  const [generatingDescription, setGeneratingDescription] = useState(false)
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
      
      // Generate AI description after entity data is loaded
      if (data) {
        generateAiDescription(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setEntityData(null)
    } finally {
      setLoading(false)
    }
  }

  const generateAiDescription = async (data: EntityData) => {
    setGeneratingDescription(true)
    setAiDescription(null)
    
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityName: data.name,
          entityType: data.type,
          entityDescription: data.description,
          parentName: data.parentName,
          parentDescription: data.parentDescription,
          projectName: data.projectName,
          projectWiki: data.projectWiki,
          siblings: data.siblings,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate description')
      }
      
      const result = await response.json()
      setAiDescription(result.description)
    } catch (err) {
      console.error('Error generating AI description:', err)
      // Fallback to basic description if AI generation fails
      setAiDescription(null)
    } finally {
      setGeneratingDescription(false)
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
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Synapse Compass</h1>
          <p className="text-gray-600">
            Navigate Synapse.org entities in their network context
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <input
                id="synId"
                type="text"
                value={synId}
                onChange={(e) => setSynId(e.target.value)}
                placeholder="Enter Synapse ID (e.g., syn7208917)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Lookup'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Fetching entity information...</p>
          </div>
        )}

        {entityData && !loading && (
          <div className="space-y-8">
            {/* Entity Title Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">{entityData.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="px-2.5 py-1 bg-gray-100 rounded-md text-gray-700 font-medium">
                  {entityData.type.split('.').pop()}
                </span>
                <a
                  href={entityData.synapseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
                >
                  View on Synapse
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* ChatGPT-style Description */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  {generatingDescription && !aiDescription ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                      <span className="text-sm">Generating description...</span>
                    </div>
                  ) : aiDescription ? (
                    <TypingDescription text={aiDescription} />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      Loading description...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Folder Tree Visualization */}
            <FolderTree
              currentEntityId={entityData.id}
              currentEntityName={entityData.name}
              parentId={entityData.parentId}
              parentName={entityData.parentName}
              siblings={entityData.siblings}
            />

            {/* Info Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CreatorInfoWidget
                creatorInfo={entityData.creatorInfo}
                createdOn={entityData.createdOn}
                annotations={entityData.annotations}
              />
              <AccessInfoWidget
                accessInfo={entityData.accessInfo}
                entityId={entityData.id}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Synapse Compass</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}

