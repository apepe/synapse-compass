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
    
    // Fetch sibling entities (children of the parent folder)
    let siblings: Array<{ id: string; name: string; type: string }> = []
    let parentName: string | null = null
    let parentDescription: string | null = null
    let projectWiki: string | null = null
    const parentId = entityData.parentId
    
    if (parentId) {
      try {
        // Fetch parent entity to get its name
        const parentResponse = await fetch(`${baseUrl}/entity/${parentId}`, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (parentResponse.ok) {
          const parentData = await parentResponse.json()
          parentName = parentData.name || 'Parent Folder'
          parentDescription = parentData.description || null
          
          // Try to fetch wiki content for the project
          try {
            const wikiListResponse = await fetch(`${baseUrl}/entity/${parentId}/wiki2`, {
              headers: {
                'Accept': 'application/json',
              },
            })
            
            if (wikiListResponse.ok) {
              const wikiListData = await wikiListResponse.json()
              if (wikiListData && wikiListData.id) {
                const wikiResponse = await fetch(
                  `${baseUrl}/entity/${parentId}/wiki/${wikiListData.id}`,
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
      parentId: parentId || null,
      parentName: parentName,
      parentDescription: parentDescription,
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

