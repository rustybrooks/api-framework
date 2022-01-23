import * as framework from './framework';

@framework.Api()
class Test {
  async test1({ a, b = 'hi', c = 'there' }: { a: number; b?: string; c?: string }) {
    return { a, b, c };
  }
}

framework.mountApi(Test, '/test');

const app = framework.init();
app.listen(5001);
