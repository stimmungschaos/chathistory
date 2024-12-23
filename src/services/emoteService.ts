import TwitchFetcher from 'twitch-fetcher';

const fetcher = new TwitchFetcher();

interface EmoteData {
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
    // Hole Emotes von allen Services
    const emotes = await fetcher.getEmotesByUsername(channel, ['7tv', 'bttv', 'ffz']);
    
    // Erstelle Map für schnellen Zugriff
    const emoteMap = new Map<string, EmoteData>();
    
    emotes.forEach(emote => {
      emoteMap.set(emote.name, {
        id: emote.id,
        name: emote.name,
        url: emote.url // oder emote.urls[1] für 2x Auflösung
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

export function replaceEmotesInText(text: string, emotes: Map<string, EmoteData>): JSX.Element[] {
  const words = text.split(' ');
  const result: JSX.Element[] = [];
  
  words.forEach((word, index) => {
    const emote = emotes.get(word);
    
    if (emote) {
      result.push(
        <img 
          key={`${emote.id}-${index}`}
          src={emote.url}
          alt={emote.name}
          title={emote.name}
          className="inline-block h-6 align-middle"
        />
      );
    } else {
      result.push(
        <span key={index}>
          {index > 0 ? ' ' : ''}{word}
        </span>
      );
    }
  });
  
  return result;
} 