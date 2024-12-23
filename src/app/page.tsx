'use client';

import { useEffect, useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from '@/components/ChatMessage';

const POLLING_INTERVAL = 30000;  
const MAX_MESSAGES = 100;

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [channel, setChannel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function fetchMessages() {
    if (!channel) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/history?channel=${encodeURIComponent(channel)}`);
      if (!response.ok) return;

      const data = await response.json();
      
      setMessages(prevMessages => {
        const newMessages = data.messages || [];
        if (prevMessages.length === 0) return newMessages;

        const lastTimestamp = prevMessages[0]?.message.timestamp;
        const updates = newMessages.filter(msg => 
          parseInt(msg.message.timestamp) > parseInt(lastTimestamp)
        );

        return [...updates, ...prevMessages].slice(0, MAX_MESSAGES);
      });
      
      setLastFetch(Date.now());
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }

  
  useEffect(() => {
    if (!channel) return;

    const interval = setInterval(() => {
      if (Date.now() - lastFetch >= POLLING_INTERVAL) {
        fetchMessages();
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [channel, lastFetch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('channel') as HTMLInputElement;
    
    if (input.value) {
      setChannel(input.value.toLowerCase());
      setMessages([]); 
      fetchMessages();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Twitch Chat Historie
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sehen Sie sich den Chat-Verlauf eines Twitch-Kanals an
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                name="channel"
                placeholder="Twitch Kanal Name"
                className="flex-grow p-3 rounded-lg border-2 border-purple-200 dark:border-purple-900
                         bg-white dark:bg-gray-800 
                         focus:border-purple-500 dark:focus:border-purple-400
                         focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900
                         focus:outline-none transition-all duration-200
                         text-gray-900 dark:text-white placeholder-gray-400"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg
                         hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                         transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Lädt...</span>
                  </div>
                ) : (
                  'Chat laden'
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg p-4">
          {messages.map((message, index) => (
            <ChatMessage 
              key={`${message.message.timestamp}-${index}`}
              message={message} 
            />
          ))}
        </div>
      </div>
    </main>
  );
}
