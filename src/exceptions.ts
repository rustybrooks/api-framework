type Details = string | { [id: string]: any };

export class HttpException extends Error {
  status: number;
  data: Details;
  detail_code: string;

  constructor(status = 500, details: Details = 'An unknown error occurred', detail_code: string = null) {
    super(detail_code);
    this.status = status;
    this.data = {
      details,
      detail_code,
    };
    this.detail_code = detail_code;
  }
}

export class HttpForbidden extends HttpException {
  constructor(details: Details = 'forbidden', detail_code = 'forbidden') {
    super(403, details, detail_code);
  }
}

export class HttpBadRequest extends HttpException {
  constructor(details: Details = 'bad request', detail_code = 'bad_request') {
    super(400, details, detail_code);
  }
}

export class HttpNotFound extends HttpException {
  constructor(details: Details = 'not found', detail_code = 'not_found') {
    super(404, details, detail_code);
  }
}
