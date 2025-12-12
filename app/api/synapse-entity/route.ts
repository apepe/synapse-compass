import { NextRequest, NextResponse } from 'next/server'

// Extract SynID from various formats
function extractSynId(input: string): string | null {
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const synIdParam = searchParams.get('id')

  if (!synIdParam) {
    return NextResponse.json(
      { error: 'SynID parameter is required' },
      { status: 400 }
    )
  }

  const synId = extractSynId(synIdParam)
  
  if (!synId) {
    return NextResponse.json(
      { error: 'Invalid SynID format. Expected format: syn1234567' },
      { status: 400 }
    )
  }

  try {
    const baseUrl = 'https://repo-prod.prod.sagebase.org/repo/v1'
    
    // Fetch entity information from Synapse.org REST API
    const entityResponse = await fetch(`${baseUrl}/entity/${synId}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!entityResponse.ok) {
      if (entityResponse.status === 404) {
        return NextResponse.json(
          { error: 'Entity not found. The SynID may be invalid or you may not have access.' },
          { status: 404 }
        )
      }
      
      const errorText = await entityResponse.text()
      return NextResponse.json(
        { error: `Synapse API error: ${entityResponse.status} - ${errorText}` },
        { status: entityResponse.status }
      )
    }

    const entityData = await entityResponse.json()
    
    // Fetch creator information
    let creatorInfo: { id: string; userName: string; displayName: string | null; profilePicUrl: string | null } | null = null
    if (entityData.createdBy) {
      try {
        const creatorResponse = await fetch(`${baseUrl}/userProfile/${entityData.createdBy}`, {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (creatorResponse.ok) {
          const creatorData = await creatorResponse.json()
          creatorInfo = {
            id: creatorData.ownerId || entityData.createdBy,
            userName: creatorData.userName || 'Unknown',
            displayName: creatorData.firstName && creatorData.lastName 
              ? `${creatorData.firstName} ${creatorData.lastName}` 
              : creatorData.displayName || null,
            // Try to construct profile image URL - Synapse uses file handle associations
            profilePicUrl: creatorData.profilePicureFileHandleId 
              ? `https://www.synapse.org/portal/filehandleassociation?fileHandleId=${creatorData.profilePicureFileHandleId}&associationObjectType=UserProfile&associationObjectId=${creatorData.ownerId || entityData.createdBy}`
              : null,
          }
        }
      } catch (err) {
        console.error('Error fetching creator info:', err)
      }
    }
    
    // Fetch annotations (may contain DOI, citations, etc.)
    let annotations: Record<string, any> | null = null
    try {
      const annotationsResponse = await fetch(`${baseUrl}/entity/${synId}/annotations2`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (annotationsResponse.ok) {
        const annotationsData = await annotationsResponse.json()
        annotations = annotationsData
      }
    } catch (err) {
      console.error('Error fetching annotations:', err)
    }
    
    // Fetch access information
    // If we successfully fetched the entity, we have at least READ access
    let accessInfo: { canView: boolean; canEdit: boolean; canDownload: boolean; accessControlList: any[] } | null = null
    let aclInheritedFrom: string | null = null
    
    try {
      const aclResponse = await fetch(`${baseUrl}/entity/${synId}/acl`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (aclResponse.ok) {
        const aclData = await aclResponse.json()
        accessInfo = {
          canView: true, // If we got the entity, we can view it
          canEdit: false, // Would need to check permissions
          canDownload: false, // Would need to check permissions
          accessControlList: aclData.resourceAccess || [],
        }
      } else {
        // Check if ACL inherits from parent
        const errorData = await aclResponse.json().catch(() => ({}))
        if (errorData.reason && errorData.reason.includes('inherits its permissions from')) {
          // Extract the parent entity ID from the error message
          const match = errorData.reason.match(/\/entity\/(syn\d+)\/acl/)
          if (match) {
            aclInheritedFrom = match[1]
            // Try to fetch the parent's ACL
            try {
              const parentAclResponse = await fetch(`${baseUrl}/entity/${aclInheritedFrom}/acl`, {
                headers: {
                  'Accept': 'application/json',
                },
              })
              if (parentAclResponse.ok) {
                const parentAclData = await parentAclResponse.json()
                accessInfo = {
                  canView: true,
                  canEdit: false,
                  canDownload: false,
                  accessControlList: parentAclData.resourceAccess || [],
                }
              }
            } catch (parentErr) {
              // If we can't get parent ACL, but we got the entity, assume we can view
              accessInfo = {
                canView: true,
                canEdit: false,
                canDownload: false,
                accessControlList: [],
              }
            }
          } else {
            // If we got the entity but ACL inherits, assume we can view
            accessInfo = {
              canView: true,
              canEdit: false,
              canDownload: false,
              accessControlList: [],
            }
          }
        } else {
          // If we got the entity but can't get ACL, assume we can view
          accessInfo = {
            canView: true,
            canEdit: false,
            canDownload: false,
            accessControlList: [],
          }
        }
      }
    } catch (err) {
      // If we successfully fetched the entity, we have at least READ access
      // The fact that we got here means we can view the entity
      accessInfo = {
        canView: true,
        canEdit: false,
        canDownload: false,
        accessControlList: [],
      }
    }
    
    // Fetch access requirements (ACT - Access Control Team requirements)
    let accessRequirements: any[] | null = null
    try {
      // Try to get access requirements for this entity
      const accessReqResponse = await fetch(`${baseUrl}/entity/${synId}/accessRequirement`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (accessReqResponse.ok) {
        const accessReqData = await accessReqResponse.json()
        if (accessReqData.results && Array.isArray(accessReqData.results) && accessReqData.results.length > 0) {
          accessRequirements = accessReqData.results
        }
      }
    } catch (err) {
      // Access requirements might not be accessible, that's okay
      console.error('Error fetching access requirements:', err)
    }
    
    // Check if this entity is itself a Project
    const isProject = entityData.concreteType && entityData.concreteType.includes('Project')
    
    // Fetch sibling entities (children of the parent folder) OR children of this project
    let siblings: Array<{ id: string; name: string; type: string }> = []
    let parentName: string | null = null
    let parentDescription: string | null = null
    let projectWiki: string | null = null
    let projectId: string | null = null
    let projectName: string | null = null
    const parentId = entityData.parentId
    
    if (isProject) {
      // If this is a project, it IS the project
      projectId = synId
      projectName = entityData.name
      
      // Fetch children of this project
      try {
        const childrenResponse = await fetch(`${baseUrl}/entity/children`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parentId: synId,
            includeTypes: ['file', 'folder', 'project', 'table', 'link']
          }),
        })
        
        if (childrenResponse.ok) {
          const childrenData = await childrenResponse.json()
          if (childrenData.page && Array.isArray(childrenData.page)) {
            siblings = childrenData.page.map((child: any) => ({
              id: child.id,
              name: child.name || 'Unknown',
              type: child.type || 'Unknown'
            }))
          }
        }
      } catch (err) {
        console.error('Error fetching project children:', err)
      }
      
      // Fetch wiki for this project
      try {
        const wikiListResponse = await fetch(`${baseUrl}/entity/${synId}/wiki2`, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (wikiListResponse.ok) {
          const wikiListData = await wikiListResponse.json()
          if (wikiListData && wikiListData.id) {
            const wikiResponse = await fetch(
              `${baseUrl}/entity/${synId}/wiki/${wikiListData.id}`,
              {
                headers: {
                  'Accept': 'application/json',
                },
              }
            )
            
            if (wikiResponse.ok) {
              const wikiData = await wikiResponse.json()
              if (wikiData.markdown) {
                projectWiki = wikiData.markdown
              }
            }
          }
        }
      } catch (wikiErr) {
        console.error('Error fetching project wiki:', wikiErr)
      }
    } else {
      // Not a project - traverse up to find the project
      let currentParentId = parentId
      let depth = 0
      const maxDepth = 10
      
      while (currentParentId && depth < maxDepth) {
        try {
          const parentResponse = await fetch(`${baseUrl}/entity/${currentParentId}`, {
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (parentResponse.ok) {
            const parentData = await parentResponse.json()
            
            // If this is the direct parent, store its info
            if (currentParentId === parentId) {
              parentName = parentData.name || 'Parent Folder'
              parentDescription = parentData.description || null
            }
            
            // Check if this is a project
            if (parentData.concreteType && parentData.concreteType.includes('Project')) {
              projectId = parentData.id
              projectName = parentData.name
              break
            }
            
            // Move up to the next parent
            currentParentId = parentData.parentId
            depth++
          } else {
            break
          }
        } catch (err) {
          console.error(`Error fetching parent ${currentParentId}:`, err)
          break
        }
      }
      
      // Fetch wiki content for the project if we found one
      if (projectId) {
        try {
          const wikiListResponse = await fetch(`${baseUrl}/entity/${projectId}/wiki2`, {
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (wikiListResponse.ok) {
            const wikiListData = await wikiListResponse.json()
            if (wikiListData && wikiListData.id) {
              const wikiResponse = await fetch(
                `${baseUrl}/entity/${projectId}/wiki/${wikiListData.id}`,
                {
                  headers: {
                    'Accept': 'application/json',
                  },
                }
              )
              
              if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json()
                if (wikiData.markdown) {
                  projectWiki = wikiData.markdown
                }
              }
            }
          }
        } catch (wikiErr) {
          console.error('Error fetching wiki:', wikiErr)
        }
      }
      
      // Fetch children of the direct parent folder
      if (parentId) {
        try {
          // Fetch children of the parent folder using POST endpoint
          const childrenResponse = await fetch(`${baseUrl}/entity/children`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parentId: parentId,
              includeTypes: ['file', 'folder', 'project', 'table', 'link']
            }),
          })
          
          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json()
            if (childrenData.page && Array.isArray(childrenData.page)) {
              siblings = childrenData.page.map((child: any) => ({
                id: child.id,
                name: child.name || 'Unknown',
                type: child.type || 'Unknown'
              }))
            }
          }
        } catch (err) {
          console.error('Error fetching parent or sibling entities:', err)
          // Don't fail the whole request if fetch fails
        }
      }
    }
    
    // Return entity information with graph data
    return NextResponse.json({
      name: entityData.name || 'Unknown',
      id: entityData.id,
      type: entityData.concreteType,
      description: entityData.description || null,
      createdOn: entityData.createdOn || null,
      modifiedOn: entityData.modifiedOn || null,
      createdBy: entityData.createdBy || null,
      creatorInfo: creatorInfo,
      annotations: annotations,
      accessInfo: accessInfo,
      parentId: isProject ? null : (parentId || null),
      parentName: isProject ? null : parentName,
      parentDescription: parentDescription,
      projectId: projectId,
      projectName: projectName,
      projectWiki: projectWiki,
      siblings: siblings,
      synapseUrl: `https://www.synapse.org/#!Synapse:${synId}`,
    })
  } catch (error) {
    console.error('Error fetching Synapse entity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entity information. Please try again later.' },
      { status: 500 }
    )
  }
}

