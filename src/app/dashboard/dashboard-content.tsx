'use client';

import type { User } from '@supabase/supabase-js';
import {
	Calendar,
	Copy,
	ExternalLink,
	Eye,
	FileCode,
	LogOut,
	Plus,
	Trash2,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { Guide } from '@/lib/supabase/types';

interface DashboardContentProps {
	user: User;
	guides: Guide[];
}

export function DashboardContent({ user, guides: initialGuides }: DashboardContentProps) {
	const router = useRouter();
	const [guides, setGuides] = useState(initialGuides);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

	const handleLogout = useCallback(async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push('/');
		router.refresh();
	}, [router]);

	const handleDelete = useCallback(async (id: string) => {
		setDeletingId(id);
		const supabase = createClient();
		const { error } = await supabase.from('guides').delete().eq('id', id);

		if (!error) {
			setGuides((prev) => prev.filter((g) => g.id !== id));
		}
		setDeletingId(null);
	}, []);

	const handleCopyLink = useCallback(async (slug: string) => {
		const url = `${window.location.origin}/g/${slug}`;
		await navigator.clipboard.writeText(url);
		setCopiedSlug(slug);
		setTimeout(() => setCopiedSlug(null), 2000);
	}, []);

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	return (
		<div className="max-w-5xl mx-auto space-y-8">
			{/* Header */}
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

			{/* Stats */}
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
						<CardDescription>This Month</CardDescription>
						<CardTitle className="text-3xl">
							{
								guides.filter((g) => {
									const date = new Date(g.created_at);
									const now = new Date();
									return (
										date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
									);
								}).length
							}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			{/* Guides List */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Your Guides</h2>

				{guides.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="py-12 text-center">
							<FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">No guides yet</h3>
							<p className="text-muted-foreground mb-4">
								Create your first Quick Start guide to see it here.
							</p>
							<Link href="/app">
								<Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
									<Plus className="h-4 w-4" />
									Create Guide
								</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4">
						{guides.map((guide) => (
							<Card
								key={guide.id}
								className="hover:border-primary/30 hover:shadow-md transition-all duration-200 shadow-sm"
							>
								<CardContent className="py-4">
									<div className="flex items-center justify-between gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="font-semibold truncate">{guide.api_name}</h3>
												<Badge
													variant="secondary"
													className="gap-1 shrink-0 bg-primary-muted text-primary"
												>
													<Eye className="h-3 w-3" />
													{guide.view_count}
												</Badge>
											</div>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<span className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{formatDate(guide.created_at)}
												</span>
												{guide.spec_url && (
													<span className="truncate max-w-[200px]">{guide.spec_url}</span>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2 shrink-0">
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
												onClick={() => handleDelete(guide.id)}
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
			</div>
		</div>
	);
}
