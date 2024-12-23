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


const loadCache = () => {
 
  if (typeof window === 'undefined') {
    return new Map();
  }

  try {
    const cached = localStorage.getItem('badge-cache');
    if (cached) {
      return new Map(JSON.parse(cached));
    }
  } catch (error) {
    console.warn('[Badge] Failed to load cache:', error);
  }
  return new Map();
};

const badgeCache = loadCache();


const saveCache = (key: string, value: string) => {
 
  if (typeof window === 'undefined') {
    return;
  }

  badgeCache.set(key, value);
  try {
    localStorage.setItem('badge-cache', 
      JSON.stringify([...badgeCache.entries()]));
  } catch (error) {
    console.warn('[Badge] Failed to save cache:', error);
  }
};


const BADGE_ID_MAP: Record<string, string> = {
 
  'moderator': 'moderator',
  'broadcaster': 'broadcaster',
  'staff': 'staff',
 
  'vip': 'vip',
  

  'subscriber': 'subscriber',
  'turbo': 'turbo',
  'partner': 'partner',
  'prime': 'prime',
  

  'bits': 'bits',
  'sub-gift-leader': 'sub-gift-leader',
  'sub-gifter': 'sub-gifter',
  'hype-train': 'hype-train',
  'founder': 'founder',
  
 
  'bits-leader': 'bits-leader',
  'clip-champ': 'clip-champ',
  'predictions': 'predictions',
  'no_video': 'no_video',
  'no_audio': 'no_audio',
  
  'muted': 'no_audio',
  'no-watching': 'no_video'
};

const DEBUG = process.env.NODE_ENV === 'development';


function debugLog(level: 'debug' | 'warn' | 'error', ...args: any[]) {
  if (!DEBUG && level === 'debug') return;
  
  console[level]('[Badge]', ...args);
}


const logCounts = new Map<string, number>();
function shouldLog(key: string, frequency: number = 0.1): boolean {
  if (!DEBUG) return false;
  
  const count = (logCounts.get(key) || 0) + 1;
  logCounts.set(key, count);
  
  return Math.random() < frequency;
}


debugLog('debug', '[Badge] Initialized with mappings:', Object.entries(BADGE_ID_MAP)
  .map(([id, name]) => `${id} -> ${name}`)
  .join(', '));

debugLog('debug', 'Available badge mappings:', 
  Object.entries(BADGE_ID_MAP)
    .map(([id, name]) => `${id} (${name})`)
    .join(', ')
);

export async function getBadgeUrl(setID?: string, version: string | object = '1'): Promise<string> {
  const versionStr = typeof version === 'object' ? '1' : String(version);
  
  if (!setID || typeof setID !== 'string') {
    debugLog('warn', 'Invalid or missing setID:', { setID, version: versionStr });
    return '';
  }


  const mappedSetID = BADGE_ID_MAP[setID] || setID;
  const normalizedSetID = mappedSetID.replace(/-/g, '_');
  
  debugLog('debug', 'Badge lookup:', { 
    input: setID,
    mapped: mappedSetID,
    normalized: normalizedSetID,
    version: versionStr
  });

 
  if (shouldLog('mapping')) {
    debugLog('debug', 'Mapping badge ID:', { 
      original: setID, 
      mapped: mappedSetID, 
      normalized: normalizedSetID 
    });
  }

  if (badgeCache.has(normalizedSetID)) {
  
    if (shouldLog('cache', 0.05)) {
      debugLog('debug', `Cache hit for ${normalizedSetID}-${versionStr}`);
    }
    return badgeCache.get(normalizedSetID) || '';
  }

  try {
    debugLog('debug', `[Badge] Fetching badge for setID: ${normalizedSetID}, version: ${versionStr}`);
    const response = await fetch('/api/twitch/badges/global');
    if (!response.ok) {
      debugLog('warn', `[Badge] Failed to fetch badges: ${response.status} ${response.statusText}`);
      return '';
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      debugLog('error', '[Badge] Invalid API response - expected array:', data);
      return '';
    }
    
    debugLog('debug', `[Badge] Received ${data.length} global badges`);
    debugLog('debug', '[Badge] Looking for badge:', { 
      originalSetID: setID,
      normalizedSetID,
      version: versionStr,
      availableSets: data.map((b: GlobalBadge) => b.set_id).slice(0, 5)
    });
    
  
    debugLog('debug', '[Badge] Available badge sets:', data.map((b: GlobalBadge) => b.set_id).join(', '));
    

    const badge = data.find((b: GlobalBadge) => b.set_id === normalizedSetID);
    if (!badge) {
      debugLog('warn', `[Badge] Badge not found for setID: "${normalizedSetID}" (original: "${setID}")`);
      debugLog('debug', '[Badge] Available badges:', JSON.stringify(data.slice(0, 3), null, 2));
      return '';
    }

  
    debugLog('debug', `[Badge] Available versions for ${normalizedSetID}:`, 
      badge.versions.map(v => v.id).join(', '));

  
    const badgeVersion = badge.versions.find(v => v.id === versionStr);
    if (!badgeVersion) {
      debugLog('warn', `[Badge] Version "${versionStr}" not found for badge "${normalizedSetID}"`);
      debugLog('debug', `[Badge] Available versions:`, JSON.stringify(badge.versions, null, 2));
      return '';
    }

    const badgeUrl = badgeVersion.image_url_4x;
    debugLog('debug', `[Badge] Found URL for ${normalizedSetID}-${versionStr}: ${badgeUrl}`);
    saveCache(normalizedSetID, badgeUrl);
    return badgeUrl;
  } catch (error) {
    debugLog('error', '[Badge] Error fetching badge:', error);
    return '';
  }
}


export function parseBadges(badgeData: any[]): Badge[] {
  if (!badgeData || !Array.isArray(badgeData)) {
    debugLog('error', '[Badge] No badges or invalid badge data:', badgeData);
    return [];
  }
  
  return badgeData
    .filter(badge => {
      if (!badge || typeof badge !== 'object') {
        debugLog('error', '[Badge] Invalid badge object:', badge);
        return false;
      }

      if (!badge.setID || typeof badge.setID !== 'string') {
        debugLog('error', '[Badge] Badge missing valid setID:', badge);
        return false;
      }

      if (!badge.version && badge.version !== 0) {
        debugLog('error', '[Badge] Badge missing version:', badge);
        return false;
      }

      return true;
    })
    .map(badge => ({
      setID: badge.setID,
      title: badge.title || '',
      description: badge.description || '',
      version: String(badge.version || '1')
    }));
}

async function discoverBadgeMappings() {
  try {
    const response = await fetch('/api/twitch/badges/debug');
    const data = await response.json();
    debugLog('debug', '[Badge] Discovered badge mappings:', data);
    return data;
  } catch (error) {
    debugLog('error', '[Badge] Failed to discover badge mappings:', error);
    return null;
  }
} 