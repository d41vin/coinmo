import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { from, amount, requestor } = await request.json();

    const result = await sql`
      INSERT INTO payment_requests (
        from_address,
        amount,
        requestor_address,
        status
      ) VALUES (
        ${from},
        ${amount},
        ${requestor},
        'pending'
      ) RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating payment request:', error);
    return NextResponse.json(
      { error: 'Failed to create payment request' },
      { status: 500 }
    );
  }
}