// Shared data utility functions
export const cleanText = (text: string | undefined | null): string => {
  return text?.toString().trim() || '';
};

export const generateIntelligentTitle = (item: any): string => {
  const articleTitle = cleanText(String(item['Article '] || item.Article || ''));
  const outlet = cleanText(String(item.Outlet || ''));
  const type = cleanText(String(item.Type || ''));
  const client = cleanText(String(item['Client (if applicable)'] || item.Client || ''));
  const reporter = cleanText(String(item.Reporter || ''));
  
  // Create intelligent descriptions using Type + context
  if (type && articleTitle && outlet) {
    const typeMap: Record<string, string> = {
      'quote/inclusion': 'Included a quote',
      'quote': 'Included a quote',
      'inclusion': 'Included a quote',
      'feature': 'Featured',
      'q&a': 'Participated in Q&A',
      'qa': 'Participated in Q&A',
      'interview': 'Interviewed',
      'byline': 'Authored byline',
      'op-ed': 'Published op-ed',
      'guest post': 'Wrote guest post',
      'mention': 'Mentioned',
      'commentary': 'Provided commentary',
      'analysis': 'Provided analysis'
    };
    
    const normalizedType = type.toLowerCase().replace(/[^a-z0-9&]/g, '');
    const action = typeMap[normalizedType] || `Contributed to`;
    
    // Create contextual description
    if (client && client !== 'general coverage') {
      // Extract topic/theme from article title (first few meaningful words)
      const titleWords = articleTitle.toLowerCase().split(' ');
      const meaningfulWords = titleWords.filter(word => 
        word.length > 3 && 
        !['this', 'that', 'with', 'from', 'they', 'their', 'will', 'have', 'been', 'are'].includes(word)
      ).slice(0, 3);
      
      if (meaningfulWords.length > 0) {
        const topic = meaningfulWords.join(' ');
        return `${action} about ${topic} in ${outlet}`;
      } else {
        return `${action} regarding ${client} in ${outlet}`;
      }
    } else {
      // Use article title or generic description
      const shortTitle = articleTitle.length > 40 ? 
        articleTitle.substring(0, 40).trim() + '...' : 
        articleTitle;
      return `${action} "${shortTitle}" in ${outlet}`;
    }
  }
  
  // Fallback to original logic if Type info isn't available
  if (articleTitle) {
    return articleTitle;
  }
  
  // Enhanced fallback strategies
  if (client && outlet) {
    return `${client} coverage in ${outlet}`;
  } else if (outlet && item.Date) {
    const date = new Date(String(item.Date));
    if (!isNaN(date.getTime())) {
      return `${outlet} article (${date.toLocaleDateString()})`;
    }
    return `${outlet} feature`;
  } else if (reporter && outlet) {
    return `${reporter}'s piece in ${outlet}`;
  } else if (outlet) {
    return `${outlet} feature`;
  }
  
  return `Media coverage`;
};

export const createUniqueKey = (item: any): string => {
  // Create a unique identifier for deduplication
  const date = String(item.Date || '').trim();
  const outlet = String(item.Outlet || '').trim().toLowerCase();
  const article = String(item['Article '] || item.Article || '').trim().toLowerCase();
  const reporter = String(item.Reporter || '').trim().toLowerCase();
  
  // Use combination of date, outlet, and article title (or reporter if no title)
  if (article) {
    return `${date}-${outlet}-${article}`;
  } else {
    return `${date}-${outlet}-${reporter}`;
  }
};

export const deduplicateItems = (items: any[]): any[] => {
  const seen = new Set<string>();
  const uniqueItems: any[] = [];
  
  for (const item of items) {
    const key = createUniqueKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }
  
  return uniqueItems;
};

// Format date helper
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Format numbers with commas
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
}; 