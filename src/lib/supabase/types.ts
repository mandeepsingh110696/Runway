export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			collections: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					name: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					name?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			guides: {
				Row: {
					id: string;
					slug: string;
					api_name: string;
					spec_url: string | null;
					parsed_data: Json;
					created_at: string;
					user_id: string | null;
					view_count: number;
					is_favorite: boolean;
					collection_id: string | null;
				};
				Insert: {
					id?: string;
					slug: string;
					api_name: string;
					spec_url?: string | null;
					parsed_data: Json;
					created_at?: string;
					user_id?: string | null;
					view_count?: number;
					is_favorite?: boolean;
					collection_id?: string | null;
				};
				Update: {
					id?: string;
					slug?: string;
					api_name?: string;
					spec_url?: string | null;
					parsed_data?: Json;
					created_at?: string;
					user_id?: string | null;
					view_count?: number;
					is_favorite?: boolean;
					collection_id?: string | null;
				};
				Relationships: [];
			};
			events: {
				Row: {
					id: string;
					guide_id: string | null;
					event_type: string;
					api_domain: string | null;
					created_at: string;
					metadata: Json;
				};
				Insert: {
					id?: string;
					guide_id?: string | null;
					event_type: string;
					api_domain?: string | null;
					created_at?: string;
					metadata?: Json;
				};
				Update: {
					id?: string;
					guide_id?: string | null;
					event_type?: string;
					api_domain?: string | null;
					created_at?: string;
					metadata?: Json;
				};
				Relationships: [];
			};
		};
		Views: {
			api_usage: {
				Row: {
					api_domain: string | null;
					guide_count: number | null;
					total_events: number | null;
					last_activity: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			increment_view_count: {
				Args: { guide_slug: string };
				Returns: undefined;
			};
		};
	};
}

export type Guide = Database['public']['Tables']['guides']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type GuideInsert = Database['public']['Tables']['guides']['Insert'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
