import React from 'react';
import TwitchFetcher from 'twitch-fetcher';

// Initialisiere den Fetcher mit den erforderlichen Credentials
const fetcher = new TwitchFetcher({
  auth: {
    clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
    accessToken: process.env.NEXT_PUBLIC_TWITCH_ACCESS_TOKEN!
  }
});

// Prüfe, ob die Credentials vorhanden sind
if (!process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || !process.env.NEXT_PUBLIC_TWITCH_ACCESS_TOKEN) {
  console.warn('[EmoteService] Twitch Credentials fehlen. Twitch Emotes werden nicht verfügbar sein.');
}

export interface EmoteData {
  id: string;
  name: string;
  url: string;
}

// Cache für Emotes pro Kanal
const emoteCache = new Map<string, Map<string, EmoteData>>();

export async function getEmotesForChannel(channel: string): Promise<Map<string, EmoteData>> {
  // Prüfe Cache
  if (emoteCache.has(channel)) {
    return emoteCache.get(channel)!;
  }

  try {
    // Hole Emotes von allen Services (7TV, BTTV, FFZ)
    const emotes = await fetcher.getEmotesByUsername(channel, ['7tv', 'bttv', 'ffz']);
    
    // Erstelle Map für schnellen Zugriff
    const emoteMap = new Map<string, EmoteData>();
    
    emotes.forEach(emote => {
      emoteMap.set(emote.name, {
        id: emote.id,
        name: emote.name,
        url: emote.urls[1] || emote.url // Versuche 2x Auflösung, falls verfügbar
      });
    });

    // Speichere im Cache
    emoteCache.set(channel, emoteMap);
    
    return emoteMap;
  } catch (error) {
    console.error('[EmoteService] Fehler beim Laden der Emotes:', error);
    return new Map();
  }
}

export function replaceEmotesInText(text: string, emotes: Map<string, EmoteData>): React.ReactNode[] {
  const words = text.split(' ');
  const result: React.ReactNode[] = [];
  
  words.forEach((word, index) => {
    const emote = emotes.get(word);
    
    if (emote) {
      result.push(
        React.createElement('img', {
          key: `${emote.id}-${index}`,
          src: emote.url,
          alt: emote.name,
          title: emote.name,
          className: "inline-block h-6 align-middle"
        })
      );
    } else {
      result.push(
        React.createElement('span', { key: index },
          index > 0 ? ' ' : '',
          word
        )
      );
    }
  });
  
  return result;
} 