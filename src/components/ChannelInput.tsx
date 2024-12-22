'use client';

import { useState } from 'react';

interface ChannelInputProps {
  onSubmit: (channel: string) => void;
}

export default function ChannelInput({ onSubmit }: ChannelInputProps) {
  const [channel, setChannel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channel.trim()) {
      const cleanChannel = channel.trim().replace(/^#/, '');
      onSubmit(cleanChannel);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">#</span>
          </div>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Kanalnamen eingeben (z.B. xqc)"
            className="w-full pl-8 pr-4 py-3 rounded-l-lg border-2 border-r-0 border-gray-200 
                     dark:border-gray-700 bg-white dark:bg-gray-800 
                     focus:outline-none focus:border-purple-500 dark:focus:border-purple-500
                     text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={!channel.trim()}
          className="px-6 py-3 bg-purple-600 text-white rounded-r-lg border-2 border-purple-600
                   hover:bg-purple-700 hover:border-purple-700 
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200"
        >
          Suchen
        </button>
      </form>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Geben Sie den Kanalnamen ohne # ein
      </p>
    </div>
  );
} 