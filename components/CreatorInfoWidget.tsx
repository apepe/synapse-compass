'use client'

interface CreatorInfo {
  id: string
  userName: string
  displayName: string | null
  profilePicUrl: string | null
  affiliation: string | null
}

interface CreatorInfoWidgetProps {
  creatorInfo: CreatorInfo | null
  createdOn: string | null
  modifiedOn: string | null
  modifierInfo: CreatorInfo | null
  annotations: Record<string, any> | null
}

export default function CreatorInfoWidget({ creatorInfo, createdOn, modifiedOn, modifierInfo, annotations }: CreatorInfoWidgetProps) {
  // Extract DOI from annotations
  const doi = annotations?.stringAnnotations?.find((ann: any) => 
    ann.key === 'doi' || ann.key === 'DOI'
  )?.value?.[0]

  // Extract citation information
  const citation = annotations?.stringAnnotations?.find((ann: any) => 
    ann.key === 'citation' || ann.key === 'Citation'
  )?.value?.[0]

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formattedCreatedDate = formatDate(createdOn)
  const formattedModifiedDate = formatDate(modifiedOn)

  // Only show modified by if it's different from creator
  const showModifiedBy = modifierInfo && creatorInfo && modifierInfo.id !== creatorInfo.id

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Created */}
        <div className="space-y-4">
          {/* Created by */}
          {creatorInfo && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Created by</div>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {creatorInfo.profilePicUrl ? (
                    <>
                      <img 
                        src={creatorInfo.profilePicUrl} 
                        alt={creatorInfo.displayName || creatorInfo.userName}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div 
                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <span className="text-gray-600 text-sm font-medium">
                          {(creatorInfo.displayName || creatorInfo.userName).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {(creatorInfo.displayName || creatorInfo.userName).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={`https://www.synapse.org/#!Profile:${creatorInfo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm block"
                  >
                    {creatorInfo.displayName || creatorInfo.userName}
                  </a>
                  {creatorInfo.affiliation && (
                    <div className="text-xs text-gray-500 mt-1">{creatorInfo.affiliation}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Created at */}
          {formattedCreatedDate && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Created at</div>
              <div className="text-sm text-gray-600">{formattedCreatedDate}</div>
            </div>
          )}
        </div>

        {/* Right Column: Modified (only if different from creator) */}
        {showModifiedBy && (
          <div className="space-y-4">
            {/* Modified by */}
            {modifierInfo && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Modified by</div>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    {modifierInfo.profilePicUrl ? (
                      <>
                        <img 
                          src={modifierInfo.profilePicUrl} 
                          alt={modifierInfo.displayName || modifierInfo.userName}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <div 
                          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
                          style={{ display: 'none' }}
                        >
                          <span className="text-gray-600 text-sm font-medium">
                            {(modifierInfo.displayName || modifierInfo.userName).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {(modifierInfo.displayName || modifierInfo.userName).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://www.synapse.org/#!Profile:${modifierInfo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm block"
                    >
                      {modifierInfo.displayName || modifierInfo.userName}
                    </a>
                    {modifierInfo.affiliation && (
                      <div className="text-xs text-gray-500 mt-1">{modifierInfo.affiliation}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modified at */}
            {formattedModifiedDate && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Modified at</div>
                <div className="text-sm text-gray-600">{formattedModifiedDate}</div>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* DOI and Citation - Full width below columns */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
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

        {!creatorInfo && !formattedCreatedDate && !doi && !citation && (
          <div className="text-sm text-gray-500">No additional information available</div>
        )}
      </div>
      </div>
    </div>
  )
}

