type Detail = string | { [id: string]: any };

export class HttpException extends Error {
  status: number;

  message: string;

  detail_code: string;

  constructor(status = 500, detail: Detail = 'An unknown error occurred', detail_code: string = null) {
    super(detail);
    this.status = status;
    this.message = detail;
    this.detail_code = detail_code;
  }
}

export class HttpForbidden extends HttpException {
  constructor(detail: Detail = 'forbidden', detail_code = 'forbidden') {
    super(403, detail, detail_code);
  }
}

export class HttpBadRequest extends HttpException {
  constructor(detail: Detail = 'bad request', detail_code = 'bad_request') {
    super(400, detail, detail_code);
  }
}

export class HttpNotFound extends HttpException {
  constructor(detail: Detail = 'not found', detail_code = 'not_found') {
    super(404, detail, detail_code);
  }
}
