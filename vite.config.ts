/// <reference types="vitest/config" />
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Em desenvolvimento, atende /api/* com os mesmos arquivos das funções da Vercel (api/<nome>.ts,
 * exportando GET/POST). Variáveis: ../.env (pasta "ZisBetter Team") e depois ./.env, que sobrescreve.
 */
function devApi(mode: string): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = { ...loadEnv(mode, path.resolve(__dirname, '..'), ''), ...loadEnv(mode, __dirname, '') };
      Object.assign(process.env, env);
      server.middlewares.use('/api', async (req, res) => {
        try {
          const name = (req.url ?? '/').split('?')[0].replace(/^\/+|\/+$/g, '');
          const file = path.join(__dirname, 'api', `${name}.ts`);
          if (!/^[\w-]+$/.test(name) || !fs.existsSync(file)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: 'Rota não encontrada.' }));
            return;
          }
          const mod = await server.ssrLoadModule(`/api/${name}.ts`);
          const handler = mod[req.method ?? 'GET'] as ((r: Request) => Promise<Response>) | undefined;
          if (!handler) {
            res.statusCode = 405;
            res.end(JSON.stringify({ message: 'Método não permitido.' }));
            return;
          }
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
          const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.originalUrl ?? '/api'}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: body ? new Uint8Array(body) : undefined,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          console.error(error);
          res.statusCode = 500;
          res.end(JSON.stringify({ message: 'Erro interno.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(mode)],
  test: { include: ['server/**/*.test.ts'] },
}));
