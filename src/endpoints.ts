import reflect, { ClassReflection } from 'tinspector';
import { apiClass, registry } from './framework';

interface Endpoint {
  app: string;
  function: string;
  ret_url: string;
  simple_url: string;
  args: string[];
  kwargs: string[];
  config: {
    require_login: false;
  };
}

@apiClass()
export class Endpoints {
  index() {
    const out: { [id: string]: { [id: string]: Endpoint } } = {};
    for (const className of Object.keys(registry)) {
      const metadata = reflect(registry[className].classObj) as unknown as ClassReflection;

      out[className] = {};
      for (const endpoint of Object.keys(registry[className].endpoints)) {
        const meta = metadata.methods.find(m => m.name === endpoint);
        const params = meta.parameters[0];
        let fields: any = [];
        if (params) {
          if (typeof params.fields === 'string') {
            // ??
          } else if (Array.isArray(params.fields)) {
            fields = params.fields;
          }
        }

        const url = endpoint === 'index' ? '/' : `/${endpoint}`;
        out[className][endpoint] = {
          app: className,
          function: endpoint,
          ret_url: url,
          args: [],
          simple_url: url,
          kwargs: fields.map((f: any) => {
            return typeof f === 'string' ? f : f;
          }),
          config: {
            require_login: registry[className].endpoints[endpoint].requireLogin,
          },
        };
      }
    }

    return out;
  }
}
