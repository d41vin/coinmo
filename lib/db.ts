import { neon } from "@neondatabase/serverless";
import { User, FollowStatus } from "@/types";

const sql = neon(process.env.DATABASE_URL!);

// User Operations
export async function createUser(data: {
  walletAddress: string;
  name: string;
  username: string;
}): Promise<User> {
  const user = await sql`
    INSERT INTO users (wallet_address, name, username)
    VALUES (${data.walletAddress}, ${data.name}, ${data.username})
    RETURNING *
  `;
  return user[0];
}

export async function getUserByWallet(
  walletAddress: string,
): Promise<User | null> {
  const users = await sql`
    SELECT * FROM users WHERE wallet_address = ${walletAddress}
  `;
  return users[0] || null;
}

export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const users = await sql`
    SELECT * FROM users 
    WHERE LOWER(username) = LOWER(${username})
  `;
  return users[0] || null;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS(SELECT 1 FROM users WHERE username = ${username})
  `;
  return result[0].exists;
}

// Follow Operations
export async function followUser(followerId: number, followingId: number) {
  return sql`
    INSERT INTO follows (follower_id, following_id)
    VALUES (${followerId}, ${followingId})
    RETURNING *
  `;
}

export async function unfollowUser(followerId: number, followingId: number) {
  return sql`
    DELETE FROM follows
    WHERE follower_id = ${followerId} AND following_id = ${followingId}
    RETURNING *
  `;
}

export async function acceptFollow(followerId: number, followingId: number) {
  return sql`
    UPDATE follows
    SET status = 'accepted'
    WHERE follower_id = ${followerId} AND following_id = ${followingId}
    RETURNING *
  `;
}

export async function getFollowStatus(
  followerId: number,
  followingId: number,
): Promise<FollowStatus> {
  const result = await sql`
    SELECT status FROM follows
    WHERE follower_id = ${Number(followerId)} AND following_id = ${Number(followingId)}
  `;
  return result[0]?.status || "not_following";
}

export async function getPendingFollowRequests(userId: number) {
  return sql`
    SELECT f.*, u.username, u.name, u.avatar_url
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ${userId} AND f.status = 'pending'
  `;
}
