import { Request } from 'express';
import * as framework from './framework';
// import * as exceptions from './exceptions';

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
    return { a, b, c };
  }
}

framework.mountApi(Test, '/test');

const app = framework.init(requireLogin);
app.listen(5001);
