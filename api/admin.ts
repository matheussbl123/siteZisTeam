import { handleAdmin } from '../server/admin.js';

// Função serverless da Vercel: /api/admin?acao=login|reset|sessao|senha|sair|config
export async function GET(request: Request): Promise<Response> {
  return handleAdmin(request, process.env);
}

export async function POST(request: Request): Promise<Response> {
  return handleAdmin(request, process.env);
}
