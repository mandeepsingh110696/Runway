'use client';

import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	type FilterKey,
	type GuideSortKey,
	guideCollectionId,
	guideIsFavorite,
	guideNotes,
	sortGuidesList,
} from '@/app/dashboard/dashboard-utils';
import { createClient } from '@/lib/supabase/client';
import type { Collection, Guide } from '@/lib/supabase/types';

/** Search, filters, sort, multi-select, bulk — one update shape. */
interface ListState {
	filter: FilterKey;
	guideSearch: string;
	guideSort: GuideSortKey;
	selectedGuideIds: string[];
	bulkBusy: boolean;
}

/** Modals, copy feedback, row saves — UI that sits “on top” of the list. */
interface OverlayState {
	copiedSlug: string | null;
	deletingGuideId: string | null;
	savingNoteGuideId: string | null;
	collectionModalOpen: boolean;
	newCollectionName: string;
	creatingCollection: boolean;
	deletingCollectionId: string | null;
	renamingCollection: { id: string; name: string } | null;
	renameCollectionName: string;
	savingRename: boolean;
}

const initialList = (): ListState => ({
	filter: 'all',
	guideSearch: '',
	guideSort: 'date_desc',
	selectedGuideIds: [],
	bulkBusy: false,
});

const initialOverlay = (): OverlayState => ({
	copiedSlug: null,
	deletingGuideId: null,
	savingNoteGuideId: null,
	collectionModalOpen: false,
	newCollectionName: '',
	creatingCollection: false,
	deletingCollectionId: null,
	renamingCollection: null,
	renameCollectionName: '',
	savingRename: false,
});

