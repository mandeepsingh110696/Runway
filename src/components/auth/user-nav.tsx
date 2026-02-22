'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function UserNav() {
	const router = useRouter();
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		supabase.auth.getUser().then(({ data: { user } }) => {
			setUser(user);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	const handleLogout = useCallback(async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push('/');
		router.refresh();
	}, [router]);

	if (loading) {
		return <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />;
	}

	if (!user) {
		return (
			<Link href="/login">
				<Button variant="outline" size="sm">
					Sign in
				</Button>
			</Link>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<Link href="/dashboard">
				<Button variant="ghost" size="sm" className="gap-2">
					<User className="h-4 w-4" />
					Dashboard
				</Button>
			</Link>
			<Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
				<LogOut className="h-4 w-4" />
				Sign out
			</Button>
		</div>
	);
}
