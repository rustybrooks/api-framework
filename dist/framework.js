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
exports.init = exports.endpointWrapper = exports.mountApi = exports.Api = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const exceptions_1 = require("./exceptions");
const registry = {};
function Api({ requireLogin = false } = {}) {
    return (classObj) => {
        const className = classObj.name;
        const endpoints = Object.getOwnPropertyNames(classObj.prototype)
            .filter(fn => {
            console.log(`fn = ${fn}`, classObj.prototype[fn]);
            return fn !== 'constructor' && !fn.startsWith('_');
        })
            .map(fn => {
            return {
                name: classObj.prototype[fn].name,
                fn: classObj.prototype[fn],
            };
        });
        const data = {
            requireLogin,
            classObj,
            endpoints,
        };
        console.log('registry', className, data);
        registry[className] = data;
    };
}
exports.Api = Api;
function mountApi(classObj, prefix) {
    console.log(classObj, prefix);
    const className = classObj.name;
    registry[className].urlPrefix = prefix;
}
exports.mountApi = mountApi;
function endpointWrapper(endpoint) {
    return (request, response, next) => __awaiter(this, void 0, void 0, function* () {
        console.log('endpoint thing', endpoint);
        try {
            const body = endpoint.fn();
            response.status(200).json(body);
        }
        catch (e) {
            return next(new exceptions_1.HttpException());
        }
    });
}
exports.endpointWrapper = endpointWrapper;
function init() {
    const app = (0, express_1.default)();
    const beforeRequest = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        // res.locals.user = await users.isLoggedIn(req);
        // res.setHeader('X-LOGGED-IN', res.locals.user ? '1' : '0');
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
        for (const endpoint of registry[className].endpoints) {
            console.log(`endpoint ${endpoint.name}`);
            const url = endpoint.name === 'index' ? '/' : `/${endpoint.name}`;
            router.all(url, endpointWrapper(endpoint));
        }
    }
    // must go last
    app.use(errorMiddleware);
    app.use(defaulterrorMiddleware);
    return app;
}
exports.init = init;
//# sourceMappingURL=framework.js.map