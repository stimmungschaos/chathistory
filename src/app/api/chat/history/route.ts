import { NextRequest, NextResponse } from 'next/server';
import { fetchChatHistory } from '@/services/chatService';

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetchChatHistory(channel.toLowerCase());
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      channel,
      messages: response.messages
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 