'use client'

import { useState, useEffect } from 'react'

interface ProjectInfoWidgetProps {
  projectId: string | null
  projectName: string | null
  projectWiki: string | null
  projectAnnotations: Record<string, any> | null
  projectCitations: string[]
  googleScholarMentions: number | null
}

export default function ProjectInfoWidget({ projectId, projectName, projectWiki, projectAnnotations, projectCitations, googleScholarMentions }: ProjectInfoWidgetProps) {
  const [projectSummary, setProjectSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  // Generate project summary from wiki
  useEffect(() => {
    if (projectWiki && projectName) {
      setGeneratingSummary(true)
      fetch('/api/generate-project-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          projectWiki,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.summary) {
            setProjectSummary(data.summary)
          }
        })
        .catch((err) => {
          console.error('Error generating project summary:', err)
        })
        .finally(() => {
          setGeneratingSummary(false)
        })
    }
  }, [projectWiki, projectName])
  // Extract DOI from project annotations
  const projectDoi = projectAnnotations?.stringAnnotations?.find((ann: any) => 
    ann.key && (ann.key.toLowerCase() === 'doi' || ann.key.toLowerCase() === 'doi')
  )?.value?.[0]

  // Get unique citations
  const uniqueCitations = Array.from(new Set(projectCitations)).filter(Boolean)

  if (!projectId || !projectName) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
      
      <div className="space-y-4">
        {/* Project Name */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Project</div>
          <a
            href={`https://www.synapse.org/#!Synapse:${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-base"
          >
            {projectName}
          </a>
        </div>

        {/* Project ID */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Project ID</div>
          <div className="text-sm text-gray-600 font-mono">{projectId}</div>
        </div>

        {/* About - Project Summary */}
        {(projectSummary || generatingSummary) && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">About</div>
            <div className="text-sm text-gray-600 leading-relaxed">
              {generatingSummary ? (
                <p className="text-gray-500">Generating summary...</p>
              ) : projectSummary ? (
                <p>{projectSummary}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Project DOI */}
        {projectDoi && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">DOI</div>
            <div className="text-sm">
              <a
                href={`https://doi.org/${projectDoi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {projectDoi}
              </a>
            </div>
          </div>
        )}

        {/* Google Scholar Mentions */}
        {googleScholarMentions !== null && projectId && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Mentions</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {googleScholarMentions > 0 ? `${googleScholarMentions} mentions found on` : 'Check mentions on'}
              </span>
              <a
                href={`https://scholar.google.com/scholar?hl=en&as_sdt=0%2C33&q=${projectId}&btnG=`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
              >
                Google Scholar
              </a>
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        )}

        {/* Project Citations (from annotations) - only show if we have citations from annotations */}
        {uniqueCitations.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Citations ({uniqueCitations.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uniqueCitations.map((citation, index) => (
                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                  {citation}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

