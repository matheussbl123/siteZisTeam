import { handleSiteConfig } from '../server/siteConfig.js';

// Função serverless da Vercel: GET /api/site-config (vídeo e post exibidos na seção Mídia)
export async function GET(request: Request): Promise<Response> {
  return handleSiteConfig(request, process.env);
}
