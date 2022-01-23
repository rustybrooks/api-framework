import * as framework from './framework';

@framework.Api()
class Test {
  constructor() {
    console.log('construct');
  }

  async test1({ a, b = 'hi', c = 'there' }: { a: number; b?: string; c?: string }) {
    console.log(a, b, c);
    return { a, b, c };
  }
}

framework.mountApi(Test, '/test');

const app = framework.init();
app.listen(5001);
