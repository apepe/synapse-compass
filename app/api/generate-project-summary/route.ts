import { NextRequest, NextResponse } from 'next/server'

// Helper to clean markdown for prompt
function cleanMarkdown(markdown: string): string {
  let cleaned = markdown
    .replace(/\${[^}]+}/g, '') // Remove Synapse template variables
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remove links, keep text
    .replace(/!\[(.*?)\]\((.*?)\)/g, '') // Remove images
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italics
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove inline code
    .replace(/^- /gm, '') // Remove list markers
    .replace(/\n\s*\n/g, '\n') // Reduce multiple newlines to single
    .trim()
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { projectName, projectWiki } = await request.json()

    if (!projectWiki) {
      return NextResponse.json(
        { error: 'Project wiki is required' },
        { status: 400 }
      )
    }

    const cleanedWiki = cleanMarkdown(projectWiki)

    const prompt = `You are an AI assistant providing a concise summary of a Synapse.org project.
Based on the following project wiki content, generate a brief summary in 2-3 sentences that explains what this project is about, its purpose, and key information.

Project Name: ${projectName || 'Unknown Project'}

Project Wiki Content:
${cleanedWiki.substring(0, 3000)}

Generate a concise summary:`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

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
            content: 'You are a helpful assistant that provides clear, concise summaries of scientific research projects on Synapse.org. Your summaries should be informative, accurate, and written in a natural, conversational style.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content || 'Unable to generate summary.'

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating project summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate project summary' },
      { status: 500 }
    )
  }
}

