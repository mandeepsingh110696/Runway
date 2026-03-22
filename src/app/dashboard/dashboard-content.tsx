'use client';

import type { User } from '@supabase/supabase-js';
import {
	Calendar,
	ChevronDown,
	Copy,
	ExternalLink,
	Eye,
	FileCode,
	FolderPlus,
	LogOut,
	Pencil,
	Plus,
	Search,
	Star,
	Trash2,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	guideCollectionId,
	guideIsFavorite,
	guideNotes,
	NOTE_MAX_LEN,
	type GuideSortKey,
} from '@/app/dashboard/dashboard-utils';
import { useDashboardLogic } from '@/app/dashboard/use-dashboard-logic';
import type { Collection, Guide } from '@/lib/supabase/types';

function GuideNotesField({
	guideId,
	initialNotes,
	disabled,
	onSave,
}: {
	guideId: string;
	initialNotes: string | null;
	disabled?: boolean;
	onSave: (id: string, notes: string | null) => Promise<boolean>;
}) {
	// Initial value only; parent remounts via key when guide.id or saved notes change.
	const [value, setValue] = useState(() => initialNotes ?? '');

	const savedNorm =
		(initialNotes ?? '').trim() === '' ? null : (initialNotes ?? '').trim();
	const draftNorm = value.trim() === '' ? null : value.trim();
	const isDirty = draftNorm !== savedNorm;

	const handleSaveNote = async () => {
		if (!isDirty) return;
		const next = draftNorm;
		const ok = await onSave(guideId, next);
		if (ok) {
			toast.success('Note saved');
		} else {
			setValue(initialNotes ?? '');
		}
	};

	return (
		<div className="space-y-1.5 pt-1 sm:max-w-xl">
			<label htmlFor={`notes-${guideId}`} className="text-xs font-medium text-muted-foreground">
				Note
			</label>
			<Textarea
				id={`notes-${guideId}`}
				value={value}
				disabled={disabled}
				onChange={(e) => setValue(e.target.value.slice(0, NOTE_MAX_LEN))}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						void handleSaveNote();
					}
				}}
				placeholder="Private note (only you)…"
				rows={2}
				maxLength={NOTE_MAX_LEN}
				className="min-h-[4.5rem] resize-y text-sm"
			/>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-[10px] text-muted-foreground tabular-nums">
					{value.length}/{NOTE_MAX_LEN}
				</p>
				<div className="flex items-center gap-2">
					<span className="text-[10px] text-muted-foreground hidden sm:inline">
						⌘/Ctrl+Enter to save
					</span>
					<Button
						type="button"
						size="sm"
						variant={isDirty && !disabled ? 'default' : 'secondary'}
						className={
							isDirty && !disabled ? 'shadow-sm shadow-primary/25' : undefined
						}
						disabled={!isDirty || disabled}
						onClick={() => void handleSaveNote()}
					>
						Save note
					</Button>
				</div>
			</div>
		</div>
	);
}

interface DashboardContentProps {
	user: User;
	guides: Guide[];
	collections: Collection[];
}

