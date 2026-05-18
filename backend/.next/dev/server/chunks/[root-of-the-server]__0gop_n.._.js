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
"[project]/src/models/challan.model.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "ChallanModel",
    ()=>ChallanModel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/db.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const formatId = (n)=>`CH-${String(n).padStart(6, '0')}`;
class ChallanModel {
    static async getAll(query) {
        const limit = Math.min(parseInt(String(query.limit ?? 20)), 100);
        const page = parseInt(String(query.page ?? 1));
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let idx = 1;
        if (query.search) {
            conditions.push(`(
        LPAD(c.challan_id::text, 6, '0') ILIKE $${idx}
        OR c.registration_number ILIKE $${idx}
        OR c.location            ILIKE $${idx}
        OR c.violation_type      ILIKE $${idx}
      )`);
            values.push(`%${query.search}%`);
            idx++;
        }
        if (query.status) {
            conditions.push(`c.challan_status = $${idx++}`);
            values.push(query.status);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [dataResult, countResult] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT c.*, v.vehicle_type
         FROM vehicle_challan_details c
         LEFT JOIN vehicle_rc_details v ON c.registration_number = v.registration_number
         ${where}
         ORDER BY c.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`, [
                ...values,
                limit,
                offset
            ]),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT COUNT(*) FROM vehicle_challan_details c ${where}`, values)
        ]);
        return {
            data: dataResult.rows.map((r)=>({
                    id: formatId(r.challan_id),
                    dateTime: r.created_at,
                    location: r.location,
                    licenseNo: r.registration_number,
                    vehicleType: r.vehicle_type ?? null,
                    violationType: r.violation_type,
                    fineAmount: parseFloat(r.fine_amount),
                    penaltyAmount: parseFloat(r.penalty_amount),
                    status: r.challan_status,
                    paymentDate: r.challan_status === 'received' ? r.payment_date : null
                })),
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        };
    }
    static async getStats() {
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`
      SELECT
        SUM(CASE WHEN challan_status = 'pending'  THEN 1 ELSE 0 END)              AS "pending",
        SUM(CASE WHEN challan_status = 'received' THEN 1 ELSE 0 END)              AS "received",
        SUM(CASE WHEN challan_status = 'rejected' THEN 1 ELSE 0 END)              AS "rejected",
        SUM(fine_amount + COALESCE(penalty_amount, 0))                            AS "totalFines",
        SUM(CASE WHEN challan_status = 'received'
              THEN fine_amount + COALESCE(penalty_amount, 0) ELSE 0 END)          AS "collectedFines"
      FROM vehicle_challan_details
    `);
        const r = rows[0];
        return {
            pending: parseInt(r.pending ?? '0'),
            received: parseInt(r.received ?? '0'),
            rejected: parseInt(r.rejected ?? '0'),
            totalFines: parseFloat(r.totalFines ?? '0'),
            collectedFines: parseFloat(r.collectedFines ?? '0')
        };
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/controllers/Challan.controller.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getChallanStats",
    ()=>getChallanStats,
    "getChallans",
    ()=>getChallans
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$challan$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/challan.model.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$challan$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$challan$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const getChallans = async (req, res, next)=>{
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$challan$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ChallanModel"].getAll(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
const getChallanStats = async (_req, res, next)=>{
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$challan$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ChallanModel"].getStats();
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
"[project]/app/api/challans/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Challan$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/controllers/Challan.controller.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/handler-adapter.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Challan$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Challan$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function GET(request) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleRequest"])(request, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Challan$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getChallanStats"]);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0gop_n.._.js.map