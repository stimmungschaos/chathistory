import type { Badge } from '@/types/chat';

interface BadgeVersion {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
  click_action: string | null;
  click_url: string | null;
}

interface GlobalBadge {
  set_id: string;
  versions: BadgeVersion[];
}

interface UserBadge {
  setID: string;
  title: string;
  description: string;
  version: string;
}

const badgeCache = new Map<string, string>();

export async function getBadgeUrl(setID: string, version: string = '1'): Promise<string> {
  const cacheKey = `${setID}-${version}`;
  
  if (badgeCache.has(cacheKey)) {
    return badgeCache.get(cacheKey) || '';
  }

  try {
    const response = await fetch('/api/twitch/badges/global');
    if (!response.ok) {
      console.error('Failed to fetch badges:', response.status);
      return '';
    }
    
    const data = await response.json();
    
    // Finde das Badge mit der entsprechenden setID
    const badge = data.find((b: GlobalBadge) => b.set_id === setID);
    if (badge) {
      // Finde die passende Version
      const badgeVersion = badge.versions.find(v => v.id === version);
      if (badgeVersion) {
        const badgeUrl = badgeVersion.image_url_4x;
        badgeCache.set(cacheKey, badgeUrl);
        return badgeUrl;
      }
    }
    
    // Fallback auf CDN-URL
    const fallbackUrl = `https://static-cdn.jtvnw.net/badges/v1/${setID}/${version}/3`;
    badgeCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;
  } catch (error) {
    console.error('Error fetching badge:', error);
    return '';
  }
}

// Diese Funktion wird nur für die Badges aus der /user route verwendet
export function parseBadges(badgeData: any[]): Badge[] {
  if (!Array.isArray(badgeData)) return [];
  
  return badgeData.map(badge => {
    // Die Badges kommen bereits im richtigen Format von der /user route
    return {
      setID: badge.setID,
      title: badge.title,
      description: badge.description,
      version: badge.version
    };
  });
} 