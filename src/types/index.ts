export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  relationship_status: 'single' | 'in_relationship' | 'married' | 'complicated' | 'prefer_not_to_say';
  is_public_profile: boolean;
  default_post_privacy?: boolean;
}

export interface SelectedUser {
  id: string;
  display_name: string;
}

export interface Relationship {
  id: string;
  created_at: string;
  updated_at: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  relationship_type: 'romantic' | 'partnership' | 'friendship' | 'other';
  is_primary: boolean;
  partner_id?: string;
  partner_name?: string;
}

export interface MemoryParticipant {
  id: string;
  created_at: string;
  memory_id: string;
  user_id: string;
  user_name: string;
}

export interface Memory {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  category: string;
  is_public: boolean;
  images: string[];
  author_id: string;
  author_name: string;
  reactions?: Reaction[];
  comments?: Comment[];
  participants?: MemoryParticipant[];
}

export interface Reaction {
  id: string;
  created_at: string;
  memory_id: string;
  user_id: string;
  reaction_type: 'heart' | 'smile' | 'celebration';
  user_name: string;
}

export interface Comment {
  id: string;
  created_at: string;
  memory_id: string;
  user_id: string;
  content: string;
  user_name: string;
}

export type MemoryCategory = 
  | 'first_date'
  | 'anniversary'
  | 'proposal'
  | 'wedding'
  | 'vacation'
  | 'milestone'
  | 'special_moment'
  | 'everyday_joy';