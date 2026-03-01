/**
 * Health check for production: verifies required env is set.
 * Returns 503 if Supabase is not configured so monitors can alert.
 * Force-dynamic so this never hangs on static optimization.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	const ok = Boolean(url && anonKey && serviceKey);

	if (!ok) {
		return Response.json(
			{ ok: false, error: 'Missing required environment variables (Supabase)' },
			{ status: 503 },
		);
	}

	return Response.json({ ok: true });
}
