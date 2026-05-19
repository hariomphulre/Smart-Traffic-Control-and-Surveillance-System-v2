(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__11ru_ap._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
function parseOrigins(raw) {
    if (!raw?.trim()) return [];
    return raw.split(',').map((s)=>s.trim().replace(/\/$/, '')).filter(Boolean);
}
const DEFAULT_LOCAL = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];
const ALLOWED_ORIGINS = [
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
    ...("TURBOPACK compile-time truthy", 1) ? DEFAULT_LOCAL : "TURBOPACK unreachable"
].filter(Boolean);
const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL === 'true';
function isVercelPreviewOrigin(origin) {
    try {
        const { hostname } = new URL(origin);
        return hostname.endsWith('.vercel.app') || hostname === 'vercel.app';
    } catch  {
        return false;
    }
}
function resolveOrigin(request) {
    const requestOrigin = request.headers.get('origin');
    if (requestOrigin) {
        if (ALLOWED_ORIGINS.includes(requestOrigin)) {
            return requestOrigin;
        }
        if (allowVercelPreviews && isVercelPreviewOrigin(requestOrigin)) {
            return requestOrigin;
        }
    }
    return ALLOWED_ORIGINS[0] ?? 'http://localhost:3000';
}
function corsHeaders(request) {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', resolveOrigin(request));
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Vary', 'Origin');
    return headers;
}
function middleware(request) {
    const headers = corsHeaders(request);
    if (request.method === 'OPTIONS') {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](null, {
            status: 204,
            headers
        });
    }
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    headers.forEach((value, key)=>response.headers.set(key, value));
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);
    return response;
}
const config = {
    matcher: '/api/:path*'
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__11ru_ap._.js.map