'use client';

import { useState } from 'react';
import ChannelInput from '@/components/ChannelInput';
import ChatMessage from '@/components/ChatMessage';
import { fetchChatHistory } from '@/services/chatService';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChannelSubmit = async (channel: string) => {
    console.log('Submitting channel:', channel); // Debug-Log
    
    setLoading(true);
    setError(null);
    setMessages([]); // Reset messages
    
    try {
      const response = await fetchChatHistory(channel);
      console.log('Chat history response:', response); // Debug-Log
      
      if (response.error) {
        setError(response.error);
      } else if (response.messages.length === 0) {
        setError('Keine Nachrichten gefunden für diesen Kanal');
      } else {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Error in handleChannelSubmit:', err); // Debug-Log
      setError('Ein Fehler ist beim Laden der Nachrichten aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Twitch Chat History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Durchsuchen Sie die Chat-Historie von Twitch-Kanälen
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <ChannelInput onSubmit={handleChannelSubmit} />
            </div>

            {/* Messages Section */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                </div>
              )}
              
              {error && (
                <div className="p-6">
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                    {error}
                  </div>
                </div>
              )}
              
              {!loading && !error && messages.length > 0 && (
                <div className="max-h-[600px] overflow-y-auto">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </div>
              )}
              
              {!loading && !error && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <svg
                    className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Geben Sie einen Kanalnamen ein, um die Chat-Historie zu sehen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
