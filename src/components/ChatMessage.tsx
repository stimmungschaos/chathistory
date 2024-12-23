import { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useState, useMemo } from 'react';
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

  if (typeof badge === 'object' && Object.keys(badge).length === 1) {
    const [setID, version] = Object.entries(badge)[0];
    return {
      setID,
      version: String(version)
    };
  }
  
 
  if (badge.setID) {
    return {
      setID: badge.setID,
      version: String(badge.version || '1')
    };
  }

 
  if (typeof badge === 'string') {
    return {
      setID: badge,
      version: '1'
    };
  }

  debugLog('Unbekanntes Badge-Format:', badge);
  return null;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [chatColor, setChatColor] = useState<string>('#9147FF');
  const [badgeUrls, setBadgeUrls] = useState<Map<string, string>>(new Map());
  
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
      if (!message.badges) return;

      try {
        const urls = new Map<string, string>();
        
       
        const badgeEntries = Array.isArray(message.badges) 
          ? message.badges.map(processBadge)
          : Object.entries(message.badges).map(([setID, version]) => ({
              setID,
              version: String(version)
            }));

       
        const validBadges = badgeEntries.filter((badge): badge is { setID: string; version: string } => 
          badge !== null
        );

        const results = await Promise.all(
          validBadges.map(async badge => {
            try {
              const url = await getBadgeUrl(badge.setID, badge.version);
              return { setID: badge.setID, url };
            } catch (error) {
              debugLog(`Fehler beim Laden des Badge ${badge.setID}:`, error);
              return null;
            }
          })
        );

        results.forEach(result => {
          if (result && result.url) {
            urls.set(result.setID, result.url);
          }
        });
        
        setBadgeUrls(urls);
      } catch (error) {
        console.error('[ChatMessage] Error loading badge URLs:', error);
      }
    }

    loadBadgeUrls();
  }, [message.badges]);

 
  const badges = useMemo(() => {
    if (!message.badges) return [];
    
    const badgeEntries = Array.isArray(message.badges)
      ? message.badges
      : Object.entries(message.badges).map(([setID, version]) => ({
          setID,
          version: String(version),
          title: setID.replace(/-/g, ' ').replace(/_/g, ' ')
        }));

    return badgeEntries.filter(badge => badge !== null);
  }, [message.badges]);

  return (
    <div className="group px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 
                    rounded-lg transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden 
                      bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-200 
                      dark:ring-purple-800">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={message.commenter.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {message.commenter.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex -space-x-1">
              {badges.map((badge, index) => {
                const badgeUrl = badgeUrls.get(badge.setID);
                if (!badgeUrl) return null;
                
                return (
                  <div 
                    key={`${badge.setID}-${index}`}
                    className="w-5 h-5 rounded-full overflow-hidden ring-2 ring-white 
                             dark:ring-gray-800 hover:z-10 transition-all duration-200"
                    title={badge.title}
                  >
                    <img 
                      src={badgeUrl}
                      alt={badge.title}
                      className="w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
            
            <span 
              className="font-semibold truncate"
              style={{ color: chatColor }}
            >
              {message.commenter.display_name}
            </span>
            
            <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 
                           group-hover:opacity-100 transition-opacity duration-200">
              {formatDistanceToNow(new Date(parseInt(message.message.timestamp)), { 
                addSuffix: true, 
                locale: de 
              })}
            </span>
          </div>
          
          <div className="relative">
            <p className={`text-gray-800 dark:text-gray-200 break-words leading-relaxed
                        ${message.message.is_action ? 'italic text-purple-600 dark:text-purple-400' : ''}`}>
              {message.message.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 