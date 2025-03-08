import { NextRequest, NextResponse } from 'next/server';
import { getFollowStatus, getUserByWallet } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerWallet = searchParams.get('follower');
    const followingId = searchParams.get('following');

    if (!followerWallet || !followingId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the follower's user ID from their wallet address
    const follower = await getUserByWallet(followerWallet);
    if (!follower) {
      return NextResponse.json({ status: 'not_following' });
    }

    const status = await getFollowStatus(follower.id, parseInt(followingId));
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
