export interface Database {
  public: {
    Tables: {
      memories: {
        Row: {
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
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description: string;
          date: string;
          location?: string;
          category: string;
          is_public: boolean;
          images: string[];
          author_id: string;
          author_name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string;
          date?: string;
          location?: string;
          category?: string;
          is_public?: boolean;
          images?: string[];
          author_id?: string;
          author_name?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          created_at: string;
          memory_id: string;
          user_id: string;
          reaction_type: string;
          user_name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          memory_id: string;
          user_id: string;
          reaction_type: string;
          user_name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          memory_id?: string;
          user_id?: string;
          reaction_type?: string;
          user_name?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          memory_id: string;
          user_id: string;
          content: string;
          user_name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          memory_id: string;
          user_id: string;
          content: string;
          user_name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          memory_id?: string;
          user_id?: string;
          content?: string;
          user_name?: string;
        };
      };
    };
  };
}

export type Memory = Database['public']['Tables']['memories']['Row'];
export type Reaction = Database['public']['Tables']['reactions']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];