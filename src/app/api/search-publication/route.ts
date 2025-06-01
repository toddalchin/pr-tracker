import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Search for publication circulation and readership data
    const searchResults = await searchPublicationData(query);
    
    return NextResponse.json({ 
      success: true, 
      results: searchResults,
      query: query 
    });

  } catch (error) {
    console.error('Publication search error:', error);
    return NextResponse.json(
      { error: 'Failed to search for publication data' }, 
      { status: 500 }
    );
  }
}

async function searchPublicationData(publicationName: string) {
  try {
    // Search for publication circulation and readership data
    const searchQuery = `"${publicationName}" monthly readership circulation 2024 media kit audience statistics`;
    
    console.log(`Searching for publication data: ${publicationName}`);
    console.log(`Search query: ${searchQuery}`);
    
    // Use web search to find real publication data
    const response = await fetch('/api/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });
    
    if (response.ok) {
      const searchData = await response.json();
      return parsePublicationDataFromSearch(publicationName, searchData);
    }
    
    return null;
    
  } catch (error) {
    console.error('Search API error:', error);
    return null;
  }
}

function parsePublicationDataFromSearch(publicationName: string, searchResults: any) {
  try {
    // Parse search results to extract circulation numbers
    const text = searchResults.content || '';
    
    // Look for patterns indicating readership/circulation
    const patterns = [
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|M)\s*(?:monthly|readers|visitors|unique)/gi,
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|K)\s*(?:monthly|readers|visitors|unique)/gi,
      /circulation:?\s*(\d+(?:,\d+)*)/gi,
      /readership:?\s*(\d+(?:,\d+)*)/gi,
      /monthly\s*(?:visitors|readers|audience):?\s*(\d+(?:,\d+)*)/gi
    ];
    
    let estimatedReach = 0;
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Extract the number and convert to estimated reach
        const numberStr = matches[0].match(/(\d+(?:,\d+)*(?:\.\d+)?)/)?.[0];
        if (numberStr) {
          const number = parseFloat(numberStr.replace(/,/g, ''));
          if (matches[0].toLowerCase().includes('million') || matches[0].toLowerCase().includes('m')) {
            estimatedReach = Math.max(estimatedReach, number * 1000000 * 0.02); // 2% of monthly readers
          } else if (matches[0].toLowerCase().includes('thousand') || matches[0].toLowerCase().includes('k')) {
            estimatedReach = Math.max(estimatedReach, number * 1000 * 0.02);
          } else {
            estimatedReach = Math.max(estimatedReach, number * 0.02);
          }
        }
      }
    }
    
    if (estimatedReach > 0) {
      return {
        name: publicationName,
        estimatedReach: Math.round(estimatedReach),
        dataSource: 'web_search',
        confidence: 'medium',
        category: categorizeFromSearch(text),
        tier: estimatedReach > 500000 ? 'tier1' : estimatedReach > 100000 ? 'tier2' : 'tier3'
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error parsing search results:', error);
    return null;
  }
}

function categorizeFromSearch(searchText: string): 'tech' | 'business' | 'general' | 'trade' | 'other' {
  const lowerText = searchText.toLowerCase();
  
  if (lowerText.includes('technology') || lowerText.includes('tech') || lowerText.includes('digital') || 
      lowerText.includes('software') || lowerText.includes('cybersecurity')) {
    return 'tech';
  }
  
  if (lowerText.includes('business') || lowerText.includes('finance') || lowerText.includes('economic') ||
      lowerText.includes('entrepreneur') || lowerText.includes('market')) {
    return 'business';
  }
  
  if (lowerText.includes('news') || lowerText.includes('daily') || lowerText.includes('times') ||
      lowerText.includes('post') || lowerText.includes('general')) {
    return 'general';
  }
  
  if (lowerText.includes('industry') || lowerText.includes('trade') || lowerText.includes('professional')) {
    return 'trade';
  }
  
  return 'other';
} 