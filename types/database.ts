/**
 * Database types generated from Supabase
 * Run: supabase gen types typescript --local > types/database.ts
 * 
 * This is a placeholder - actual types will be generated after schema migration
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          uid: string
          email: string
          nickname: string
          avatar: string | null
          theme: string
          created_at: string
          last_login_at: string | null
        }
        Insert: {
          uid?: string
          email: string
          nickname: string
          avatar?: string | null
          theme?: string
          created_at?: string
          last_login_at?: string | null
        }
        Update: {
          uid?: string
          email?: string
          nickname?: string
          avatar?: string | null
          theme?: string
          created_at?: string
          last_login_at?: string | null
        }
      }
      rooms: {
        Row: {
          id: string
          type: 'public' | 'private'
          name: string
          description: string | null
          created_by: string
          key_hash: string | null
          last_activity_at: string
          ttl_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: 'public' | 'private'
          name: string
          description?: string | null
          created_by: string
          key_hash?: string | null
          last_activity_at?: string
          ttl_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'public' | 'private'
          name?: string
          description?: string | null
          created_by?: string
          key_hash?: string | null
          last_activity_at?: string
          ttl_at?: string | null
          created_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      users_public: {
        Row: {
          uid: string
          nickname: string
          avatar: string | null
          theme: string
          created_at: string
        }
      }
    }
    Functions: {
      generate_uid: {
        Args: Record<string, never>
        Returns: string
      }
      purge_user_data: {
        Args: { target_uid: string }
        Returns: void
      }
    }
  }
}














