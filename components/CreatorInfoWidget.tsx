'use client'

interface CreatorInfo {
  id: string
  userName: string
  displayName: string | null
  profilePicUrl: string | null
}

interface CreatorInfoWidgetProps {
  creatorInfo: CreatorInfo | null
  createdOn: string | null
  annotations: Record<string, any> | null
}

export default function CreatorInfoWidget({ creatorInfo, createdOn, annotations }: CreatorInfoWidgetProps) {
  // Extract DOI from annotations
  const doi = annotations?.stringAnnotations?.find((ann: any) => 
    ann.key === 'doi' || ann.key === 'DOI'
  )?.value?.[0]

  // Extract citation information
  const citation = annotations?.stringAnnotations?.find((ann: any) => 
    ann.key === 'citation' || ann.key === 'Citation'
  )?.value?.[0]

  // Format date
  const formattedDate = createdOn 
    ? new Date(createdOn).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
      
      <div className="space-y-4">
        {/* Creator */}
        {creatorInfo && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Created by</div>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                {creatorInfo.profilePicUrl ? (
                  <img 
                    src={creatorInfo.profilePicUrl} 
                    alt={creatorInfo.displayName || creatorInfo.userName}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Hide image on error
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      // Show fallback
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                {/* Fallback avatar */}
                <div 
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
                  style={{ display: creatorInfo.profilePicUrl ? 'none' : 'flex' }}
                >
                  <span className="text-gray-600 text-sm font-medium">
                    {(creatorInfo.displayName || creatorInfo.userName).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <a
                  href={`https://www.synapse.org/#!Profile:${creatorInfo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {creatorInfo.displayName || creatorInfo.userName}
                </a>
                {creatorInfo.displayName && (
                  <div className="text-sm text-gray-500">@{creatorInfo.userName}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Creation Date */}
        {formattedDate && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Created</div>
            <div className="text-sm text-gray-600">{formattedDate}</div>
          </div>
        )}

        {/* DOI */}
        {doi && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">DOI</div>
            <div className="text-sm">
              <a
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {doi}
              </a>
            </div>
          </div>
        )}

        {/* Citation */}
        {citation && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Citation</div>
            <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-200">
              {citation}
            </div>
          </div>
        )}

        {!creatorInfo && !formattedDate && !doi && !citation && (
          <div className="text-sm text-gray-500">No additional information available</div>
        )}
      </div>
    </div>
  )
}

