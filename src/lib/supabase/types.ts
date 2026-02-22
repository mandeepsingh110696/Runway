export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
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
				};
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
export type GuideInsert = Database['public']['Tables']['guides']['Insert'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
