// Publication data with estimated reach and logo information
export interface PublicationInfo {
  name: string;
  estimatedReach: number;
  logo?: string;
  category: 'tech' | 'business' | 'general' | 'trade' | 'other';
  tier: 'tier1' | 'tier2' | 'tier3';
}

// Common publication data - this could be expanded or fetched from an API
export const publicationDatabase: Record<string, PublicationInfo> = {
  'TechCrunch': {
    name: 'TechCrunch',
    estimatedReach: 15000000,
    category: 'tech',
    tier: 'tier1'
  },
  'Forbes': {
    name: 'Forbes',
    estimatedReach: 120000000,
    category: 'business',
    tier: 'tier1'
  },
  'Wall Street Journal': {
    name: 'Wall Street Journal',
    estimatedReach: 40000000,
    category: 'business',
    tier: 'tier1'
  },
  'New York Times': {
    name: 'New York Times',
    estimatedReach: 130000000,
    category: 'general',
    tier: 'tier1'
  },
  'Wired': {
    name: 'Wired',
    estimatedReach: 25000000,
    category: 'tech',
    tier: 'tier1'
  },
  'Fast Company': {
    name: 'Fast Company',
    estimatedReach: 8000000,
    category: 'business',
    tier: 'tier2'
  },
  'Inc.': {
    name: 'Inc.',
    estimatedReach: 12000000,
    category: 'business',
    tier: 'tier2'
  },
  'Entrepreneur': {
    name: 'Entrepreneur',
    estimatedReach: 6000000,
    category: 'business',
    tier: 'tier2'
  },
  'VentureBeat': {
    name: 'VentureBeat',
    estimatedReach: 4000000,
    category: 'tech',
    tier: 'tier2'
  },
  'The Verge': {
    name: 'The Verge',
    estimatedReach: 20000000,
    category: 'tech',
    tier: 'tier1'
  },
  'Ars Technica': {
    name: 'Ars Technica',
    estimatedReach: 8000000,
    category: 'tech',
    tier: 'tier2'
  },
  'Mashable': {
    name: 'Mashable',
    estimatedReach: 15000000,
    category: 'tech',
    tier: 'tier2'
  },
  'Business Insider': {
    name: 'Business Insider',
    estimatedReach: 35000000,
    category: 'business',
    tier: 'tier1'
  },
  'CNBC': {
    name: 'CNBC',
    estimatedReach: 45000000,
    category: 'business',
    tier: 'tier1'
  },
  'Bloomberg': {
    name: 'Bloomberg',
    estimatedReach: 40000000,
    category: 'business',
    tier: 'tier1'
  },
  'Reuters': {
    name: 'Reuters',
    estimatedReach: 50000000,
    category: 'general',
    tier: 'tier1'
  },
  'Associated Press': {
    name: 'Associated Press',
    estimatedReach: 60000000,
    category: 'general',
    tier: 'tier1'
  },
  'USA Today': {
    name: 'USA Today',
    estimatedReach: 35000000,
    category: 'general',
    tier: 'tier1'
  },
  'Washington Post': {
    name: 'Washington Post',
    estimatedReach: 45000000,
    category: 'general',
    tier: 'tier1'
  },
  'CNN': {
    name: 'CNN',
    estimatedReach: 80000000,
    category: 'general',
    tier: 'tier1'
  },
  'BBC': {
    name: 'BBC',
    estimatedReach: 100000000,
    category: 'general',
    tier: 'tier1'
  }
};

// Function to get publication info with fuzzy matching
export function getPublicationInfo(outletName: string): PublicationInfo {
  const cleanName = outletName.trim();
  
  // Direct match
  if (publicationDatabase[cleanName]) {
    return publicationDatabase[cleanName];
  }
  
  // Fuzzy matching
  const lowerName = cleanName.toLowerCase();
  for (const [key, value] of Object.entries(publicationDatabase)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default for unknown publications
  return {
    name: cleanName,
    estimatedReach: estimateReachByName(cleanName),
    category: 'other',
    tier: 'tier3'
  };
}

// Estimate reach based on publication name patterns
function estimateReachByName(name: string): number {
  const lowerName = name.toLowerCase();
  
  // Major indicators
  if (lowerName.includes('times') || lowerName.includes('post') || lowerName.includes('journal')) {
    return 25000000; // Major newspaper
  }
  if (lowerName.includes('tech') || lowerName.includes('wired') || lowerName.includes('digital')) {
    return 5000000; // Tech publication
  }
  if (lowerName.includes('business') || lowerName.includes('finance') || lowerName.includes('money')) {
    return 8000000; // Business publication
  }
  if (lowerName.includes('local') || lowerName.includes('city') || lowerName.includes('county')) {
    return 500000; // Local publication
  }
  if (lowerName.includes('blog') || lowerName.includes('newsletter')) {
    return 50000; // Blog/newsletter
  }
  
  // Default estimate
  return 1000000;
}

// Get logo URL for publication (placeholder function)
export function getPublicationLogo(outletName: string): string {
  // This could be enhanced to fetch actual logos from a service
  // For now, return a placeholder or use a logo API
  const cleanName = outletName.toLowerCase().replace(/\s+/g, '');
  return `https://logo.clearbit.com/${cleanName}.com`;
} 