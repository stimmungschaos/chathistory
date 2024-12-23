export interface Badge {
  setID: string;
  title: string;
  description: string;
  version: string;
}

export interface ChatMessage {
  message: {
    body: string;
    timestamp: string;
    is_action: boolean;
  };
  commenter: {
    display_name: string;
  };
  badges: {
    [key: string]: string;
  };
  channel: string;
}

export interface ChatResponse {
  messages: ChatMessage[];
  error?: string;
} 