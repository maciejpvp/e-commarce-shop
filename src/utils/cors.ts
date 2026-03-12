export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key",
};

export function withCors(response: {
    statusCode: number;
    body?: string;
    headers?: Record<string, string>;
}): typeof response & { headers: Record<string, string> } {
    return {
        ...response,
        headers: {
            ...CORS_HEADERS,
            ...(response.headers ?? {}),
        },
    };
}
