import { NextRequest, NextResponse } from 'next/server';
import { getPendingFollowRequests } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const pendingRequests = await getPendingFollowRequests(parseInt(userId));
    return NextResponse.json({ pendingRequests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}