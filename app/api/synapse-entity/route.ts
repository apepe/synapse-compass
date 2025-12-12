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
    // Fetch entity information from Synapse.org REST API
    // The Synapse REST API endpoint for entity metadata
    const synapseApiUrl = `https://repo-prod.prod.sagebase.org/repo/v1/entity/${synId}`
    
    const response = await fetch(synapseApiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Entity not found. The SynID may be invalid or you may not have access.' },
          { status: 404 }
        )
      }
      
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Synapse API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const entityData = await response.json()
    
    // Return the entity name (and potentially other metadata later)
    return NextResponse.json({
      name: entityData.name || 'Unknown',
      id: entityData.id,
      type: entityData.concreteType,
      // We can add more fields here as needed
    })
  } catch (error) {
    console.error('Error fetching Synapse entity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entity information. Please try again later.' },
      { status: 500 }
    )
  }
}

