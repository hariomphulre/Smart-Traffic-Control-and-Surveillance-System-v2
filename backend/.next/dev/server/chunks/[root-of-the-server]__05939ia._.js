module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/config/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "getPool",
    ()=>getPool
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config();
function needsSsl(connectionString) {
    if (process.env.DATABASE_SSL === 'true') return true;
    if (process.env.DATABASE_SSL === 'false') return false;
    return connectionString.includes('neon.tech') || connectionString.includes('sslmode=require') || connectionString.includes('ssl=true');
}
function createPool() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set in .env');
    }
    const config = {
        connectionString,
        max: 25,
        min: 5,
        idleTimeoutMillis: 60_000,
        connectionTimeoutMillis: 10_000
    };
    if (needsSsl(connectionString)) {
        config.ssl = {
            rejectUnauthorized: false
        };
    }
    const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__["Pool"](config);
    pool.on('connect', ()=>console.log('✅ Connected to PostgreSQL'));
    pool.on('error', (err)=>{
        console.error('❌ Unexpected DB pool error:', err.message);
    });
    return pool;
}
let pool = null;
function getPool() {
    if (!pool) {
        pool = createPool();
    }
    return pool;
}
/** Lazy pool — connects on first query, not at import time */ const poolProxy = new Proxy({}, {
    get (_target, prop) {
        const p = getPool();
        const value = Reflect.get(p, prop, p);
        return typeof value === 'function' ? value.bind(p) : value;
    }
});
const __TURBOPACK__default__export__ = poolProxy;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/models/images.model.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "ImagesModel",
    ()=>ImagesModel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/db.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const fmtVehId = (n)=>`VEH-${String(n).padStart(6, '0')}`;
const fmtAccId = (n)=>`ACC-${String(n).padStart(4, '0')}`;
class ImagesModel {
    static async getVehicleImages(query) {
        const limit = Math.min(parseInt(String(query.limit ?? 20)), 100);
        const page = parseInt(String(query.page ?? 1));
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let idx = 1;
        if (query.search) {
            conditions.push(`(
        LPAD(vi.log_id::text, 6, '0') ILIKE $${idx}
        OR vi.license_no   ILIKE $${idx}
        OR vi.vehicle_type ILIKE $${idx}
      )`);
            values.push(`%${query.search}%`);
            idx++;
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [dataResult, countResult] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT * FROM vehicle_images vi ${where}
         ORDER BY captured_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`, [
                ...values,
                limit,
                offset
            ]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT COUNT(*) FROM vehicle_images vi ${where}`, values)
        ]);
        return {
            data: dataResult.rows.map((r)=>({
                    id: r.image_id,
                    vehicleId: fmtVehId(r.log_id),
                    licenseNo: r.license_no,
                    vehicleType: r.vehicle_type,
                    timestamp: r.captured_at instanceof Date ? r.captured_at.toISOString() : r.captured_at,
                    imagePath: r.image_path,
                    licensePlatePath: r.license_plate_path
                })),
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        };
    }
    static async getAccidentMedia(query) {
        const limit = Math.min(parseInt(String(query.limit ?? 20)), 100);
        const page = parseInt(String(query.page ?? 1));
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let idx = 1;
        if (query.search) {
            conditions.push(`(
        LPAD(am.accident_id::text, 4, '0') ILIKE $${idx}
        OR am.location ILIKE $${idx}
        OR am.severity ILIKE $${idx}
      )`);
            values.push(`%${query.search}%`);
            idx++;
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [dataResult, countResult] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT * FROM accident_media am ${where}
         ORDER BY recorded_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`, [
                ...values,
                limit,
                offset
            ]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT COUNT(*) FROM accident_media am ${where}`, values)
        ]);
        return {
            data: dataResult.rows.map((r)=>({
                    id: fmtAccId(r.accident_id),
                    location: r.location,
                    timestamp: r.recorded_at instanceof Date ? r.recorded_at.toISOString() : r.recorded_at,
                    type: r.media_type,
                    path: r.file_path,
                    duration: r.duration ?? null,
                    severity: r.severity
                })),
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        };
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/controllers/Images.controller.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getAccidentMedia",
    ()=>getAccidentMedia,
    "getVehicleImages",
    ()=>getVehicleImages
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$images$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/images.model.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$images$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$images$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const getVehicleImages = async (req, res, next)=>{
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$images$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ImagesModel"].getVehicleImages(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
const getAccidentMedia = async (req, res, next)=>{
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$images$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ImagesModel"].getAccidentMedia(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/lib/handler-adapter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "handleRequest",
    ()=>handleRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function handleRequest(request, handler) {
    try {
        // Convert NextRequest to Express-like request object
        const body = [
            'POST',
            'PATCH',
            'PUT'
        ].includes(request.method) ? await request.json().catch(()=>({})) : {};
        const mockReq = {
            method: request.method,
            url: request.nextUrl.pathname + request.nextUrl.search,
            query: Object.fromEntries(request.nextUrl.searchParams),
            body,
            params: {},
            headers: request.headers
        };
        // Create a mock response object with proper error handling
        let responseData = null;
        let statusCode = 200;
        let errorOccurred = false;
        let errorData = null;
        const mockRes = {
            status: (code)=>{
                statusCode = code;
                return mockRes;
            },
            json: (data)=>{
                responseData = data;
                return mockRes;
            },
            send: (data)=>{
                responseData = data;
                return mockRes;
            },
            set: ()=>mockRes,
            setHeader: ()=>mockRes
        };
        // next() callback to handle errors from Express handlers
        const next = (error)=>{
            if (error) {
                errorOccurred = true;
                errorData = error;
                statusCode = 500;
            }
        };
        // Call the handler with error handling
        await handler(mockReq, mockRes, next);
        // If error occurred via next(), return error response
        if (errorOccurred) {
            const errorMessage = errorData instanceof Error ? errorData.message : typeof errorData === 'string' ? errorData : 'Internal Server Error';
            console.error('Handler error:', errorData);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Internal Server Error',
                message: errorMessage
            }, {
                status: statusCode
            });
        }
        // Ensure responseData is not null
        if (responseData === null || responseData === undefined) {
            console.warn('Handler did not set response data');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No response from handler',
                message: 'The handler did not return any data'
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(responseData, {
            status: statusCode
        });
    } catch (error) {
        console.error('API Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),
"[project]/app/api/images/vehicles/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Images$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/controllers/Images.controller.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/handler-adapter.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Images$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Images$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function GET(request) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleRequest"])(request, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Images$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getVehicleImages"]);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__05939ia._.js.map