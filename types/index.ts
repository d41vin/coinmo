export interface User {
  id: number;
  wallet_address: string;
  name: string;
  username: string;
  avatar_url?: string;
  created_at: Date;
}

export type FollowStatus = 'not_following' | 'pending' | 'accepted';

export interface Follow {
  id: number;
  follower_id: number;
  following_id: number;
  status: FollowStatus;
  created_at: Date;
}