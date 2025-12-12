'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FolderTree from '@/components/FolderTree'
import TypingDescription from '@/components/TypingDescription'
import CreatorInfoWidget from '@/components/CreatorInfoWidget'
import AccessInfoWidget from '@/components/AccessInfoWidget'
import ProjectInfoWidget from '@/components/ProjectInfoWidget'
import EntityAnnotationsWidget from '@/components/EntityAnnotationsWidget'
import Logo from '@/components/Logo'
import ShareButton from '@/components/ShareButton'

interface CreatorInfo {
  id: string
  userName: string
  displayName: string | null
  profilePicUrl: string | null
  affiliation: string | null
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
  modifiedBy: string | null
  modifierInfo: CreatorInfo | null
  annotations: Record<string, any> | null
  accessInfo: AccessInfo | null
  accessRequirements: any[] | null
  parentId: string | null
  parentName: string | null
  parentDescription: string | null
  projectId: string | null
  projectName: string | null
  projectWiki: string | null
  projectAnnotations: Record<string, any> | null
  projectCitations: string[]
  googleScholarMentions: number | null
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

  // Extract SynID from various input formats
  const extractSynId = (input: string): string | null => {
    // Remove whitespace
    const cleaned = input.trim()
    
    // Check for synapse.org URL format: https://www.synapse.org/Synapse:syn51514105
    const synapseUrlMatch = cleaned.match(/synapse\.org\/Synapse[:\/](syn\d+)/i)
    if (synapseUrlMatch) {
      return synapseUrlMatch[1].toLowerCase()
    }
    
    // Check if it's a full URL with synID
    const urlMatch = cleaned.match(/synapse\.org.*[:\/](syn\d+)/i) || cleaned.match(/[:\/](syn\d+)/i)
    if (urlMatch) {
      return urlMatch[1].toLowerCase()
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

  // Check for synId in URL parameter on mount
  useEffect(() => {
    // Check URL parameters first
    const urlSynId = searchParams.get('synId') || searchParams.get('syn')
    if (urlSynId) {
      const extracted = extractSynId(urlSynId)
      if (extracted) {
        setSynId(extracted)
        fetchEntityInfo(extracted)
        return
      }
    }
    
    // Also check if the pathname contains Synapse:synID format
    // e.g., /Synapse:syn51514105
    if (typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/\/Synapse[:\/](syn\d+)/i)
      if (pathMatch) {
        const extracted = pathMatch[1].toLowerCase()
        setSynId(extracted)
        fetchEntityInfo(extracted)
        // Update URL to clean format
        window.history.replaceState({}, '', `/?synId=${extracted}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header with Logo and Search */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <Logo />
          
          {/* Search Form - Smaller, Top Right */}
          <div className="flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                id="synId"
                type="text"
                value={synId}
                onChange={(e) => setSynId(e.target.value)}
                placeholder="Enter SynID (e.g., syn7208917)"
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '...' : 'Lookup'}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Fetching entity information...</p>
          </div>
        )}

        {/* Empty State */}
        {!entityData && !loading && !error && !synId && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Synapse Compass</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Enter a Synapse entity ID to explore its context, access information, and project structure.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 max-w-lg w-full">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">How to use:</h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Enter a SynID in the search bar (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-xs">syn7208917</code>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Or paste a Synapse URL (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-xs">https://www.synapse.org/Synapse:syn51514105</code>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>View entity information, access levels, project structure, and more</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {entityData && !loading && (
          <div className="space-y-8">
            {/* Entity Title Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-semibold text-gray-900">{entityData.name}</h2>
                <ShareButton 
                  entityId={entityData.id} 
                  entityName={entityData.name}
                  description={aiDescription}
                />
              </div>
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

            {/* Info Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CreatorInfoWidget
                creatorInfo={entityData.creatorInfo}
                createdOn={entityData.createdOn}
                modifiedOn={entityData.modifiedOn}
                modifierInfo={entityData.modifierInfo}
                annotations={entityData.annotations}
              />
              <AccessInfoWidget
                accessInfo={entityData.accessInfo}
                accessRequirements={entityData.accessRequirements}
                entityId={entityData.id}
              />
            </div>

            {/* Project Information and Entity Annotations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entityData.projectId && (
                <ProjectInfoWidget
                  projectId={entityData.projectId}
                  projectName={entityData.projectName}
                  projectWiki={entityData.projectWiki}
                  projectAnnotations={entityData.projectAnnotations}
                  projectCitations={entityData.projectCitations}
                  googleScholarMentions={entityData.googleScholarMentions}
                />
              )}
              <EntityAnnotationsWidget annotations={entityData.annotations} />
            </div>

            {/* Folder Tree Visualization */}
            <FolderTree
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

