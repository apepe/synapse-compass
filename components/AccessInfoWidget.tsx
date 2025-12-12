'use client'

interface AccessInfo {
  canView: boolean
  canEdit: boolean
  canDownload: boolean
  accessControlList: any[]
}

interface AccessInfoWidgetProps {
  accessInfo: AccessInfo | null
  accessRequirements: any[] | null
  entityId: string
}

export default function AccessInfoWidget({ accessInfo, accessRequirements, entityId }: AccessInfoWidgetProps) {
  // Determine access level
  const getAccessLevel = () => {
    // Check if there are access requirements (ACT - Access Control Team)
    if (accessRequirements && accessRequirements.length > 0) {
      const requirement = accessRequirements[0] // Get the first/main requirement
      const requirementName = requirement.name || 'Access Request Required'
      const requirementType = requirement.concreteType || ''
      
      // Extract key information from the requirement
      const isClickwrap = requirementType.includes('Clickwrap')
      const isTermsOfUse = requirementType.includes('TermsOfUse')
      const isManagedACTAccess = requirementType.includes('ManagedACTAccess')
      
      let description = 'This entity requires access approval. '
      let requirements: string[] = []
      
      if (isClickwrap || isTermsOfUse) {
        description = 'This entity requires access approval through a data access request.'
        requirements.push('Sign in with a Sage Platform (Synapse) user account. If you do not have a Sage account, you can register for free.')
      }
      
      // Extract terms of use
      if (requirement.termsOfUse) {
        requirements.push(`Agree to the terms: ${requirement.termsOfUse}`)
      }
      
      // Check for acknowledgment/citation requirements
      if (requirement.duesRequired !== undefined && requirement.duesRequired) {
        requirements.push('Publications generated using data accessed through the AD Knowledge Portal must acknowledge and cite both the AD Knowledge Portal and the data contributor(s) as described in the study specific Acknowledgment Statements.')
      }
      
      // Add general data use terms
      if (isClickwrap) {
        requirements.push('You have access to these data under the following terms: Access to these data is controlled at the request of the data contributor(s) and due to the sensitive nature of the data. The terms for data access cannot be modified.')
      }
      
      if (requirement.actContactInfo) {
        requirements.push(`For questions, contact: ${requirement.actContactInfo}`)
      }
      
      return {
        level: 'Restricted',
        description: description,
        requirements: requirements.length > 0 ? requirements : [
          'Sign in with a Synapse account',
          'Agree to data use terms',
          'Request access through the data access portal'
        ],
        requirementName: requirementName,
        action: {
          text: 'Request Access',
          url: `https://www.synapse.org/#!Synapse:${entityId}`,
        },
      }
    }
    
    // If we have access requirements, it's definitely restricted
    // (This check happens first, before checking ACL)
    
    // If we can't fetch ACL but we have access info, check if we can view
    // If we successfully fetched the entity data, we have at least READ access
    if (!accessInfo) {
      // If we have access requirements, it's restricted
      if (accessRequirements && accessRequirements.length > 0) {
        // This case is already handled above, but just in case
        return {
          level: 'Restricted',
          description: 'This entity requires access approval.',
          requirements: null,
          requirementName: null,
          action: {
            text: 'Request Access',
            url: `https://www.synapse.org/#!Synapse:${entityId}`,
          },
        }
      }
      
      // If we can't determine, but we got the entity, it's likely accessible
      // (The fact that we're seeing this means the entity was successfully fetched)
      return {
        level: 'Public',
        description: 'This entity appears to be accessible. Access information could not be fully determined.',
        requirements: null,
        requirementName: null,
        action: null,
      }
    }

    // Check ACL for public access
    if (accessInfo.accessControlList && accessInfo.accessControlList.length > 0) {
      // Find public user access (principalId 273948)
      const publicAccess = accessInfo.accessControlList.find((acl: any) => 
        acl.principalId === 273948 || acl.principalId === '273948'
      )
      
      if (publicAccess) {
        const accessTypes = Array.isArray(publicAccess.accessType) 
          ? publicAccess.accessType 
          : (typeof publicAccess.accessType === 'string' ? [publicAccess.accessType] : [])
        
        // Check if public has both READ and DOWNLOAD access
        const hasRead = accessTypes.includes('READ')
        const hasDownload = accessTypes.includes('DOWNLOAD')
        
        if (hasRead && hasDownload) {
          return {
            level: 'Public',
            description: 'This entity is publicly accessible. Anyone can view and download it.',
            requirements: null,
            requirementName: null,
            action: null,
          }
        } else if (hasRead) {
          // Has READ but not DOWNLOAD - restricted
          return {
            level: 'Restricted',
            description: 'This entity can be viewed but download access is restricted. You may need to request access to download.',
            requirements: null,
            requirementName: null,
            action: {
              text: 'Request Access',
              url: `https://www.synapse.org/#!Synapse:${entityId}`,
            },
          }
        }
      }
      
      // Has ACL but no public access - restricted
      return {
        level: 'Restricted',
        description: 'This entity has restricted access. You may need to request access or join a team to view it.',
        requirements: null,
        requirementName: null,
        action: {
          text: 'Request Access',
          url: `https://www.synapse.org/#!Synapse:${entityId}`,
        },
      }
    }

    // If ACL is empty or doesn't exist, but we successfully fetched the entity
    // Be conservative - if we can't determine access level, show as restricted
    // The fact that we can fetch entity metadata doesn't mean it's fully public
    return {
      level: 'Restricted',
      description: 'Access level could not be fully determined. This entity may require authentication or special permissions to view or download.',
      requirements: null,
      requirementName: null,
      action: {
        text: 'Check Access on Synapse',
        url: `https://www.synapse.org/#!Synapse:${entityId}`,
      },
    }
    
    // If we have access requirements, it's restricted (should have been caught above, but just in case)
    return {
      level: 'Restricted',
      description: 'This entity requires access approval.',
      requirements: null,
      requirementName: null,
      action: {
        text: 'Request Access',
        url: `https://www.synapse.org/#!Synapse:${entityId}`,
      },
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

        {accessLevel.requirements && accessLevel.requirements.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">What do I need to do?</div>
            <ul className="text-sm text-gray-600 space-y-2">
              {accessLevel.requirements.map((req: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {accessLevel.requirementName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900 mb-1">What is this request for?</div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="underline">{accessLevel.requirementName.replace(/^\d+\s*-\s*/, '')}</span>
            </div>
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

