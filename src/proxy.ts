import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
	// Skip Supabase for health check so it never hangs (e.g. when env is missing)
	const pathname = request.nextUrl.pathname ?? '';
	if (pathname === '/api/health' || pathname.endsWith('api/health')) {
		return NextResponse.next();
	}

	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({
						request,
					});
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Protected routes that require authentication
	const protectedPaths = ['/dashboard'];
	const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

	if (isProtectedPath && !user) {
		const url = request.nextUrl.clone();
		url.pathname = '/login';
		url.searchParams.set('redirect', request.nextUrl.pathname);
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}

export const config = {
	// Only run Supabase auth for page routes that need it; never run for /api/* (so /api/health never hangs)
	matcher: ['/', '/dashboard/:path*', '/login', '/app', '/app/:path*', '/g/:path*', '/auth/:path*'],
};
