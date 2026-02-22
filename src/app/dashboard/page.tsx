import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Guide } from '@/lib/supabase/types';
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

	const { data: guides, error } = await supabase
		.from('guides')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.returns<Guide[]>();

	if (error) {
		console.error('Failed to fetch guides:', error);
	}

	return (
		<main className="min-h-screen py-12 px-4">
			<DashboardContent user={user} guides={guides || []} />
		</main>
	);
}
