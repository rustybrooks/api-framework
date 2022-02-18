import { Request } from 'express';
import * as framework from './framework';
import * as exceptions from './exceptions';
import * as endpoints from './endpoints';

async function requireLogin(request: Request): Promise<any> {
  return null;
}

@framework.apiClass()
class Test {
  @framework.apiConfig({ requireLogin: true })
  async test1({ a, b = 'hi', c = 'there' }: { a: number; b?: string; c?: string }) {
    return { a, b, c };
  }

  async test2({ a, b = 'hi', c = 'there' }: { a: number; b?: string; c?: string }) {
    throw new exceptions.HttpException(500, 'bad thing');
    console.log('??');
    return { a, b, c };
  }
}

@framework.apiClass()
class Test2 {
  @framework.apiConfig({ requireLogin: true })
  async test1({ a, b = 'hi', c = 'there' }: { a: number; b?: string; c?: string }) {
    return 'test2!';
  }
}

framework.mountApi(Test, '/test');
framework.mountApi(endpoints.Endpoints, '/framework/endpoints');

const app = framework.init(requireLogin);
app.listen(5001);
