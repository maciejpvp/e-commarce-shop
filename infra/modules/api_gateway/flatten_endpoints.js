const fs = require('fs');

const stdinBuffer = fs.readFileSync(0, 'utf-8');
if (!stdinBuffer) {
    process.stderr.write("No input provided on stdin\n");
    process.exit(1);
}

const input = JSON.parse(stdinBuffer);
const endpoints = JSON.parse(input.endpoints);

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

function flattenEndpoints(obj, currentPath = '') {
    let routes = [];

    for (const [key, value] of Object.entries(obj)) {
        if (HTTP_METHODS.has(key.toUpperCase())) {
            // It's a method configuration
            routes.push({
                path: currentPath === '' ? '/' : currentPath,
                method: key.toUpperCase(),
                config: value
            });
        } else {
            // It's a path segment
            const normalizedSegment = key === "" ? "" : (key.startsWith('/') ? key : `/${key}`);
            const newPath = currentPath + normalizedSegment;
            routes = routes.concat(flattenEndpoints(value, newPath));
        }
    }

    return routes;
}

try {
    const flatRoutes = flattenEndpoints(endpoints);

    // Terraform external provider expects a flat map of string -> string
    // We will pass the fully serialized JSON back as a single string field
    const result = {
        routes_json: JSON.stringify(flatRoutes)
    };

    process.stdout.write(JSON.stringify(result));
} catch (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
}
