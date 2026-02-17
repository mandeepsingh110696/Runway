import type { ParsedEndpoint, ParsedSpec, SecurityScheme } from '@/types/openapi';

export interface AuthInfo {
	schemeName: string;
	scheme: SecurityScheme;
	envVarName: string;
	envVarValue: string;
	headerName?: string;
	headerValue: string;
	setupInstructions: string[];
}

/**
 * Detect the authentication scheme for an endpoint
 */
export function detectAuth(spec: ParsedSpec, endpoint: ParsedEndpoint): AuthInfo | null {
	// Check endpoint-level security first, then spec-level
	const securityReqs = endpoint.security.length > 0 ? endpoint.security : spec.defaultSecurity;

	if (securityReqs.length === 0) {
		return null;
	}

	// Get the first security requirement
	const firstReq = securityReqs[0];
	const schemeName = Object.keys(firstReq)[0];

	if (!schemeName) return null;

	const scheme = spec.securitySchemes[schemeName];
	if (!scheme) return null;

	return buildAuthInfo(schemeName, scheme);
}

function buildAuthInfo(schemeName: string, scheme: SecurityScheme): AuthInfo {
	const envVarName = generateEnvVarName(schemeName, scheme);
	const envVarValue = 'your-key-here';

	switch (scheme.type) {
		case 'apiKey': {
			const headerName = scheme.name || 'X-API-Key';
			const headerValue = `$${envVarName}`;
			return {
				schemeName,
				scheme,
				envVarName,
				envVarValue,
				headerName,
				headerValue,
				setupInstructions: buildApiKeyInstructions(envVarName, headerName, scheme.in || 'header'),
			};
		}

		case 'http': {
			if (scheme.scheme === 'bearer') {
				return {
					schemeName,
					scheme,
					envVarName,
					envVarValue,
					headerName: 'Authorization',
					headerValue: `Bearer $${envVarName}`,
					setupInstructions: buildBearerInstructions(envVarName),
				};
			}
			if (scheme.scheme === 'basic') {
				return {
					schemeName,
					scheme,
					envVarName,
					envVarValue,
					headerName: 'Authorization',
					headerValue: `Basic $${envVarName}`,
					setupInstructions: buildBasicInstructions(envVarName),
				};
			}
			// Fallback for other HTTP schemes
			return {
				schemeName,
				scheme,
				envVarName,
				envVarValue,
				headerName: 'Authorization',
				headerValue: `$${envVarName}`,
				setupInstructions: [`Set ${envVarName} with your credentials`],
			};
		}

		case 'oauth2': {
			return {
				schemeName,
				scheme,
				envVarName,
				envVarValue,
				headerName: 'Authorization',
				headerValue: `Bearer $${envVarName}`,
				setupInstructions: buildOAuth2Instructions(envVarName, scheme),
			};
		}

		case 'openIdConnect': {
			return {
				schemeName,
				scheme,
				envVarName,
				envVarValue,
				headerName: 'Authorization',
				headerValue: `Bearer $${envVarName}`,
				setupInstructions: [
					`Obtain a token via OpenID Connect`,
					`export ${envVarName}="your-access-token"`,
				],
			};
		}

		default: {
			return {
				schemeName,
				scheme,
				envVarName,
				envVarValue,
				setupInstructions: [`Configure ${schemeName} authentication`],
				headerValue: '',
			};
		}
	}
}

function generateEnvVarName(schemeName: string, scheme: SecurityScheme): string {
	// Try to create a meaningful env var name
	const baseName = schemeName
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '_')
		.replace(/_+/g, '_');

	if (scheme.type === 'apiKey') {
		return `${baseName}_API_KEY`;
	}
	if (scheme.type === 'http' && scheme.scheme === 'bearer') {
		return `${baseName}_TOKEN`;
	}
	if (scheme.type === 'oauth2') {
		return `${baseName}_ACCESS_TOKEN`;
	}

	return `${baseName}_KEY`;
}

function buildApiKeyInstructions(
	envVarName: string,
	headerName: string,
	location: string,
): string[] {
	return [
		`# Get your API key from the provider's dashboard`,
		`export ${envVarName}="your-api-key-here"`,
		``,
		`# The key will be sent as: ${location === 'header' ? `Header: ${headerName}` : `Query param: ${headerName}`}`,
	];
}

function buildBearerInstructions(envVarName: string): string[] {
	return [
		`# Get your access token from the provider`,
		`export ${envVarName}="your-access-token-here"`,
		``,
		`# The token will be sent as: Authorization: Bearer <token>`,
	];
}

function buildBasicInstructions(envVarName: string): string[] {
	return [
		`# Encode your credentials as base64(username:password)`,
		`export ${envVarName}=$(echo -n "username:password" | base64)`,
		``,
		`# The credentials will be sent as: Authorization: Basic <encoded>`,
	];
}

function buildOAuth2Instructions(envVarName: string, scheme: SecurityScheme): string[] {
	const instructions: string[] = [`# OAuth2 authentication required`];

	if (scheme.flows?.clientCredentials) {
		const flow = scheme.flows.clientCredentials;
		instructions.push(
			`# Token URL: ${flow.tokenUrl}`,
			`# Use client credentials flow to obtain an access token`,
			``,
			`export ${envVarName}="your-access-token-here"`,
		);
	} else if (scheme.flows?.authorizationCode) {
		const flow = scheme.flows.authorizationCode;
		instructions.push(
			`# Authorization URL: ${flow.authorizationUrl}`,
			`# Token URL: ${flow.tokenUrl}`,
			`# Use authorization code flow to obtain an access token`,
			``,
			`export ${envVarName}="your-access-token-here"`,
		);
	} else {
		instructions.push(
			`# Obtain an access token via OAuth2`,
			`export ${envVarName}="your-access-token-here"`,
		);
	}

	return instructions;
}
