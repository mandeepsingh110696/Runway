const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const SLUG_LENGTH = 8;

export function generateSlug(): string {
	let slug = '';
	for (let i = 0; i < SLUG_LENGTH; i++) {
		slug += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
	}
	return slug;
}

export function extractDomain(url: string | null | undefined): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		return parsed.hostname;
	} catch {
		return null;
	}
}
