import { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { fetchUserProfile } from '@/services/twitchService';
import { getBadgeUrl } from '@/services/badgeService';

interface ChatMessageProps {
  message: ChatMessageType;
}

const DEBUG = process.env.NODE_ENV === 'development';
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.debug('[ChatMessage]', ...args);
  }
}

function processBadge(badge: any) {
  // Für Channel-Badges (Format: { "vip": "1" })
  if (typeof badge === 'object' && Object.keys(badge).length === 1) {
    const [setID, version] = Object.entries(badge)[0];
    return {
      setID,
      version: String(version)
    };
  }
  
  // Für Homepage-Badges (Format: { setID: "...", version: "..." })
  if (badge.setID) {
    return {
      setID: badge.setID,
      version: String(badge.version || '1')
    };
  }

  console.warn('[ChatMessage] Unknown badge format:', badge);
  return null;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [chatColor, setChatColor] = useState<string>('#9147FF');
  const [badgeUrls, setBadgeUrls] = useState<Map<string, string>>(new Map());
  const timestamp = new Date(parseInt(message.message.timestamp));
  
  useEffect(() => {
    async function loadProfileData() {
      const profile = await fetchUserProfile(message.commenter.display_name.toLowerCase());
      if (profile) {
        setProfileImage(profile.profileImageURL);
        if (profile.chatColor) {
          setChatColor(profile.chatColor);
        }
      }
    }
    
    loadProfileData();
  }, [message.commenter.display_name]);

  useEffect(() => {
    async function loadBadgeUrls() {
      if (!message.badges || !Array.isArray(message.badges)) {
        return;
      }

      console.log('Raw badge data (stringified):', JSON.stringify(message.badges, null, 2));
      console.log('Badge data type:', typeof message.badges);
      console.log('Is array?', Array.isArray(message.badges));
      console.log('First badge:', message.badges[0]);
      
      try {
        const urls = new Map<string, string>();
        
        const badgeEntries = message.badges
          .map(processBadge)
          .filter((entry): entry is { setID: string; version: string } => entry !== null);

        console.log('Processed badge entries:', badgeEntries);

        if (DEBUG && badgeEntries.length > 0) {
          debugLog('Processing badges:', badgeEntries);
        }

        const results = await Promise.all(
          badgeEntries.map(async badge => {
            const url = await getBadgeUrl(badge.setID, badge.version);
            return { setID: badge.setID, url };
          })
        );

        results.forEach(({ setID, url }) => {
          if (url) {
            urls.set(setID, url);
          } else {
            debugLog('Failed to load URL for badge:', setID);
          }
        });
        
        if (urls.size > 0) {
          debugLog('Loaded badge URLs:', [...urls.entries()]);
        } else {
          debugLog('No valid badge URLs loaded');
        }
        
        setBadgeUrls(urls);
      } catch (error) {
        console.error('[ChatMessage] Error loading badge URLs:', error);
      }
    }

    loadBadgeUrls();
  }, [message.badges]);

  const badges = Array.isArray(message.badges) 
    ? message.badges
        .map(processBadge)
        .filter((entry): entry is { setID: string; version: string; title: string } => {
          if (!entry) return false;
          return { ...entry, title: entry.setID };
        })
    : [];

  if (DEBUG && badges.length > 0) {
    debugLog('Processed badges for rendering:', badges);
  }

  return (
    <div className="group px-4 py-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/30">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={message.commenter.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {message.commenter.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex -space-x-1">
              {badges.map((badge, index) => {
                const badgeUrl = badgeUrls.get(badge.setID);
                if (!badgeUrl) {
                  debugLog('No URL for badge:', badge.setID);
                  return null;
                }
                
                return (
                  <div 
                    key={`${badge.setID}-${index}`}
                    className="w-4 h-4 rounded-full overflow-hidden ring-1 ring-white dark:ring-gray-800"
                    title={badge.title || badge.setID}
                  >
                    <img 
                      src={badgeUrl}
                      alt={badge.title || badge.setID}
                      className="w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
            
            <span 
              className="font-medium truncate"
              style={{ color: chatColor }}
            >
              {message.commenter.display_name}
            </span>
            
            <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatDistanceToNow(timestamp, { addSuffix: true, locale: de })}
            </span>
          </div>
          
          <div className="relative">
            <p className={`text-gray-800 dark:text-gray-200 break-words ${
              message.message.is_action ? 'italic text-purple-600 dark:text-purple-400' : ''
            }`}>
              {message.message.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 