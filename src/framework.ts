import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { HttpException } from './exceptions';

export const registry: { [id: string]: any } = {};

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

export const apiRequireLogin = (response: Response, next: NextFunction) => {
  if (response.locals.user === null) {
    throw new HttpException(403, 'unauthorized', 'unauthorized');
  }
};

export function apiClass({ requireLogin = false }: { requireLogin?: boolean } = {}) {
  return (classObj: any) => {
    const className = classObj.name;

    if (!(className in registry)) {
      registry[className] = {
        endpoints: {},
      };
    }
    registry[className] = { ...registry[className], requireLogin, classObj };
    // console.log('class obj!', classObj, Object.getOwnPropertyNames(classObj));

    const functions = Object.getOwnPropertyNames(classObj.prototype).filter(fn => {
      return fn !== 'constructor' && !fn.startsWith('_');
    });
    for (const fn of functions) {
      if (!(fn in registry[className].endpoints)) {
        registry[className].endpoints[fn] = {};
      }
      // console.log(className, fn, classObj.prototype[fn]);
      registry[className].endpoints[fn] = { ...registry[className].endpoints[fn], name: fn, fn: classObj.prototype[fn], requireLogin };
      // console.log(registry[className].endpoints[fn]);
    }

    return classObj;
  };
}

export function apiConfig({ requireLogin = false }: { requireLogin?: boolean } = {}): any {
  return (fn: any, name: string, descriptor: any) => {
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

export function mountApi(classObj: any, prefix: string) {
  const className = classObj.name;
  registry[className].urlPrefix = prefix;
}

export function endpointWrapper(endpoint: any) {
  return async (request: Request, response: Response, next: NextFunction) => {
    if (endpoint.requireLogin) {
      try {
        apiRequireLogin(response, next);
      } catch (e) {
        return next(e);
      }
    }

    try {
      const args = { _user: response.locals.user, ...request.query, ...request.body };
      const body = await endpoint.fn(args);
      return response.status(200).json(body);
    } catch (e) {
      if (e instanceof HttpException) {
        return next(e);
      }
      console.log(e.stack);
      return next(new HttpException());
    }
  };
}

export function init(isLoggedInFn: (request: Request) => Promise<any> = null) {
  const app = express();

  const beforeRequest = async (req: Request, res: Response, next: NextFunction) => {
    if (isLoggedInFn !== null) {
      res.locals.user = await isLoggedInFn(req);
      res.setHeader('X-LOGGED-IN', res.locals.user ? '1' : '0');
    }
    next();
  };

  function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction) {
    const { status } = error;

    response.status(status).send(error.data);
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
    const router = express.Router();
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
