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
            profilePicUrl: creatorData.profilePicureFileHandleId 
              ? `https://www.synapse.org/portal/ProfileImage/${creatorData.profilePicureFileHandleId}`
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
    let accessInfo: { canView: boolean; canEdit: boolean; canDownload: boolean; accessControlList: any[] } | null = null
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
      }
    } catch (err) {
      // ACL might not be accessible, that's okay
      console.error('Error fetching ACL:', err)
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
      parentId: parentId || null,
      parentName: parentName,
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

