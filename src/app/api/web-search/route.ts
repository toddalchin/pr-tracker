import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`Performing web search for: ${query}`);
    
    // Use the actual web search functionality
    const searchResults = await performWebSearch(query);
    
    return NextResponse.json({
      success: true,
      query: query,
      content: searchResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { error: 'Web search failed' }, 
      { status: 500 }
    );
  }
}

async function performWebSearch(query: string): Promise<string> {
  try {
    // Make a request to use web search capability
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Search for current information about: ${query}. Focus on finding specific circulation numbers, monthly readership, or audience data for publications.`
          }
        ],
        tools: [{ type: 'web_search' }],
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the content from the response
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content || '';
    }
    
    return '';
    
  } catch (error) {
    console.error('Search operation failed:', error);
    throw error;
  }
}

function extractPublicationName(query: string): string {
  // Extract the publication name from the search query
  const match = query.match(/"([^"]+)"/);
  return match ? match[1] : 'Publication';
} 