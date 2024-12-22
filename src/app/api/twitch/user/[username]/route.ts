import { NextRequest, NextResponse } from 'next/server';

const IVR_API_URL = 'https://api.ivr.fi/v2';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
): Promise<NextResponse> {
  const params = await context.params;
  const username = params.username;

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${IVR_API_URL}/twitch/user?login=${username}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TwitchChatHistory/1.0'
        },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 