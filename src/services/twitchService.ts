interface TwitchUser {
  id: string;
  login: string;
  displayName: string;
  profileImageURL: string;
  chatColor: string;
  badges: {
    setID: string;
    title: string;
    description: string;
    version: string;
  }[];
}

// Cache für Profilbilder
const profileCache = new Map<string, TwitchUser>();

export async function fetchUserProfile(username: string): Promise<TwitchUser | null> {
  try {
    // Prüfe zuerst den Cache
    if (profileCache.has(username)) {
      return profileCache.get(username) || null;
    }

    const response = await fetch(`/api/twitch/user/${username}`);
    
    if (!response.ok) {
      console.warn(`Could not fetch profile for ${username}`);
      return null;
    }
    
    const [data] = await response.json();
    if (!data) return null;

    const user = {
      id: data.id,
      login: data.login,
      displayName: data.displayName,
      profileImageURL: data.logo,
      chatColor: data.chatColor,
      badges: data.badges || []
    };

    // Speichere im Cache
    profileCache.set(username, user);
    
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
} 