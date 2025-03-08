import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    // Drop tables in correct order (follows first due to foreign key)
    await sql`DROP TABLE IF EXISTS follows CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    return NextResponse.json({ message: 'Tables deleted successfully' });
  } catch (error) {
    console.error('Error deleting tables:', error);
    return NextResponse.json(
      { error: 'Failed to delete tables' },
      { status: 500 }
    );
  }
}