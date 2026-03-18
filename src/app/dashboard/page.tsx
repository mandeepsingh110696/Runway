import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Collection, Guide } from '@/lib/supabase/types';
import { DashboardContent } from './dashboard-content';

export const metadata = {
	title: 'Dashboard - Runway',
	description: 'Manage your saved Quick Start guides',
};

export default async function DashboardPage() {
	const supabase = await createAdminClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/login?redirect=/dashboard');
	}

	const { data: guidesRaw, error } = await supabase
		.from('guides')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Failed to fetch guides:', error);
	}

	const guides: Guide[] = (guidesRaw ?? []) as Guide[];

	let collections: Collection[] = [];
	const colRes = await supabase
		.from('collections')
		.select('*')
		.eq('user_id', user.id)
		.order('name', { ascending: true });
	if (!colRes.error && colRes.data) {
		collections = colRes.data as Collection[];
	} else if (colRes.error) {
		console.warn('Collections fetch failed:', colRes.error.message);
	}

	return (
		<main className="min-h-screen py-12 px-4">
			<DashboardContent user={user} guides={guides} collections={collections} />
		</main>
	);
}
