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
    ()=>__TURBOPACK__default__export__
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
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
}
const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
};
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__["Pool"](config);
pool.on('connect', ()=>console.log('✅ Connected to Neon PostgreSQL'));
pool.on('error', (err)=>{
    console.error('❌ Unexpected DB error:', err.message);
    process.exit(-1);
});
const __TURBOPACK__default__export__ = pool;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/models/log.model.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "LogModel",
    ()=>LogModel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/db.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
// Pad log_id to "VEH-000001"
const formatId = (n)=>`VEH-${String(n).padStart(6, '0')}`;
class LogModel {
    static async getAll(query) {
        const limit = Math.min(parseInt(String(query.limit ?? 20)), 100);
        const page = parseInt(String(query.page ?? 1));
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let idx = 1;
        if (query.search) {
            conditions.push(`(
        LPAD(log_id::text, 6, '0') ILIKE $${idx}
        OR license_no   ILIKE $${idx}
        OR location     ILIKE $${idx}
        OR vehicle_type ILIKE $${idx}
      )`);
            values.push(`%${query.search}%`);
            idx++;
        }
        if (query.speeding === 'true') conditions.push(`speed > 60`);
        if (query.helmetless === 'true') conditions.push(`vehicle_type = 'Bike' AND helmet_status = FALSE`);
        if (query.redLight === 'true') conditions.push(`red_light_cross = TRUE`);
        if (query.tripling === 'true') conditions.push(`vehicle_type = 'Bike' AND tripling = TRUE`);
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [dataResult, countResult] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT * FROM vehicle_logs ${where}
         ORDER BY detected_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`, [
                ...values,
                limit,
                offset
            ]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT COUNT(*) FROM vehicle_logs ${where}`, values)
        ]);
        return {
            data: dataResult.rows.map((r)=>({
                    id: formatId(r.log_id),
                    dateTime: r.detected_at,
                    location: r.location,
                    licenseNo: r.license_no,
                    vehicleType: r.vehicle_type,
                    speed: parseFloat(String(r.speed)),
                    helmetStatus: r.vehicle_type === 'Bike' ? r.helmet_status : 'N/A',
                    redLightCross: r.red_light_cross,
                    tripling: r.tripling
                })),
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        };
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/controllers/Log.controller.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getLogs",
    ()=>getLogs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$log$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/log.model.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$log$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$log$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const getLogs = async (req, res, next)=>{
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$log$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LogModel"].getAll(req.query);
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
        // Create a mock response object
        let responseData = null;
        let statusCode = 200;
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
        // Call the handler
        await handler(mockReq, mockRes);
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
"[project]/app/api/logs/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Log$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/controllers/Log.controller.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/handler-adapter.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Log$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Log$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function GET(request) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleRequest"])(request, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Log$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLogs"]);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__13v8dz-._.js.map