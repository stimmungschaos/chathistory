export interface Badge {
  setID: string;
  title: string;
  description: string;
  version: string;
}

export interface ChatMessage {
  id: string;
  channel: string;
  commenter: {
    display_name: string;
    _id: string;
  };
  message: {
    body: string;
    timestamp: string;
    is_action: boolean;
  };
  badges: Badge[];
}

export interface ChatResponse {
  messages: ChatMessage[];
  error?: string;
} 