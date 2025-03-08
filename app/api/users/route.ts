import { NextResponse } from 'next/server';
import { createUser, getUserByWallet, checkUsernameExists } from '@/lib/db';

// POST route to create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, name, username } = body;

    // Check if user already exists
    const existingUser = await getUserByWallet(walletAddress);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await createUser({ walletAddress, name, username });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// GET route to fetch user by wallet address
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const user = await getUserByWallet(walletAddress);
    return NextResponse.json(user || { exists: false });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}