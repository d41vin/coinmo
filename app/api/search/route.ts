import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const currentUser = searchParams.get('currentUser');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Search for users by name or username, excluding the current user
    const users = await sql`
      SELECT 
        u.id,
        u.username,
        u.name,
        u.avatar_url,
        CASE 
          WHEN f.status IS NULL THEN 'not_following'
          ELSE f.status
        END as follow_status
      FROM users u
      LEFT JOIN follows f ON 
        f.following_id = u.id AND 
        f.follower_id = (SELECT id FROM users WHERE wallet_address = ${currentUser})
      WHERE 
        u.wallet_address != ${currentUser} AND
        (
          LOWER(u.username) LIKE ${`%${query.toLowerCase()}%`} OR 
          LOWER(u.name) LIKE ${`%${query.toLowerCase()}%`}
        )
      LIMIT 10
    `;

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}