import type { Guide } from '@/lib/supabase/types';

export type FilterKey = 'all' | 'starred' | 'uncollected' | `collection:${string}`;

export type GuideSortKey =
	| 'starred_first'
	| 'name_asc'
	| 'name_desc'
	| 'date_desc'
	| 'date_asc'
	| 'views_desc'
	| 'views_asc';

export const NOTE_MAX_LEN = 500;

export function guideIsFavorite(g: Guide): boolean {
	return (g as Guide & { is_favorite?: boolean }).is_favorite ?? false;
}

export function guideCollectionId(g: Guide): string | null {
	return (g as Guide & { collection_id?: string | null }).collection_id ?? null;
}

export function guideNotes(g: Guide): string | null {
	return (g as Guide & { notes?: string | null }).notes ?? null;
}

function compareGuidesForSort(a: Guide, b: Guide, sort: GuideSortKey): number {
	const favA = guideIsFavorite(a) ? 1 : 0;
	const favB = guideIsFavorite(b) ? 1 : 0;
	const dateA = new Date(a.created_at).getTime();
	const dateB = new Date(b.created_at).getTime();
	const nameCmp = (a.api_name || '').localeCompare(b.api_name || '', undefined, { sensitivity: 'base' });

	switch (sort) {
		case 'starred_first':
			if (favA !== favB) return favB - favA;
			return dateB - dateA;
		case 'name_asc':
			return nameCmp || dateB - dateA;
		case 'name_desc':
			return -nameCmp || dateB - dateA;
		case 'date_desc':
			return dateB - dateA || nameCmp;
		case 'date_asc':
			return dateA - dateB || nameCmp;
		case 'views_desc':
			return b.view_count - a.view_count || dateB - dateA;
		case 'views_asc':
			return a.view_count - b.view_count || dateB - dateA;
		default:
			return 0;
	}
}

export function sortGuidesList(list: Guide[], sort: GuideSortKey): Guide[] {
	return [...list].sort((a, b) => compareGuidesForSort(a, b, sort));
}
