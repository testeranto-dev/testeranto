import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

export interface Route {
  method: string;
  path: string;
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
}

export interface Middleware {
  (req: IncomingMessage, res: ServerResponse, next: () => Promise<void>): Promise<void>;
}

export function createHttpServer(routes: Route[], middlewares: Middleware[] = []): HttpServer {
  const server = createServer(async (req, res) => {
    // Apply middlewares
    let middlewareIndex = 0;
    const next = async (): Promise<void> => {
      if (middlewareIndex < middlewares.length) {
        const middleware = middlewares[middlewareIndex];
        middlewareIndex++;
        await middleware(req, res, next);
      } else {
        // Find matching route
        const url = parse(req.url || '', true);
        const method = req.method || 'GET';
        const path = url.pathname || '';

        const route = routes.find(r =>
          r.method.toUpperCase() === method.toUpperCase() && r.path === path
        );

        if (route) {
          await route.handler(req, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      }
    };

    await next();
  });

  return server;
}

export function stopHttpServer(server: HttpServer): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        console.log('HTTP server stopped');
        resolve();
      }
    });
  });
}
