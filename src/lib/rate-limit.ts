/**
 * In-memory rate limiter for API routes.
 * Use for abuse protection; resets on process restart.
 */

const store = new Map<
	string,
	{ count: number; resetAt: number }
>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

export function getClientIdentifier(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}
	const realIp = request.headers.get('x-real-ip');
	if (realIp) return realIp;
	return 'unknown';
}

export function checkRateLimit(id: string): { allowed: boolean; retryAfter?: number } {
	const now = Date.now();
	const entry = store.get(id);

	if (!entry) {
		store.set(id, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true };
	}

	if (now > entry.resetAt) {
		store.set(id, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true };
	}

	entry.count += 1;
	if (entry.count > MAX_REQUESTS) {
		return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
	}
	return { allowed: true };
}
