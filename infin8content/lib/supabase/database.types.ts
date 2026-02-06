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
      [key: string]: any;
      publish_references: {
        Row: {
          id: string;
          article_id: string;
          platform: string;
          platform_post_id: string;
          platform_url: string;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          platform: string;
          platform_post_id: string;
          platform_url: string;
          published_at: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          platform?: string;
          platform_post_id?: string;
          platform_url?: string;
          published_at?: string;
        };
      };
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
    CompositeTypes: {
      [key: string]: any;
    };
  };
}