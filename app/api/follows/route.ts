import { NextRequest, NextResponse } from 'next/server';
import { followUser, unfollowUser, acceptFollow } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { followerId, followingId, action } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'follow':
        result = await followUser(followerId, followingId);
        break;
      case 'unfollow':
        result = await unfollowUser(followerId, followingId);
        break;
      case 'accept':
        result = await acceptFollow(followerId, followingId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error handling follow action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}