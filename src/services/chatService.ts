import type { ChatResponse } from '@/types/chat';

const API_BASE_URL = 'https://recent-messages.robotty.de/api/v2';

function parseIRCMessage(rawMessage: string) {
  const parts: { [key: string]: string } = {};
  
  // Parse Tags
  if (rawMessage.startsWith('@')) {
    const [tagsSection, ...messageParts] = rawMessage.split(' ');
    const tags = tagsSection.slice(1).split(';'); // Remove @ and split tags
    
    tags.forEach(tag => {
      const [key, value] = tag.split('=');
      parts[key] = value;
    });
    
    // Rekonstruiere die Nachricht ohne Tags
    rawMessage = messageParts.join(' ');
  }

  // Finde den tatsächlichen Nachrichteninhalt
  const matches = rawMessage.match(/:(\S+)!\S+ PRIVMSG #(\S+) :(.+)$/);
  if (!matches) return null;

  const [, username, channel, messageText] = matches;

  return {
    id: parts['id'] || Math.random().toString(36).substring(2),
    channel: parts['room-id'] || channel,
    commenter: {
      display_name: parts['display-name'] || username,
      _id: parts['user-id'] || 'anonymous'
    },
    message: {
      body: messageText.trim(),
      timestamp: parts['tmi-sent-ts'] || Date.now().toString(),
      is_action: messageText.startsWith('\u0001ACTION ') && messageText.endsWith('\u0001')
    },
    badges: parts['badges'] ? 
      parts['badges'].split(',').map(badge => {
        const [key, value] = badge.split('/');
        return { [key]: value };
      }) : []
  };
}

export async function fetchChatHistory(channel: string): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/recent-messages/${channel}?limit=100`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error('Invalid API response format');
    }

    const messages = data.messages
      .filter((msg: string) => msg.includes('PRIVMSG'))
      .map(parseIRCMessage)
      .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
      .reverse();
    
    return { messages };
  } catch (error) {
    console.error('Error in fetchChatHistory:', error);
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
    };
  }
} 