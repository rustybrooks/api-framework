"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.endpointWrapper = exports.mountApi = exports.apiConfig = exports.apiClass = exports.apiRequireLogin = exports.apiBool = exports.apiFloat = exports.apiInt = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const exceptions_1 = require("./exceptions");
const registry = {};
function apiInt(val) {
    return parseInt(val, 10);
}
exports.apiInt = apiInt;
function apiFloat(val) {
    return parseFloat(val);
}
exports.apiFloat = apiFloat;
function apiBool(val) {
    if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') {
            return true;
        }
        if (val === '1') {
            return true;
        }
    }
    if (typeof val === 'number' && val === 1) {
        return true;
    }
    return !!val;
}
exports.apiBool = apiBool;
const apiRequireLogin = (response, next) => {
    if (response.locals.user === null) {
        throw new exceptions_1.HttpException(403, 'unauthorized', 'unauthorized');
    }
};
exports.apiRequireLogin = apiRequireLogin;
function apiClass({ requireLogin = false } = {}) {
    return (classObj) => {
        console.log('apiclass');
        const className = classObj.name;
        if (!(className in registry)) {
            registry[className] = {
                endpoints: {},
            };
        }
        registry[className] = Object.assign(Object.assign({}, registry[className]), { requireLogin, classObj });
        const functions = Object.getOwnPropertyNames(classObj.prototype).filter(fn => {
            return fn !== 'constructor' && !fn.startsWith('_');
        });
        for (const fn of functions) {
            if (!(fn in registry[className].endpoints)) {
                registry[className].endpoints[fn] = {};
            }
            registry[className].endpoints[fn] = Object.assign({ name: fn, fn: classObj.prototype[fn], requireLogin }, registry[className].endpoints[fn]);
        }
        console.log('registry', className, registry[className]);
        return classObj;
    };
}
exports.apiClass = apiClass;
function apiConfig({ requireLogin = false } = {}) {
    return (fn, name, descriptor) => {
        const className = fn.constructor.name;
        if (!(className in registry)) {
            registry[className] = {
                endpoints: {},
            };
        }
        registry[className].endpoints[name] = {
            requireLogin,
        };
        return fn;
    };
}
exports.apiConfig = apiConfig;
function mountApi(classObj, prefix) {
    console.log(classObj, prefix);
    const className = classObj.name;
    registry[className].urlPrefix = prefix;
}
exports.mountApi = mountApi;
function endpointWrapper(endpoint) {
    return (request, response, next) => __awaiter(this, void 0, void 0, function* () {
        console.log('requireLogin?', endpoint.requireLogin);
        if (endpoint.requireLogin) {
            try {
                (0, exports.apiRequireLogin)(response, next);
            }
            catch (e) {
                return next(e);
            }
        }
        try {
            const args = Object.assign(Object.assign({ _user: response.locals.user }, request.query), request.body);
            const body = yield endpoint.fn(args);
            console.log(args, body);
            return response.status(200).json(body);
        }
        catch (e) {
            if (e instanceof exceptions_1.HttpException) {
                return next(e);
            }
            console.log('An error occurred', e.stack);
            return next(new exceptions_1.HttpException());
        }
    });
}
exports.endpointWrapper = endpointWrapper;
function init(isLoggedInFn = null) {
    const app = (0, express_1.default)();
    const beforeRequest = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        console.log('isLoggedInFn?', isLoggedInFn);
        if (isLoggedInFn !== null) {
            res.locals.user = yield isLoggedInFn(req);
            console.log('is user', res.locals.user);
            res.setHeader('X-LOGGED-IN', res.locals.user ? '1' : '0');
        }
        next();
    });
    function errorMiddleware(error, request, response, next) {
        // console.log('errorMiddleware', error);
        const status = error.status || 500;
        const message = error.message || 'Something went wrong';
        const detail_code = error.detail_code || 'unknown';
        response.status(status).send({
            detail: message,
            detail_code,
        });
    }
    function defaulterrorMiddleware(error, request, response, next) {
        console.log('my dumb error ware', error);
        // if (!(error instanceof HaltException)) {
        // }
    }
    const corsOptions = {
        origin: 'http://localhost:3000',
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    };
    app.use(express_1.default.json());
    app.use(beforeRequest);
    app.use((0, cors_1.default)(corsOptions));
    app.options('*', (0, cors_1.default)()); // include before other routes
    // routes here
    for (const className of Object.keys(registry)) {
        console.log(`router for ${className} => ${registry[className].urlPrefix}`);
        const router = express_1.default.Router();
        app.use(registry[className].urlPrefix, router);
        for (const endpoint of Object.keys(registry[className].endpoints)) {
            const url = endpoint === 'index' ? '/' : `/${endpoint}`;
            router.all(url, endpointWrapper(registry[className].endpoints[endpoint]));
        }
    }
    // must go last
    app.use(errorMiddleware);
    app.use(defaulterrorMiddleware);
    return app;
}
exports.init = init;
//# sourceMappingURL=framework.js.map