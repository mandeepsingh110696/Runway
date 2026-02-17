export interface ParsedEndpoint {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	operationId?: string;
	summary?: string;
	description?: string;
	parameters: EndpointParameter[];
	requestBody?: RequestBody;
	responses: Record<string, ResponseInfo>;
	security: SecurityRequirement[];
	tags: string[];
}

export interface EndpointParameter {
	name: string;
	in: 'path' | 'query' | 'header' | 'cookie';
	required: boolean;
	description?: string;
	schema?: SchemaInfo;
	example?: unknown;
}

export interface RequestBody {
	required: boolean;
	description?: string;
	content: Record<string, MediaTypeInfo>;
}

export interface MediaTypeInfo {
	schema?: SchemaInfo;
	example?: unknown;
}

export interface ResponseInfo {
	description: string;
	content?: Record<string, MediaTypeInfo>;
}

export interface SchemaInfo {
	type?: string;
	format?: string;
	properties?: Record<string, SchemaInfo>;
	required?: string[];
	items?: SchemaInfo;
	enum?: unknown[];
	example?: unknown;
	default?: unknown;
}

export interface SecurityRequirement {
	[schemeName: string]: string[];
}

export interface SecurityScheme {
	type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
	name?: string;
	in?: 'header' | 'query' | 'cookie';
	scheme?: string;
	bearerFormat?: string;
	description?: string;
	flows?: OAuthFlows;
}

export interface OAuthFlows {
	implicit?: OAuthFlow;
	password?: OAuthFlow;
	clientCredentials?: OAuthFlow;
	authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
	authorizationUrl?: string;
	tokenUrl?: string;
	refreshUrl?: string;
	scopes: Record<string, string>;
}

export interface ParsedSpec {
	title: string;
	version: string;
	description?: string;
	servers: ServerInfo[];
	endpoints: ParsedEndpoint[];
	securitySchemes: Record<string, SecurityScheme>;
	defaultSecurity: SecurityRequirement[];
}

export interface ServerInfo {
	url: string;
	description?: string;
}

export interface QuickStartData {
	spec: ParsedSpec;
	selectedEndpoint: ParsedEndpoint;
	baseUrl: string;
	authScheme: SecurityScheme | null;
	authSchemeName: string | null;
}

export type SnippetFormat = 'curl' | 'fetch' | 'python';

export interface GeneratedSnippet {
	format: SnippetFormat;
	code: string;
	language: string;
}
