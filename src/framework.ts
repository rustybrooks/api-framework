import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { HttpException } from './exceptions';

const registry: { [id: string]: any } = {};

export function apiInt(val: any) {
  return parseInt(val, 10);
}

export function apiFloat(val: any) {
  return parseFloat(val);
}

export function apiBool(val: any) {
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

export function Api({ requireLogin = false }: { requireLogin?: boolean } = {}) {
  return (classObj: any) => {
    const className = classObj.name;

    console.log('proto', Object.getOwnPropertyNames(classObj));
    const endpoints: any[] = Object.getOwnPropertyNames(classObj.prototype)
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

export function mountApi(classObj: any, prefix: string) {
  console.log(classObj, prefix);
  const className = classObj.name;
  registry[className].urlPrefix = prefix;
}

export function endpointWrapper(endpoint: any) {
  return async (request: Request, response: Response, next: NextFunction) => {
    console.log('endpoint thing', endpoint);
    try {
      const args = { ...request.query, ...request.body };
      const body = await endpoint.fn(args);
      console.log(args, body);
      return response.status(200).json(body);
    } catch (e) {
      console.log('An error occurred', e.stack);
      return next(new HttpException());
    }
  };
}

export function init() {
  const app = express();

  const beforeRequest = async (req: Request, res: Response, next: NextFunction) => {
    // res.locals.user = await users.isLoggedIn(req);
    // res.setHeader('X-LOGGED-IN', res.locals.user ? '1' : '0');
    next();
  };

  function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction) {
    // console.log('errorMiddleware', error);
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    const detail_code = error.detail_code || 'unknown';
    response.status(status).send({
      detail: message,
      detail_code,
    });
  }

  function defaulterrorMiddleware(error: Error, request: Request, response: Response, next: NextFunction) {
    console.log('my dumb error ware', error);
    // if (!(error instanceof HaltException)) {
    // }
  }

  const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  app.use(express.json());
  app.use(beforeRequest);

  app.use(cors(corsOptions));
  app.options('*', cors()); // include before other routes

  // routes here
  for (const className of Object.keys(registry)) {
    console.log(`router for ${className} => ${registry[className].urlPrefix}`);
    const router = express.Router();
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
