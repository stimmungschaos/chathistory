import { NextRequest, NextResponse } from 'next/server';

const IVR_API_URL = 'https://api.ivr.fi/v2';

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${IVR_API_URL}/twitch/badges/global`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TwitchChatHistory/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch badge data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
  
    const badgeMap = data.reduce((acc: Record<string, string[]>, badge: any) => {
      acc[badge.set_id] = badge.versions.map((v: any) => v.id);
      return acc;
    }, {});

    return NextResponse.json({
      total: data.length,
      badges: badgeMap
    });
  } catch (error) {
    console.error('Error fetching badge data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 