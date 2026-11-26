export type ContactEnv = Record<string, string | undefined>;

export type ScriptEnv = { url: string; secret: string };

/** Lê APPS_SCRIPT_URL/APPS_SCRIPT_SECRET; null se faltar algum. */
export function scriptEnv(env: ContactEnv): ScriptEnv | null {
  const url = env.APPS_SCRIPT_URL?.trim();
  const secret = env.APPS_SCRIPT_SECRET?.trim();
  return url && secret ? { url, secret } : null;
}

/**
 * Chama o Google Apps Script publicado na conta pessoal (apps-script/Code.gs).
 * O Apps Script responde com redirecionamento 302 → GET; o fetch segue sozinho.
 */
export async function callAppsScript<T = Record<string, unknown>>(env: ScriptEnv, payload: Record<string, unknown>): Promise<T & { ok: boolean; error?: string }> {
  const response = await fetch(env.url, {
    method: 'POST',
    // text/plain evita preflight e é o formato que o Apps Script lê em e.postData.contents.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: env.secret, ...payload }),
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Apps Script retornou ${response.status}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text) as T & { ok: boolean; error?: string };
  } catch {
    // Geralmente uma página HTML de login: a implantação não está como "Qualquer pessoa".
    throw new Error(`Apps Script não respondeu JSON (confira "Quem pode acessar: Qualquer pessoa"): ${text.slice(0, 200)}`);
  }
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
