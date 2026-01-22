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
          cms_type: 'wordpress';
          published_url: string;
          external_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          cms_type: 'wordpress';
          published_url: string;
          external_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          cms_type?: 'wordpress';
          published_url?: string;
          external_id?: string;
          updated_at?: string;
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