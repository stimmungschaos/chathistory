import { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { fetchUserProfile } from '@/services/twitchService';
import { getBadgeUrl } from '@/services/badgeService';

interface ChatMessageProps {
  message: ChatMessageType;
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
      const urls = new Map<string, string>();
      for (const badge of message.badges) {
        const url = await getBadgeUrl(badge.setID, badge.version);
        urls.set(badge.setID, url);
      }
      setBadgeUrls(urls);
    }

    loadBadgeUrls();
  }, [message.badges]);

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
              {message.badges.map((badge, index) => {
                const badgeUrl = badgeUrls.get(badge.setID);
                if (!badgeUrl) return null;
                
                return (
                  <div 
                    key={index}
                    className="w-4 h-4 rounded-full overflow-hidden ring-1 ring-white dark:ring-gray-800"
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