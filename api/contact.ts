import { handleContact } from '../server/contact.js';

// Função serverless da Vercel: POST /api/contact
export async function POST(request: Request): Promise<Response> {
  return handleContact(request, process.env);
}
