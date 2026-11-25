/// <reference types="vitest/config" />
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
 * Em desenvolvimento, atende POST /api/contact com o mesmo código da função da Vercel.
 * Variáveis: ../.env (pasta "ZisBetter Team") e depois ./.env, que sobrescreve.
 */
function devContactApi(mode: string): Plugin {
  return {
    name: 'dev-contact-api',
    apply: 'serve',
    configureServer(server) {
      const env = { ...loadEnv(mode, path.resolve(__dirname, '..'), ''), ...loadEnv(mode, __dirname, '') };
      server.middlewares.use('/api/contact', async (req, res) => {
        try {
          const { handleContact } = await server.ssrLoadModule('/server/contact.ts');
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
          const request = new Request(`http://localhost${req.originalUrl ?? '/api/contact'}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: body ? new Uint8Array(body) : undefined,
          });
          const response: Response = await handleContact(request, env);
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
  plugins: [react(), devContactApi(mode)],
  test: { include: ['server/**/*.test.ts'] },
}));
