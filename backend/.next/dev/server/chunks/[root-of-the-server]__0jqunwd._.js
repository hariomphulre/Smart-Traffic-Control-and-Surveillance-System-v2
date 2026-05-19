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
    max: 25,
    min: 5,
    idleTimeoutMillis: 60_000,
    connectionTimeoutMillis: 10_000
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
"[project]/src/models/analytics.model.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AnalyticsModel",
    ()=>AnalyticsModel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/db.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
// Build a WHERE clause from optional date range
function buildDateFilter(from, to, col, startIdx) {
    const conditions = [];
    const values = [];
    let idx = startIdx;
    if (from) {
        conditions.push(`${col} >= $${idx++}`);
        values.push(from);
    }
    if (to) {
        conditions.push(`${col} <= $${idx++}`);
        values.push(to);
    }
    return {
        clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        values,
        nextIdx: idx
    };
}
// Static GPS coordinates for known locations
const LOCATION_COORDS = {
    'MG Road Junction': {
        lat: 28.6139,
        lng: 77.2090
    },
    'Connaught Place': {
        lat: 28.6315,
        lng: 77.2167
    },
    'NH-8 Toll Plaza': {
        lat: 28.5033,
        lng: 77.0886
    },
    'Airport Road': {
        lat: 28.5562,
        lng: 77.0999
    },
    'Railway Station Chowk': {
        lat: 28.6432,
        lng: 77.2201
    },
    'Civil Lines': {
        lat: 28.6795,
        lng: 77.2290
    },
    'Sadar Bazaar': {
        lat: 28.6577,
        lng: 77.1964
    },
    'Bus Stand': {
        lat: 28.6272,
        lng: 77.2190
    },
    'Industrial Area Gate 4': {
        lat: 28.5832,
        lng: 77.3210
    },
    'Gurgaon Toll': {
        lat: 28.4744,
        lng: 77.0266
    },
    'Lajpat Nagar': {
        lat: 28.5647,
        lng: 77.2430
    },
    'Karol Bagh': {
        lat: 28.6514,
        lng: 77.1907
    },
    'Nehru Place': {
        lat: 28.5477,
        lng: 77.2519
    },
    'Rajpath': {
        lat: 28.6129,
        lng: 77.2295
    }
};
class AnalyticsModel {
    // GET /analytics/violations
    static async getViolations(query) {
        const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`
      SELECT
        SUM(CASE WHEN vehicle_type = 'Bike' AND helmet_status = FALSE THEN 1 ELSE 0 END) AS "Helmet-less",
        SUM(CASE WHEN vehicle_type = 'Bike' AND tripling = TRUE        THEN 1 ELSE 0 END) AS "Tripling",
        SUM(CASE WHEN red_light_cross = TRUE                            THEN 1 ELSE 0 END) AS "Red Light",
        SUM(CASE WHEN speed > 60                                        THEN 1 ELSE 0 END) AS "Over Speed"
      FROM vehicle_logs ${clause}
    `, values);
        const r = rows[0];
        return {
            data: [
                {
                    name: 'Helmet-less',
                    count: parseInt(r['Helmet-less'] ?? '0')
                },
                {
                    name: 'Tripling',
                    count: parseInt(r['Tripling'] ?? '0')
                },
                {
                    name: 'Red Light',
                    count: parseInt(r['Red Light'] ?? '0')
                },
                {
                    name: 'Over Speed',
                    count: parseInt(r['Over Speed'] ?? '0')
                }
            ]
        };
    }
    // GET /analytics/vehicle-types
    static async getVehicleTypes(query) {
        const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT vehicle_type AS name, COUNT(*) AS count
       FROM vehicle_logs ${clause}
       GROUP BY vehicle_type
       ORDER BY count DESC`, values);
        return {
            data: rows.map((r)=>({
                    name: r.name,
                    count: parseInt(r.count)
                }))
        };
    }
    // GET /analytics/hourly-traffic
    static async getHourlyTraffic(query) {
        const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT
         TO_CHAR(DATE_TRUNC('hour', detected_at), 'HH24:MI') AS hour,
         COUNT(*) AS vehicles,
         SUM(CASE
           WHEN speed > 60
             OR (vehicle_type = 'Bike' AND helmet_status = FALSE)
             OR red_light_cross = TRUE
             OR (vehicle_type = 'Bike' AND tripling = TRUE)
           THEN 1 ELSE 0
         END) AS violations
       FROM vehicle_logs ${clause}
       GROUP BY DATE_TRUNC('hour', detected_at)
       ORDER BY DATE_TRUNC('hour', detected_at)`, values);
        return {
            data: rows.map((r)=>({
                    hour: r.hour,
                    vehicles: parseInt(r.vehicles),
                    violations: parseInt(r.violations)
                }))
        };
    }
    // GET /analytics/speed-distribution
    static async getSpeedDistribution(query) {
        const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT
         SUM(CASE WHEN speed BETWEEN 0  AND 20  THEN 1 ELSE 0 END) AS "0-20",
         SUM(CASE WHEN speed BETWEEN 21 AND 40  THEN 1 ELSE 0 END) AS "21-40",
         SUM(CASE WHEN speed BETWEEN 41 AND 60  THEN 1 ELSE 0 END) AS "41-60",
         SUM(CASE WHEN speed BETWEEN 61 AND 80  THEN 1 ELSE 0 END) AS "61-80",
         SUM(CASE WHEN speed BETWEEN 81 AND 100 THEN 1 ELSE 0 END) AS "81-100",
         SUM(CASE WHEN speed > 100              THEN 1 ELSE 0 END) AS "100+"
       FROM vehicle_logs ${clause}`, values);
        const r = rows[0];
        return {
            data: [
                {
                    range: '0-20',
                    count: parseInt(r['0-20'] ?? '0')
                },
                {
                    range: '21-40',
                    count: parseInt(r['21-40'] ?? '0')
                },
                {
                    range: '41-60',
                    count: parseInt(r['41-60'] ?? '0')
                },
                {
                    range: '61-80',
                    count: parseInt(r['61-80'] ?? '0')
                },
                {
                    range: '81-100',
                    count: parseInt(r['81-100'] ?? '0')
                },
                {
                    range: '100+',
                    count: parseInt(r['100+'] ?? '0')
                }
            ]
        };
    }
    // GET /analytics/stats - Optimized to use single query
    static async getStats() {
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE
          WHEN speed > 60
            OR (vehicle_type = 'Bike' AND helmet_status = FALSE)
            OR red_light_cross = TRUE
            OR (vehicle_type = 'Bike' AND tripling = TRUE)
          THEN 1 ELSE 0
        END) AS violations
      FROM vehicle_logs
    `);
        const row = rows[0];
        return {
            totalVehicles: parseInt(row.total),
            totalViolations: parseInt(row.violations),
            trend: 12
        };
    }
    // GET /analytics/hotspots
    static async getHotspots(query) {
        const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);
        const violationFilter = `speed > 60
        OR (vehicle_type = 'Bike' AND helmet_status = FALSE)
        OR red_light_cross = TRUE
        OR (vehicle_type = 'Bike' AND tripling = TRUE)`;
        const whereClause = clause ? `${clause} AND (${violationFilter})` : `WHERE (${violationFilter})`;
        const { rows } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].query(`SELECT
         location,
         COUNT(*) AS violations,
         CASE
           WHEN COUNT(*) > 10 THEN 'high'
           WHEN COUNT(*) > 4  THEN 'medium'
           ELSE 'low'
         END AS severity
       FROM vehicle_logs
       ${whereClause}
       GROUP BY location
       ORDER BY violations DESC`, values);
        return {
            data: rows.map((r)=>({
                    name: r.location,
                    violations: parseInt(r.violations),
                    lat: LOCATION_COORDS[r.location]?.lat ?? 28.6139,
                    lng: LOCATION_COORDS[r.location]?.lng ?? 77.2090,
                    severity: r.severity
                }))
        };
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/controllers/Analytics.controller.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getHotspots",
    ()=>getHotspots,
    "getHourlyTraffic",
    ()=>getHourlyTraffic,
    "getSpeedDistrib",
    ()=>getSpeedDistrib,
    "getStats",
    ()=>getStats,
    "getVehicleTypes",
    ()=>getVehicleTypes,
    "getViolations",
    ()=>getViolations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/analytics.model.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const wrap = (fn)=>async (req, res, next)=>{
        try {
            res.json(await fn(req.query));
        } catch (err) {
            next(err);
        }
    };
const getViolations = wrap((q)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AnalyticsModel"].getViolations(q));
const getVehicleTypes = wrap((q)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AnalyticsModel"].getVehicleTypes(q));
const getHourlyTraffic = wrap((q)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AnalyticsModel"].getHourlyTraffic(q));
const getSpeedDistrib = wrap((q)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AnalyticsModel"].getSpeedDistribution(q));
const getHotspots = wrap((q)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AnalyticsModel"].getHotspots(q));
const getStats = async (_req, res, next)=>{
    try {
        res.json(await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$analytics$2e$model$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AnalyticsModel"].getStats());
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
"[project]/app/api/analytics/[slug]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/controllers/Analytics.controller.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/handler-adapter.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function GET(request, { params }) {
    const { slug } = await params;
    const handlers = {
        violations: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getViolations"],
        'vehicle-types': __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getVehicleTypes"],
        'hourly-traffic': __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHourlyTraffic"],
        'speed-distribution': __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSpeedDistrib"],
        stats: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getStats"],
        hotspots: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Analytics$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHotspots"]
    };
    const handler = handlers[slug];
    if (!handler) {
        return new Response('Not Found', {
            status: 404
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleRequest"])(request, handler);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jqunwd._.js.map