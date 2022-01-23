"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpNotFound = exports.HttpBadRequest = exports.HttpForbidden = exports.HttpException = exports.HaltException = void 0;
class HaltException extends Error {
}
exports.HaltException = HaltException;
class HttpException extends Error {
    constructor(status = 500, detail = 'An unknown error occurred', detail_code = null) {
        super(detail);
        this.status = status;
        this.message = detail;
        this.detail_code = detail_code;
    }
}
exports.HttpException = HttpException;
class HttpForbidden extends HttpException {
    constructor(detail = 'forbidden', detail_code = 'forbidden') {
        super(403, detail, detail_code);
    }
}
exports.HttpForbidden = HttpForbidden;
class HttpBadRequest extends HttpException {
    constructor(detail = 'bad request', detail_code = 'bad_request') {
        super(400, detail, detail_code);
    }
}
exports.HttpBadRequest = HttpBadRequest;
class HttpNotFound extends HttpException {
    constructor(detail = 'not found', detail_code = 'not_found') {
        super(404, detail, detail_code);
    }
}
exports.HttpNotFound = HttpNotFound;
//# sourceMappingURL=exceptions.js.map