export function DashboardContent({
	user,
	guides: initialGuides,
	collections: initialCollections,
}: DashboardContentProps) {
	const {
		guides,
		collections,
		filter,
		setFilter,
		guideSearch,
		setGuideSearch,
		guideSort,
		setGuideSort,
		selectedGuideIds,
		bulkBusy,
		copiedSlug,
		deletingId,
		savingNoteId,
		collectionDialogOpen,
		setCollectionDialogOpen,
		newCollectionName,
		setNewCollectionName,
		creatingCollection,
		deletingCollectionId,
		renamingCollection,
		renameCollectionName,
		setRenameCollectionName,
		savingRename,
		openRenameCollection,
		closeRenameCollection,
		filteredGuides,
		searchFilteredGuides,
		displayedGuides,
		selectAllRef,
		allVisibleSelected,
		toggleSelectAllVisible,
		toggleGuideSelected,
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
		starredCount,
		uncollectedCount,
	} = useDashboardLogic({ user, initialGuides, initialCollections });

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	return (
		<div className="max-w-5xl mx-auto space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Zap className="h-8 w-8 text-primary" />
						Dashboard
					</h1>
					<p className="text-muted-foreground mt-1">
						Welcome back, {user.email?.split('@')[0] || 'there'}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Link href="/app">
						<Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
							<Plus className="h-4 w-4" />
							New Guide
						</Button>
					</Link>
					<Button variant="ghost" onClick={handleLogout} className="gap-2">
						<LogOut className="h-4 w-4" />
						Sign out
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Guides</CardDescription>
						<CardTitle className="text-3xl">{guides.length}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Views</CardDescription>
						<CardTitle className="text-3xl">
							{guides.reduce((sum, g) => sum + g.view_count, 0)}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Starred</CardDescription>
						<CardTitle className="text-3xl">{starredCount}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			{guides.length > 0 && (
				<div className="space-y-3">
					<div className="flex flex-col gap-3">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<h2 className="text-xl font-semibold shrink-0">Your Guides</h2>
							<div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end flex-1 min-w-0">
								<div className="relative w-full sm:max-w-xs">
									<Search
										className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
										aria-hidden
									/>
									<Input
										type="search"
										placeholder="Search name, URL, or note…"
										value={guideSearch}
										onChange={(e) => setGuideSearch(e.target.value)}
										className="pl-9"
										aria-label="Search guides"
									/>
								</div>
								<div className="relative w-full sm:max-w-[13rem]">
									<select
										className="w-full appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-9 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										value={guideSort}
										onChange={(e) => setGuideSort(e.target.value as GuideSortKey)}
										aria-label="Sort guides"
									>
										<option value="starred_first">Starred first</option>
										<option value="date_desc">Newest first</option>
										<option value="date_asc">Oldest first</option>
										<option value="name_asc">Name (A–Z)</option>
										<option value="name_desc">Name (Z–A)</option>
										<option value="views_desc">Most views</option>
										<option value="views_asc">Fewest views</option>
									</select>
									<ChevronDown
										className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
										aria-hidden
									/>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="gap-2 shrink-0 w-full sm:w-auto"
									onClick={() => setCollectionDialogOpen(true)}
								>
									<FolderPlus className="h-4 w-4" />
									New collection
								</Button>
							</div>
						</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant={filter === 'all' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setFilter('all')}
						>
							All ({guides.length})
						</Button>
						<Button
							variant={filter === 'starred' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setFilter('starred')}
							className="gap-1"
						>
							<Star className="h-3.5 w-3.5" />
							Starred ({starredCount})
						</Button>
						<Button
							variant={filter === 'uncollected' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setFilter('uncollected')}
						>
							No collection ({uncollectedCount})
						</Button>
						{collections.map((c) => {
							const count = guides.filter((g) => guideCollectionId(g) === c.id).length;
							const active = filter === `collection:${c.id}`;
							return (
								<div
									key={c.id}
									className="inline-flex items-stretch rounded-md border border-input shadow-sm overflow-hidden"
								>
									<Button
										variant={active ? 'default' : 'secondary'}
										size="sm"
										className="rounded-none border-0 shadow-none"
										onClick={() => setFilter(`collection:${c.id}`)}
									>
										{c.name} ({count})
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="rounded-none border-0 border-l border-border px-2 h-auto min-w-9 text-muted-foreground hover:text-foreground"
										disabled={savingRename}
										aria-label={`Rename collection ${c.name}`}
										onClick={(e) => {
											e.stopPropagation();
											openRenameCollection(c);
										}}
									>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="rounded-none border-0 border-l border-border px-2 h-auto min-w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
										disabled={deletingCollectionId === c.id}
										aria-label={`Delete collection ${c.name}`}
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteCollection(c);
										}}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							);
						})}
					</div>
					</div>
				</div>
			)}

			{guides.length === 0 ? (
				<Card className="border-dashed border-2">
					<CardContent className="py-14 text-center">
						<div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary-muted/50 flex items-center justify-center">
							<FileCode className="h-7 w-7 text-primary" />
						</div>
						<h3 className="text-lg font-semibold mb-1">No guides yet</h3>
						<p className="text-muted-foreground mb-6 max-w-sm mx-auto">
							Create your first Quick Start guide and it will show up here. Save and share links to
							reuse them anytime.
						</p>
						<Link href="/app">
							<Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
								<Plus className="h-4 w-4" />
								Create your first guide
							</Button>
						</Link>
						<p className="mt-4 text-sm text-muted-foreground">
							<a href="/app" className="hover:text-foreground">
								Try a sample API
							</a>{' '}
							to get started.
						</p>
					</CardContent>
				</Card>
			) : filteredGuides.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="py-10 text-center text-muted-foreground">
						No guides in this filter. Try another tab or create a new guide.
					</CardContent>
				</Card>
			) : searchFilteredGuides.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="py-10 text-center text-muted-foreground">
						No guides match your search. Try a different name, URL, or note.
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
						<div className="flex items-center gap-2">
							<input
								ref={selectAllRef}
								type="checkbox"
								checked={allVisibleSelected}
								onChange={toggleSelectAllVisible}
								className="size-4 shrink-0 rounded border border-input accent-primary cursor-pointer"
								aria-label="Select all visible guides"
							/>
							<span className="text-muted-foreground whitespace-nowrap">
								{selectedGuideIds.length > 0 ? (
									<>
										<span className="font-medium text-foreground">{selectedGuideIds.length}</span>{' '}
										selected
									</>
								) : (
									'Select guides'
								)}
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-2 sm:ml-auto">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8"
								disabled={selectedGuideIds.length === 0}
								onClick={clearSelection}
							>
								Clear
							</Button>
							<div className="relative min-w-[10rem] sm:min-w-[12rem]">
								<select
									className="w-full appearance-none rounded-md border border-input bg-background py-1.5 pl-2 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
									disabled={selectedGuideIds.length === 0 || bulkBusy || collections.length === 0}
									value=""
									aria-label="Move selected guides to collection"
									onChange={(e) => {
										const v = e.target.value;
										e.target.value = '';
										if (v) handleBulkCollectionChange(v);
									}}
								>
									<option value="" disabled>
										Move to collection…
									</option>
									{collections.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
								<ChevronDown
									className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
									aria-hidden
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8"
								disabled={selectedGuideIds.length === 0 || bulkBusy}
								onClick={() => handleBulkCollectionChange(null)}
							>
								Remove from collection
							</Button>
						</div>
					</div>
					{displayedGuides.map((guide) => (
						<Card
							key={guide.id}
							className="hover:border-primary/30 hover:shadow-md transition-all duration-200 shadow-sm"
						>
							<CardContent className="py-4">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="flex gap-3 min-w-0 flex-1">
										<div className="flex items-start gap-1 shrink-0 pt-0.5">
											<input
												type="checkbox"
												checked={selectedGuideIds.includes(guide.id)}
												onChange={() => toggleGuideSelected(guide.id)}
												className="size-4 mt-1.5 rounded border border-input accent-primary cursor-pointer"
												aria-label={`Select ${guide.api_name}`}
											/>
											<Button
												variant="ghost"
												size="icon"
												className="h-9 w-9 shrink-0"
												onClick={() => handleToggleFavorite(guide)}
												aria-label={guideIsFavorite(guide) ? 'Unstar' : 'Star'}
											>
												<Star
													className={`h-4 w-4 ${
														guideIsFavorite(guide)
															? 'fill-amber-400 text-amber-400'
															: 'text-muted-foreground'
													}`}
												/>
											</Button>
										</div>
										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex flex-wrap items-start gap-x-2 gap-y-1">
												<h3 className="font-semibold text-base leading-snug break-words">
													{guide.api_name}
												</h3>
												<Badge
													variant="secondary"
													className="gap-1 shrink-0 bg-primary-muted text-primary mt-0.5"
												>
													<Eye className="h-3 w-3" />
													{guide.view_count}
												</Badge>
											</div>
											<div className="flex flex-col gap-1 text-sm text-muted-foreground">
												<span className="flex items-center gap-1.5 shrink-0">
													<Calendar className="h-3.5 w-3.5 shrink-0" />
													{formatDate(guide.created_at)}
												</span>
												{guide.spec_url && (
													<p className="font-mono text-xs break-all leading-relaxed text-muted-foreground/90">
														{guide.spec_url}
													</p>
												)}
											</div>
											<div className="flex flex-col gap-1.5 pt-0.5 sm:grid sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-3 sm:max-w-xl">
												<label
													htmlFor={`collection-${guide.id}`}
													className="text-xs font-medium text-muted-foreground leading-none sm:leading-none"
												>
													Collection
												</label>
												<div className="relative min-w-0 w-full sm:min-w-[220px] sm:max-w-xs">
													<select
														id={`collection-${guide.id}`}
														className="w-full appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
														value={guideCollectionId(guide) ?? ''}
														onChange={(e) =>
															handleCollectionChange(guide.id, e.target.value || null)
														}
													>
														<option value="">No collection</option>
														{collections.map((c) => (
															<option key={c.id} value={c.id}>
																{c.name}
															</option>
														))}
													</select>
													<ChevronDown
														className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
														aria-hidden
													/>
												</div>
											</div>
											<GuideNotesField
												key={`${guide.id}-${guideNotes(guide) ?? ''}`}
												guideId={guide.id}
												initialNotes={guideNotes(guide)}
												disabled={savingNoteId === guide.id}
												onSave={handleNoteSave}
											/>
										</div>
									</div>
									<div className="flex items-center gap-1 shrink-0 flex-wrap justify-end lg:justify-start lg:pt-0.5">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCopyLink(guide.slug)}
											className="gap-1"
										>
											<Copy className="h-4 w-4" />
											{copiedSlug === guide.slug ? 'Copied!' : 'Copy Link'}
										</Button>
										<Link href={`/g/${guide.slug}`} target="_blank">
											<Button variant="ghost" size="sm" className="gap-1">
												<ExternalLink className="h-4 w-4" />
												View
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(guide)}
											disabled={deletingId === guide.id}
											className="text-destructive hover:text-destructive gap-1"
										>
											<Trash2 className="h-4 w-4" />
											{deletingId === guide.id ? 'Deleting...' : 'Delete'}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{collectionDialogOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
					role="dialog"
					aria-modal="true"
					aria-labelledby="new-collection-title"
				>
					<Card className="w-full max-w-md border-2 shadow-xl">
						<CardHeader>
							<CardTitle id="new-collection-title">New collection</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Input
								placeholder="e.g. Stripe, Internal APIs"
								value={newCollectionName}
								onChange={(e) => setNewCollectionName(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
							/>
							<div className="flex gap-2 justify-end">
								<Button variant="outline" onClick={() => setCollectionDialogOpen(false)}>
									Cancel
								</Button>
								<Button
									onClick={handleCreateCollection}
									disabled={!newCollectionName.trim() || creatingCollection}
								>
									{creatingCollection ? 'Creating...' : 'Create'}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{renamingCollection && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
					role="dialog"
					aria-modal="true"
					aria-labelledby="rename-collection-title"
				>
					<Card className="w-full max-w-md border-2 shadow-xl">
						<CardHeader>
							<CardTitle id="rename-collection-title">Rename collection</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Input
								placeholder="Collection name"
								value={renameCollectionName}
								onChange={(e) => setRenameCollectionName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleRenameCollection();
									if (e.key === 'Escape') {
										closeRenameCollection();
									}
								}}
							/>
							<div className="flex gap-2 justify-end">
								<Button variant="outline" onClick={closeRenameCollection}>
									Cancel
								</Button>
								<Button
									onClick={handleRenameCollection}
									disabled={!renameCollectionName.trim() || savingRename}
								>
									{savingRename ? 'Saving...' : 'Save'}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
