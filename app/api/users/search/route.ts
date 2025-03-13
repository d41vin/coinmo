import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get('q');
  
  if (!searchQuery) {
    return NextResponse.json([]);
  }

  try {
    const users = await sql`
      SELECT id, username, name, wallet_address
      FROM users
      WHERE 
        username ILIKE ${`%${searchQuery}%`} OR
        name ILIKE ${`%${searchQuery}%`}
      LIMIT 10
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}