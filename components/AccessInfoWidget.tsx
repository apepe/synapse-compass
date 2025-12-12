'use client'

interface AccessInfo {
  canView: boolean
  canEdit: boolean
  canDownload: boolean
  accessControlList: any[]
}

interface AccessInfoWidgetProps {
  accessInfo: AccessInfo | null
  entityId: string
}

export default function AccessInfoWidget({ accessInfo, entityId }: AccessInfoWidgetProps) {
  // Determine access level
  const getAccessLevel = () => {
    // If we can't fetch ACL, assume it might be restricted
    if (!accessInfo) {
      return {
        level: 'Unknown',
        description: 'Access information is not available. Visit the entity on Synapse.org to check access requirements.',
        action: {
          text: 'Check Access on Synapse',
          url: `https://www.synapse.org/#!Synapse:${entityId}`,
        },
      }
    }

    if (accessInfo.accessControlList && accessInfo.accessControlList.length > 0) {
      const hasPublicAccess = accessInfo.accessControlList.some((acl: any) => 
        acl.principalId === 273948 || // Public user ID
        acl.accessType?.includes('READ')
      )
      
      if (hasPublicAccess) {
        return {
          level: 'Public',
          description: 'This entity is publicly accessible. Anyone can view and download it.',
          action: null,
        }
      }
      
      return {
        level: 'Restricted',
        description: 'This entity has restricted access. You may need to request access or join a team to view it.',
        action: {
          text: 'Request Access',
          url: `https://www.synapse.org/#!Synapse:${entityId}`,
        },
      }
    }

    // If ACL is empty, it's likely public
    return {
      level: 'Public',
      description: 'This entity appears to be publicly accessible. Anyone can view and download it.',
      action: null,
    }
  }

  const accessLevel = getAccessLevel()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Access</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              accessLevel.level === 'Public' 
                ? 'bg-green-100 text-green-700' 
                : accessLevel.level === 'Restricted'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {accessLevel.level}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {accessLevel.description}
          </p>
        </div>

        {accessInfo && accessInfo.accessControlList && accessInfo.accessControlList.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Access Requirements</div>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>You may need to be added to a Synapse team</li>
              <li>Some entities require data use agreements</li>
              <li>Contact the project administrator for access</li>
            </ul>
          </div>
        )}

        {accessLevel.action && (
          <div>
            <a
              href={accessLevel.action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {accessLevel.action.text}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="mb-1">Access levels in Synapse:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><strong>Public:</strong> Anyone can view and download</li>
              <li><strong>Restricted:</strong> Requires team membership or approval</li>
              <li><strong>Private:</strong> Only project members can access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

