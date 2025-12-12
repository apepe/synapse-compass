import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { entityName, entityType, entityDescription, parentName, parentDescription, projectName, projectWiki } = await request.json()

    if (!entityName || !entityType) {
      return NextResponse.json(
        { error: 'Entity name and type are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build context for ChatGPT
    let context = `Entity: ${entityName}\nType: ${entityType}\n`
    
    if (entityDescription) {
      context += `Description: ${entityDescription}\n`
    }
    
    if (projectName || parentName) {
      context += `Project: ${projectName || parentName}\n`
    }
    
    if (parentDescription) {
      context += `Project Description: ${parentDescription}\n`
    }
    
    if (projectWiki) {
      // Clean up wiki content - remove markdown syntax that might confuse the model
      const cleanWiki = projectWiki
        .replace(/\${[^}]+}/g, '') // Remove Synapse template variables
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert markdown links to plain text
        .substring(0, 2000) // Limit length
      context += `Project Wiki Content:\n${cleanWiki}\n`
    }

    const prompt = `You are a helpful assistant that provides clear, informative descriptions of Synapse.org entities. Based on the following information, generate a comprehensive, natural-sounding description in the style of ChatGPT. Be specific and informative, but concise (2-3 sentences). Focus on what the entity is, its purpose, and its context within the project.

${context}

Generate a description:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides clear, informative descriptions of scientific data entities on Synapse.org. Your descriptions should be accurate, comprehensive, and written in a natural, conversational style similar to ChatGPT.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate description' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const description = data.choices[0]?.message?.content || 'Unable to generate description.'

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}

