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

// Versuche den Cache aus dem localStorage zu laden
const loadCache = () => {
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

// Speichere den Cache wenn neue URLs hinzugefügt werden
const saveCache = (key: string, value: string) => {
  badgeCache.set(key, value);
  try {
    localStorage.setItem('badge-cache', 
      JSON.stringify([...badgeCache.entries()]));
  } catch (error) {
    console.warn('[Badge] Failed to save cache:', error);
  }
};

// Badge ID Mapping
const BADGE_ID_MAP: Record<string, string> = {
  '1': 'moderator',      // Mod Badge
  '2': 'broadcaster',    // Streamer Badge
  '3': 'staff',         // Twitch Staff
  '4': 'admin',         // Twitch Admin
  '5': 'global_mod',    // Global Mod
  
  // Subscriber & Premium Badges
  '0': 'subscriber',     // Sub Badge
  '6': 'turbo',         // Turbo User
  '7': 'partner',       // Partner
  '8': 'premium',       // Premium User
  
  // Special Badges
  '9': 'bits',          // Bits Badge
  '10': 'sub-gift-leader', // Sub Gift Leader
  '11': 'sub-gifter',   // Sub Gifter
  '12': 'hype-train',   // Hype Train
  '13': 'vip',          // VIP
  '14': 'founder',      // Channel Founder
  
  // Weitere häufige Badges
  '15': 'bits-leader',  // Bits Leader
  '16': 'clip-champ',   // Clip Champ
  '17': 'predictions',  // Predictions
  '18': 'no_video',     // No Video
  '19': 'no_audio'      // No Audio
};

const DEBUG = process.env.NODE_ENV === 'development';

// Reduziere die Debug-Logs auf das Wesentliche
function debugLog(level: 'debug' | 'warn' | 'error', ...args: any[]) {
  if (!DEBUG && level === 'debug') return;
  
  console[level]('[Badge]', ...args);
}

// Tracking für wiederholte Logs
const logCounts = new Map<string, number>();
function shouldLog(key: string, frequency: number = 0.1): boolean {
  if (!DEBUG) return false;
  
  const count = (logCounts.get(key) || 0) + 1;
  logCounts.set(key, count);
  
  return Math.random() < frequency;
}

// Zusätzliche Debug-Informationen
debugLog('debug', '[Badge] Initialized with mappings:', Object.entries(BADGE_ID_MAP)
  .map(([id, name]) => `${id} -> ${name}`)
  .join(', '));

// Debug-Ausgabe der verfügbaren Mappings
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

  // Nur mappen wenn es eine numerische ID ist
  const mappedSetID = /^\d+$/.test(setID) ? BADGE_ID_MAP[setID] || setID : setID;
  const normalizedSetID = mappedSetID.replace(/-/g, '_');
  const cacheKey = `${normalizedSetID}-${versionStr}`;
  
  debugLog('debug', 'Badge lookup:', { 
    input: setID,
    isNumeric: /^\d+$/.test(setID),
    mapped: mappedSetID,
    normalized: normalizedSetID,
    version: versionStr
  });

  // Reduziere Mapping-Logs
  if (shouldLog('mapping')) {
    debugLog('debug', 'Mapping badge ID:', { 
      original: setID, 
      mapped: mappedSetID, 
      normalized: normalizedSetID 
    });
  }

  if (badgeCache.has(cacheKey)) {
    // Reduziere Cache-Hit Logs
    if (shouldLog('cache', 0.05)) {
      debugLog('debug', `Cache hit for ${normalizedSetID}-${versionStr}`);
    }
    return badgeCache.get(cacheKey) || '';
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
    
    // Debug: Liste alle verfügbaren Badge-IDs
    debugLog('debug', '[Badge] Available badge sets:', data.map((b: GlobalBadge) => b.set_id).join(', '));
    
    // Finde das Badge mit der entsprechenden setID
    const badge = data.find((b: GlobalBadge) => b.set_id === normalizedSetID);
    if (!badge) {
      debugLog('warn', `[Badge] Badge not found for setID: "${normalizedSetID}" (original: "${setID}")`);
      debugLog('debug', '[Badge] Available badges:', JSON.stringify(data.slice(0, 3), null, 2));
      return '';
    }

    // Debug: Zeige verfügbare Versionen
    debugLog('debug', `[Badge] Available versions for ${normalizedSetID}:`, 
      badge.versions.map(v => v.id).join(', '));

    // Finde die passende Version
    const badgeVersion = badge.versions.find(v => v.id === versionStr);
    if (!badgeVersion) {
      debugLog('warn', `[Badge] Version "${versionStr}" not found for badge "${normalizedSetID}"`);
      debugLog('debug', `[Badge] Available versions:`, JSON.stringify(badge.versions, null, 2));
      return '';
    }

    const badgeUrl = badgeVersion.image_url_4x;
    debugLog('debug', `[Badge] Found URL for ${normalizedSetID}-${versionStr}: ${badgeUrl}`);
    saveCache(cacheKey, badgeUrl);
    return badgeUrl;
  } catch (error) {
    debugLog('error', '[Badge] Error fetching badge:', error);
    return '';
  }
}

// Diese Funktion wird nur für die Badges aus der /user route verwendet
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