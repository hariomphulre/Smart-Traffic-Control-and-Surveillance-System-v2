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
"[project]/src/data/ambulance.data.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Hospitals and traffic signals for ambulance routing.
 * Signals map to junctions; each signal has a lane (1-4) for traffic.json A1-A4.
 */ __turbopack_context__.s([
    "HOSPITALS",
    ()=>HOSPITALS,
    "TRAFFIC_SIGNALS",
    ()=>TRAFFIC_SIGNALS
]);
const HOSPITALS = [
    {
        id: 'h1',
        name: 'AIIMS Delhi',
        lat: 28.5672,
        lng: 77.2100,
        address: 'Ansari Nagar, New Delhi'
    },
    {
        id: 'h2',
        name: 'Safdarjung Hospital',
        lat: 28.5676,
        lng: 77.2052,
        address: 'Palam, New Delhi'
    },
    {
        id: 'h3',
        name: 'Ram Manohar Lohia Hospital',
        lat: 28.6314,
        lng: 77.2167,
        address: 'Baba Kharak Singh Marg'
    },
    {
        id: 'h4',
        name: 'Max Super Speciality Hospital',
        lat: 28.5020,
        lng: 77.0936,
        address: 'Saket, New Delhi'
    },
    {
        id: 'h5',
        name: 'Apollo Hospital',
        lat: 28.5477,
        lng: 77.2456,
        address: 'Sarita Vihar, New Delhi'
    },
    {
        id: 'h6',
        name: 'Fortis Escorts Heart Institute',
        lat: 28.5647,
        lng: 77.2430,
        address: 'Okhla, New Delhi'
    }
];
const TRAFFIC_SIGNALS = [
    {
        id: 's1',
        name: 'MG Road Junction',
        lat: 28.6139,
        lng: 77.2090,
        lane: 1
    },
    {
        id: 's2',
        name: 'Connaught Place',
        lat: 28.6315,
        lng: 77.2167,
        lane: 2
    },
    {
        id: 's3',
        name: 'NH-8 Toll Plaza',
        lat: 28.5033,
        lng: 77.0886,
        lane: 3
    },
    {
        id: 's4',
        name: 'Airport Road',
        lat: 28.5562,
        lng: 77.0999,
        lane: 4
    },
    {
        id: 's5',
        name: 'Railway Station Chowk',
        lat: 28.6432,
        lng: 77.2201,
        lane: 1
    },
    {
        id: 's6',
        name: 'Civil Lines',
        lat: 28.6795,
        lng: 77.2290,
        lane: 2
    },
    {
        id: 's7',
        name: 'Sadar Bazaar',
        lat: 28.6577,
        lng: 77.1964,
        lane: 3
    },
    {
        id: 's8',
        name: 'Bus Stand',
        lat: 28.6272,
        lng: 77.2190,
        lane: 4
    },
    {
        id: 's9',
        name: 'Industrial Area Gate 4',
        lat: 28.5832,
        lng: 77.3210,
        lane: 1
    },
    {
        id: 's10',
        name: 'Gurgaon Toll',
        lat: 28.4744,
        lng: 77.0266,
        lane: 2
    },
    {
        id: 's11',
        name: 'Lajpat Nagar',
        lat: 28.5647,
        lng: 77.2430,
        lane: 3
    },
    {
        id: 's12',
        name: 'Karol Bagh',
        lat: 28.6514,
        lng: 77.1907,
        lane: 4
    },
    {
        id: 's13',
        name: 'Nehru Place',
        lat: 28.5477,
        lng: 77.2519,
        lane: 1
    },
    {
        id: 's14',
        name: 'Rajpath',
        lat: 28.6129,
        lng: 77.2295,
        lane: 2
    }
];
}),
"[project]/src/controllers/Ambulance.controller.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getHospitals",
    ()=>getHospitals,
    "getSignals",
    ()=>getSignals,
    "getTrafficState",
    ()=>getTrafficState,
    "triggerSignal",
    ()=>triggerSignal
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$ambulance$2e$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/ambulance.data.ts [app-route] (ecmascript)");
;
;
;
const TRAFFIC_JSON_PATH = process.env.TRAFFIC_JSON_PATH || __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(("TURBOPACK compile-time value", "/ROOT/src/controllers"), '..', '..', '..', 'traffic_signal_simulation', 'traffic.json');
function loadTrafficJson() {
    try {
        const raw = __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(TRAFFIC_JSON_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch  {
        return {};
    }
}
function saveTrafficJson(data) {
    const dir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(TRAFFIC_JSON_PATH);
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(dir)) __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(dir, {
        recursive: true
    });
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(TRAFFIC_JSON_PATH, JSON.stringify(data));
}
const getHospitals = (_req, res, next)=>{
    try {
        res.json({
            data: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$ambulance$2e$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HOSPITALS"]
        });
    } catch (err) {
        next(err);
    }
};
const getSignals = (_req, res, next)=>{
    try {
        res.json({
            data: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$ambulance$2e$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRAFFIC_SIGNALS"]
        });
    } catch (err) {
        next(err);
    }
};
const triggerSignal = async (req, res, next)=>{
    try {
        const { signalId } = req.body;
        if (!signalId) {
            res.status(400).json({
                error: 'signalId is required'
            });
            return;
        }
        const signal = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$ambulance$2e$data$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRAFFIC_SIGNALS"].find((s)=>s.id === signalId);
        if (!signal) {
            res.status(404).json({
                error: 'Signal not found'
            });
            return;
        }
        const traffic = loadTrafficJson();
        // Reset all ambulance flags
        traffic['A1'] = false;
        traffic['A2'] = false;
        traffic['A3'] = false;
        traffic['A4'] = false;
        // Reset all R/Y/G so every lane is red by default
        for(let lane = 1; lane <= 4; lane++){
            traffic[`R${lane}`] = true;
            traffic[`Y${lane}`] = false;
            traffic[`G${lane}`] = false;
        }
        // Turn the selected lane green for ambulance
        traffic[`A${signal.lane}`] = true;
        traffic[`R${signal.lane}`] = false;
        traffic[`G${signal.lane}`] = true;
        // Basic countdown for emergency phase
        // Support both timer formats:
        // - old: C
        // - new: C1..C4 (per-lane countdown)
        traffic['C'] = 15;
        for(let lane = 1; lane <= 4; lane++){
            const key = `C${lane}`;
            if (typeof traffic[key] === 'number') traffic[key] = lane === signal.lane ? 15 : 0;
        }
        saveTrafficJson(traffic);
        res.json({
            success: true,
            message: `Signal ${signal.name} triggered - Lane ${signal.lane} green for ambulance`,
            signalId: signal.id
        });
    } catch (err) {
        next(err);
    }
};
const getTrafficState = (_req, res, next)=>{
    try {
        const traffic = loadTrafficJson();
        res.json(traffic);
    } catch (err) {
        next(err);
    }
};
}),
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
"[project]/app/api/signals/state/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Ambulance$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/controllers/Ambulance.controller.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/handler-adapter.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$handler$2d$adapter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleRequest"])(request, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$controllers$2f$Ambulance$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTrafficState"]);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02wvb5p._.js.map