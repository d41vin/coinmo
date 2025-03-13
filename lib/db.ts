import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export type User = {
  id: number;
  username: string;
  name: string;
  wallet_address: string;
  avatar_url: string | null;
  created_at: string;
};

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await sql<User[]>`
    SELECT * FROM users 
    WHERE LOWER(username) = LOWER(${username})
  `;
  return users[0] || null;
}
