export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
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
