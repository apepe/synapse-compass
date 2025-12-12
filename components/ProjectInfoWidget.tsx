'use client'

interface ProjectInfoWidgetProps {
  projectId: string | null
  projectName: string | null
  projectWiki: string | null
}

export default function ProjectInfoWidget({ projectId, projectName, projectWiki }: ProjectInfoWidgetProps) {
  // Extract a summary from the wiki (first paragraph or first few sentences)
  const getProjectSummary = (wiki: string | null) => {
    if (!wiki) return null
    
    // Remove markdown headers, links, and other syntax for a cleaner summary
    let cleaned = wiki
      .replace(/#+\s/g, '') // Remove headers
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remove links, keep text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italics
      .trim()
    
    // Get first paragraph or first 200 characters
    const firstParagraph = cleaned.split('\n\n')[0] || cleaned.split('\n')[0]
    if (firstParagraph.length > 200) {
      return firstParagraph.substring(0, 200) + '...'
    }
    return firstParagraph
  }

  const projectSummary = getProjectSummary(projectWiki)

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
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm"
          >
            {projectName}
          </a>
        </div>

        {/* Project ID */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Project ID</div>
          <div className="text-sm text-gray-600 font-mono">{projectId}</div>
        </div>

        {/* Project Summary/Description */}
        {projectSummary && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
            <div className="text-sm text-gray-600 leading-relaxed">{projectSummary}</div>
          </div>
        )}

        {/* Link to full project */}
        <div>
          <a
            href={`https://www.synapse.org/#!Synapse:${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View full project on Synapse
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