export function useDashboardLogic({
	user,
	initialGuides,
	initialCollections,
}: {
	user: User;
	initialGuides: Guide[];
	initialCollections: Collection[];
}) {
	const router = useRouter();
	const [guides, setGuides] = useState(initialGuides);
	const [collections, setCollections] = useState(initialCollections);
	const [list, setList] = useState<ListState>(initialList);
	const [overlay, setOverlay] = useState<OverlayState>(initialOverlay);
	const selectAllRef = useRef<HTMLInputElement>(null);

	const filteredGuides = useMemo(() => {
		if (list.filter === 'all') return guides;
		if (list.filter === 'starred') return guides.filter((g) => guideIsFavorite(g));
		if (list.filter === 'uncollected') return guides.filter((g) => !guideCollectionId(g));
		if (list.filter.startsWith('collection:')) {
			const id = list.filter.slice('collection:'.length);
			return guides.filter((g) => guideCollectionId(g) === id);
		}
		return guides;
	}, [guides, list.filter]);

	const searchNorm = list.guideSearch.trim().toLowerCase();

	const searchFilteredGuides = useMemo(() => {
		if (!searchNorm) return filteredGuides;
		return filteredGuides.filter((g) => {
			const name = (g.api_name ?? '').toLowerCase();
			const url = (g.spec_url ?? '').toLowerCase();
			const note = (guideNotes(g) ?? '').toLowerCase();
			return name.includes(searchNorm) || url.includes(searchNorm) || note.includes(searchNorm);
		});
	}, [filteredGuides, searchNorm]);

	const displayedGuides = useMemo(
		() => sortGuidesList(searchFilteredGuides, list.guideSort),
		[searchFilteredGuides, list.guideSort],
	);

	useEffect(() => {
		const visible = new Set(displayedGuides.map((g) => g.id));
		setList((prev) => {
			const next = prev.selectedGuideIds.filter((id) => visible.has(id));
			if (
				next.length === prev.selectedGuideIds.length &&
				next.every((id, i) => id === prev.selectedGuideIds[i])
			) {
				return prev;
			}
			return { ...prev, selectedGuideIds: next };
		});
	}, [displayedGuides]);

	const visibleIds = useMemo(() => displayedGuides.map((g) => g.id), [displayedGuides]);
	const selectedVisibleCount = useMemo(
		() => visibleIds.filter((id) => list.selectedGuideIds.includes(id)).length,
		[visibleIds, list.selectedGuideIds],
	);
	const allVisibleSelected =
		visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

	useEffect(() => {
		const el = selectAllRef.current;
		if (!el) return;
		el.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected;
	}, [selectedVisibleCount, allVisibleSelected]);

	const toggleGuideSelected = useCallback((id: string) => {
		setList((prev) => ({
			...prev,
			selectedGuideIds: prev.selectedGuideIds.includes(id)
				? prev.selectedGuideIds.filter((x) => x !== id)
				: [...prev.selectedGuideIds, id],
		}));
	}, []);

	const toggleSelectAllVisible = useCallback(() => {
		setList((prev) => {
			const allSelected =
				visibleIds.length > 0 && visibleIds.every((id) => prev.selectedGuideIds.includes(id));
			if (allSelected) {
				return {
					...prev,
					selectedGuideIds: prev.selectedGuideIds.filter((id) => !visibleIds.includes(id)),
				};
			}
			return {
				...prev,
				selectedGuideIds: [...new Set([...prev.selectedGuideIds, ...visibleIds])],
			};
		});
	}, [visibleIds]);

	const clearSelection = useCallback(() => {
		setList((prev) => ({ ...prev, selectedGuideIds: [] }));
	}, []);

	const handleBulkCollectionChange = useCallback(
		async (collectionId: string | null) => {
			const ids = list.selectedGuideIds;
			if (ids.length === 0) return;
			setList((prev) => ({ ...prev, bulkBusy: true }));
			const supabase = createClient();
			const { error } = await supabase
				.from('guides')
				.update({ collection_id: collectionId })
				.in('id', ids);
			setList((prev) => ({ ...prev, bulkBusy: false }));
			if (error) {
				toast.error(error.message || 'Could not update guides');
				return;
			}
			setGuides((prev) =>
				prev.map((g) =>
					ids.includes(g.id) ? ({ ...g, collection_id: collectionId } as Guide) : g,
				),
			);
			setList((prev) => ({ ...prev, selectedGuideIds: [] }));
			toast.success(
				collectionId
					? `Moved ${ids.length} guide${ids.length === 1 ? '' : 's'} to collection`
					: `Removed ${ids.length} guide${ids.length === 1 ? '' : 's'} from collection`,
			);
		},
		[list.selectedGuideIds],
	);

	const handleLogout = useCallback(async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push('/');
		router.refresh();
	}, [router]);

	const handleDelete = useCallback(async (guide: Guide) => {
		if (!window.confirm(`Delete “${guide.api_name}”? This guide will be removed from your dashboard.`)) {
			return;
		}
		setOverlay((o) => ({ ...o, deletingGuideId: guide.id }));
		const supabase = createClient();
		const { error } = await supabase.from('guides').delete().eq('id', guide.id);
		setOverlay((o) => ({ ...o, deletingGuideId: null }));
		if (error) {
			toast.error(error.message || 'Could not delete guide');
			return;
		}
		setGuides((prev) => prev.filter((g) => g.id !== guide.id));
		setList((prev) => ({
			...prev,
			selectedGuideIds: prev.selectedGuideIds.filter((id) => id !== guide.id),
		}));
		toast.success('Guide deleted');
	}, []);

	const handleCopyLink = useCallback(async (slug: string) => {
		const url = `${window.location.origin}/g/${slug}`;
		await navigator.clipboard.writeText(url);
		setOverlay((o) => ({ ...o, copiedSlug: slug }));
		toast.success('Link copied to clipboard');
		setTimeout(() => setOverlay((o) => ({ ...o, copiedSlug: null })), 2000);
	}, []);

	const handleToggleFavorite = useCallback(async (guide: Guide) => {
		const next = !guideIsFavorite(guide);
		const supabase = createClient();
		const { error } = await supabase
			.from('guides')
			.update({ is_favorite: next })
			.eq('id', guide.id);

		if (error) {
			toast.error(error.message || 'Could not update');
			return;
		}
		setGuides((prev) =>
			prev.map((g) => (g.id === guide.id ? ({ ...g, is_favorite: next } as Guide) : g)),
		);
		toast.success(next ? 'Added to starred' : 'Removed from starred');
	}, []);

	const handleNoteSave = useCallback(async (guideId: string, notes: string | null) => {
		setOverlay((o) => ({ ...o, savingNoteGuideId: guideId }));
		const supabase = createClient();
		const { error } = await supabase.from('guides').update({ notes }).eq('id', guideId);
		setOverlay((o) => ({ ...o, savingNoteGuideId: null }));
		if (error) {
			toast.error(error.message || 'Could not save note');
			return false;
		}
		setGuides((prev) =>
			prev.map((g) => (g.id === guideId ? ({ ...g, notes } as Guide) : g)),
		);
		return true;
	}, []);

	const handleCollectionChange = useCallback(
		async (guideId: string, collectionId: string | null) => {
			const supabase = createClient();
			const { error } = await supabase
				.from('guides')
				.update({ collection_id: collectionId })
				.eq('id', guideId);

			if (error) {
				toast.error(error.message || 'Could not move guide');
				return;
			}
			setGuides((prev) =>
				prev.map((g) => (g.id === guideId ? ({ ...g, collection_id: collectionId } as Guide) : g)),
			);
			toast.success(collectionId ? 'Moved to collection' : 'Removed from collection');
		},
		[],
	);

	const handleCreateCollection = useCallback(async () => {
		const name = overlay.newCollectionName.trim();
		if (!name) return;
		setOverlay((o) => ({ ...o, creatingCollection: true }));
		const supabase = createClient();
		const { data, error } = await supabase
			.from('collections')
			.insert({ user_id: user.id, name })
			.select()
			.single();

		setOverlay((o) => ({ ...o, creatingCollection: false }));
		if (error) {
			toast.error(error.message || 'Could not create collection');
			return;
		}
		setCollections((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
		setOverlay((o) => ({
			...o,
			newCollectionName: '',
			collectionModalOpen: false,
		}));
		toast.success('Collection created');
	}, [overlay.newCollectionName, user.id]);

	const handleDeleteCollection = useCallback(async (c: { id: string; name: string }) => {
		if (
			!window.confirm(
				`Delete '${c.name}'? Guides in this collection will be moved to 'No collection'.`,
			)
		) {
			return;
		}
		setOverlay((o) => ({ ...o, deletingCollectionId: c.id }));
		const supabase = createClient();
		const { error } = await supabase.from('collections').delete().eq('id', c.id);
		setOverlay((o) => ({ ...o, deletingCollectionId: null }));
		if (error) {
			toast.error(error.message || 'Could not delete collection');
			return;
		}
		setCollections((prev) => prev.filter((x) => x.id !== c.id));
		setGuides((prev) =>
			prev.map((g) =>
				guideCollectionId(g) === c.id ? ({ ...g, collection_id: null } as Guide) : g,
			),
		);
		setList((prev) =>
			prev.filter === `collection:${c.id}` ? { ...prev, filter: 'all' } : prev,
		);
		toast.success('Collection deleted');
	}, []);

	const handleRenameCollection = useCallback(async () => {
		const target = overlay.renamingCollection;
		if (!target || !overlay.renameCollectionName.trim()) return;
		const name = overlay.renameCollectionName.trim();
		if (name === target.name) {
			setOverlay((o) => ({ ...o, renamingCollection: null, renameCollectionName: '' }));
			return;
		}
		const collectionId = target.id;
		setOverlay((o) => ({ ...o, savingRename: true }));
		const supabase = createClient();
		const { error } = await supabase.from('collections').update({ name }).eq('id', collectionId);
		setOverlay((o) => ({ ...o, savingRename: false }));
		if (error) {
			toast.error(error.message || 'Could not rename collection');
			return;
		}
		setCollections((prev) =>
			prev
				.map((c) => (c.id === collectionId ? { ...c, name } : c))
				.sort((a, b) => a.name.localeCompare(b.name)),
		);
		setOverlay((o) => ({ ...o, renamingCollection: null, renameCollectionName: '' }));
		toast.success('Collection renamed');
	}, [overlay.renamingCollection, overlay.renameCollectionName]);

	const starredCount = guides.filter((g) => guideIsFavorite(g)).length;
	const uncollectedCount = guides.filter((g) => !guideCollectionId(g)).length;

	return {
		guides,
		collections,
		filter: list.filter,
		setFilter: (f: FilterKey) => setList((p) => ({ ...p, filter: f })),
		guideSearch: list.guideSearch,
		setGuideSearch: (s: string) => setList((p) => ({ ...p, guideSearch: s })),
		guideSort: list.guideSort,
		setGuideSort: (s: GuideSortKey) => setList((p) => ({ ...p, guideSort: s })),
		selectedGuideIds: list.selectedGuideIds,
		bulkBusy: list.bulkBusy,
		copiedSlug: overlay.copiedSlug,
		deletingId: overlay.deletingGuideId,
		savingNoteId: overlay.savingNoteGuideId,
		collectionDialogOpen: overlay.collectionModalOpen,
		setCollectionDialogOpen: (open: boolean) =>
			setOverlay((o) => ({ ...o, collectionModalOpen: open })),
		newCollectionName: overlay.newCollectionName,
		setNewCollectionName: (name: string) =>
			setOverlay((o) => ({ ...o, newCollectionName: name })),
		creatingCollection: overlay.creatingCollection,
		deletingCollectionId: overlay.deletingCollectionId,
		renamingCollection: overlay.renamingCollection,
		renameCollectionName: overlay.renameCollectionName,
		setRenameCollectionName: (name: string) =>
			setOverlay((o) => ({ ...o, renameCollectionName: name })),
		savingRename: overlay.savingRename,
		openRenameCollection: (c: { id: string; name: string }) =>
			setOverlay((o) => ({
				...o,
				renamingCollection: { id: c.id, name: c.name },
				renameCollectionName: c.name,
			})),
		closeRenameCollection: () =>
			setOverlay((o) => ({ ...o, renamingCollection: null, renameCollectionName: '' })),
		// computed
		filteredGuides,
		searchFilteredGuides,
		displayedGuides,
		visibleIds,
		selectedVisibleCount,
		allVisibleSelected,
		starredCount,
		uncollectedCount,
		// refs
		selectAllRef,
		// handlers
		toggleGuideSelected,
		toggleSelectAllVisible,
		clearSelection,
		handleBulkCollectionChange,
		handleLogout,
		handleDelete,
		handleCopyLink,
		handleToggleFavorite,
		handleNoteSave,
		handleCollectionChange,
		handleCreateCollection,
		handleDeleteCollection,
		handleRenameCollection,
	};
}
