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
    
    // Build breadcrumb trail by fetching parent entities
    const breadcrumbs: Array<{ id: string; name: string; type: string }> = []
    let currentEntity = entityData
    
    // Add current entity to breadcrumbs
    breadcrumbs.unshift({
      id: currentEntity.id,
      name: currentEntity.name || 'Unknown',
      type: currentEntity.concreteType || 'Unknown'
    })
    
    // Fetch parent entities to build hierarchy
    let parentId = currentEntity.parentId
    let depth = 0
    const maxDepth = 10 // Prevent infinite loops
    
    while (parentId && depth < maxDepth) {
      try {
        const parentResponse = await fetch(`${baseUrl}/entity/${parentId}`, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (parentResponse.ok) {
          const parentData = await parentResponse.json()
          breadcrumbs.unshift({
            id: parentData.id,
            name: parentData.name || 'Unknown',
            type: parentData.concreteType || 'Unknown'
          })
          parentId = parentData.parentId
          depth++
        } else {
          break
        }
      } catch (err) {
        console.error(`Error fetching parent ${parentId}:`, err)
        break
      }
    }
    
    // Try to fetch wiki content for the project (first breadcrumb if it's a project)
    let wikiContent: string | null = null
    const projectEntity = breadcrumbs.find(b => b.type.includes('Project'))
    
    if (projectEntity) {
      try {
        // Get the root wiki page for the project
        const wikiListResponse = await fetch(`${baseUrl}/entity/${projectEntity.id}/wiki2`, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (wikiListResponse.ok) {
          const wikiListData = await wikiListResponse.json()
          // wiki2 returns a single wiki object (the root wiki)
          if (wikiListData && wikiListData.id) {
            // Fetch the wiki content by ID - this returns the markdown directly
            const wikiResponse = await fetch(
              `${baseUrl}/entity/${projectEntity.id}/wiki/${wikiListData.id}`,
              {
                headers: {
                  'Accept': 'application/json',
                },
              }
            )
            
            if (wikiResponse.ok) {
              const wikiData = await wikiResponse.json()
              // The markdown content is in the 'markdown' field
              if (wikiData.markdown) {
                wikiContent = wikiData.markdown
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching wiki content:', err)
        // Don't fail the whole request if wiki fetch fails
      }
    }
    
    // Return comprehensive entity information
    return NextResponse.json({
      name: entityData.name || 'Unknown',
      id: entityData.id,
      type: entityData.concreteType,
      description: entityData.description || null,
      createdOn: entityData.createdOn || null,
      modifiedOn: entityData.modifiedOn || null,
      breadcrumbs: breadcrumbs,
      project: projectEntity || null,
      wikiContent: wikiContent,
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

