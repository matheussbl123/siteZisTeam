import { createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { callAppsScript, json, scriptEnv, type ContactEnv, type ScriptEnv } from './appsScript.js';
import { escapeHtml } from './contact.js';
import { normalizeConfig, type SiteConfig } from './siteConfig.js';

export const ADMIN_USER = 'zisteam_admin';
const COOKIE = 'zis_admin';
const SESSION_HOURS = 8;
const TEMP_MINUTES = 60;
const RESEND_MINUTES = 5;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export type AdminRecord = Partial<Record<'usuario' | 'hash' | 'temp_hash' | 'temp_expira' | 'temp_criada' | 'precisa_trocar' | 'versao' | 'falhas' | 'bloqueado_ate', string>>;

export type AdminStore = {
  readAdmin(): Promise<{ admin: AdminRecord; email: string }>;
  saveAdmin(patch: AdminRecord): Promise<void>;
  sendAdminEmail(email: { subject: string; html: string; text: string }): Promise<void>;
  readConfig(): Promise<SiteConfig>;
  saveConfig(config: SiteConfig): Promise<void>;
};

export type AdminDeps = { store: AdminStore; now: () => number; newPassword: () => string };

// ---------- Senhas ----------

function scrypt(password: string, salt: Buffer, len: number): Promise<Buffer> {
  return new Promise((resolve, reject) => scryptCb(password, salt, len, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 32);
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const [kind, , , , saltB64, keyB64] = stored.split('$');
  if (kind !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** 16 caracteres sem os ambíguos (0/O, 1/l/I). */
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 16; i++) out += chars[randomInt(chars.length)];
  return out;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (password.length > 200) return 'A senha é longa demais.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letras e números na senha.';
  if (password.toLowerCase().includes('zisteam')) return 'A senha não pode conter "zisteam".';
  return null;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const shown = user.length <= 2 ? user[0] : `${user[0]}${'*'.repeat(Math.max(3, user.length - 2))}${user[user.length - 1]}`;
  return `${shown}@${domain}`;
}

// ---------- Sessão (cookie assinado) ----------

type Session = { u: string; v: string; mc: boolean; exp: number };

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const sessionKey = (secret: string) => createHmac('sha256', secret).update('zisteam-admin-session-v1').digest();

export function signSession(s: Session, secret: string): string {
  const body = b64url(JSON.stringify(s));
  const sig = b64url(createHmac('sha256', sessionKey(secret)).update(body).digest());
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined, secret: string, now: number): Session | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = b64url(createHmac('sha256', sessionKey(secret)).update(body).digest());
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    return s.exp > now ? s : null;
  } catch {
    return null;
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const raw = request.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

function sessionCookie(token: string, maxAge: number): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

// ---------- Store real (Apps Script) ----------

export function appsScriptStore(env: ScriptEnv): AdminStore {
  const call = async (payload: Record<string, unknown>) => {
    const r = await callAppsScript<Record<string, unknown>>(env, payload);
    if (!r.ok) throw new Error(`Apps Script: ${r.error ?? 'erro'}`);
    return r;
  };
  return {
    async readAdmin() {
      const r = await call({ action: 'lerAdmin' });
      return { admin: (r.admin ?? {}) as AdminRecord, email: String(r.email ?? '') };
    },
    async saveAdmin(patch) { await call({ action: 'salvarAdmin', admin: patch }); },
    async sendAdminEmail(email) { await call({ action: 'emailAdmin', email }); },
    async readConfig() { return ((await call({ action: 'lerConfig' })).config ?? {}) as SiteConfig; },
    async saveConfig(config) { await call({ action: 'salvarConfig', config }); },
  };
}

// ---------- Handlers ----------

const GENERIC_LOGIN_ERROR = 'Usuário ou senha inválidos.';

async function body(request: Request): Promise<Record<string, unknown>> {
  try { return (await request.json()) as Record<string, unknown>; } catch { return {}; }
}
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: string | undefined) => Number(v || 0) || 0;

/** Sessão válida e com a mesma "versão" da senha atual (trocar a senha derruba sessões antigas). */
async function currentSession(request: Request, secret: string, deps: AdminDeps) {
  const s = readSession(cookieValue(request, COOKIE), secret, deps.now());
  if (!s) return null;
  const { admin, email } = await deps.store.readAdmin();
  if ((admin.versao || '1') !== s.v) return null;
  return { session: s, admin, email };
}

export async function handleAdmin(request: Request, env: ContactEnv, depsOverride?: Partial<AdminDeps>): Promise<Response> {
  const se = scriptEnv(env);
  if (!se) return json({ message: 'O admin ainda não está configurado no servidor.' }, 503);
  const deps: AdminDeps = { store: appsScriptStore(se), now: () => Date.now(), newPassword: generatePassword, ...depsOverride };
  const action = new URL(request.url).searchParams.get('acao') ?? '';
  const secret = se.secret;

  try {
    switch (`${request.method} ${action}`) {
      case 'POST login': return await login(request, secret, deps);
      case 'POST reset': return await reset(request, deps);
      case 'GET sessao': {
        const cur = await currentSession(request, secret, deps);
        return cur ? json({ ok: true, usuario: cur.session.u, precisaTrocar: cur.session.mc, email: maskEmail(cur.email) }) : json({ ok: false }, 401);
      }
      case 'POST senha': return await changePassword(request, secret, deps);
      case 'POST sair': return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
      case 'GET config': {
        const cur = await currentSession(request, secret, deps);
        if (!cur) return json({ message: 'Entre novamente.' }, 401);
        if (cur.session.mc) return json({ message: 'Troque a senha antes de continuar.' }, 403);
        return json({ ok: true, config: await deps.store.readConfig() });
      }
      case 'POST config': {
        const cur = await currentSession(request, secret, deps);
        if (!cur) return json({ message: 'Entre novamente.' }, 401);
        if (cur.session.mc) return json({ message: 'Troque a senha antes de continuar.' }, 403);
        const { config, errors } = normalizeConfig(await body(request));
        if (errors.length) return json({ message: errors.join(' ') }, 400);
        await deps.store.saveConfig(config);
        return json({ ok: true, config, message: 'Configurações salvas. O site atualiza em até 5 minutos.' });
      }
      default: return json({ message: 'Ação inválida.' }, 404);
    }
  } catch (error) {
    console.error('Erro no admin:', error);
    return json({ message: 'Não foi possível concluir agora. Tente novamente em instantes.' }, 502);
  }
}

async function login(request: Request, secret: string, deps: AdminDeps): Promise<Response> {
  const b = await body(request);
  const usuario = str(b.usuario).trim().toLowerCase();
  const senha = str(b.senha);
  const now = deps.now();
  const { admin } = await deps.store.readAdmin();

  if (!admin.hash && !admin.temp_hash) {
    return json({ code: 'primeiro_acesso', message: 'O admin ainda não tem senha. Clique em "Primeiro acesso / esqueci a senha" para receber uma senha temporária por e-mail.' }, 409);
  }
  if (num(admin.bloqueado_ate) > now) {
    const min = Math.ceil((num(admin.bloqueado_ate) - now) / 60000);
    return json({ message: `Muitas tentativas. Tente de novo em ${min} min.` }, 429);
  }

  const userOk = usuario === ADMIN_USER;
  const main = userOk && (await verifyPassword(senha, admin.hash));
  const temp = !main && userOk && num(admin.temp_expira) > now && (await verifyPassword(senha, admin.temp_hash));

  if (!main && !temp) {
    const falhas = num(admin.falhas) + 1;
    await deps.store.saveAdmin(falhas >= MAX_FAILS ? { falhas: '0', bloqueado_ate: String(now + LOCK_MINUTES * 60000) } : { falhas: String(falhas) });
    return json({ message: falhas >= MAX_FAILS ? `Muitas tentativas. Login bloqueado por ${LOCK_MINUTES} min.` : GENERIC_LOGIN_ERROR }, 401);
  }

  const mustChange = temp || admin.precisa_trocar === '1' || !admin.hash;
  if (num(admin.falhas) > 0) await deps.store.saveAdmin({ falhas: '0' });
  const token = signSession({ u: ADMIN_USER, v: admin.versao || '1', mc: mustChange, exp: now + SESSION_HOURS * 3600000 }, secret);
  return json({ ok: true, precisaTrocar: mustChange }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_HOURS * 3600) });
}

async function reset(request: Request, deps: AdminDeps): Promise<Response> {
  const now = deps.now();
  const { admin, email } = await deps.store.readAdmin();
  if (num(admin.temp_criada) > now - RESEND_MINUTES * 60000 && num(admin.temp_expira) > now) {
    return json({ ok: true, email: maskEmail(email), message: `Já enviamos uma senha temporária para ${maskEmail(email)} há poucos minutos. Confira a caixa de entrada e o spam.` });
  }
  const temp = deps.newPassword();
  const patch: AdminRecord = { temp_hash: await hashPassword(temp), temp_expira: String(now + TEMP_MINUTES * 60000), temp_criada: String(now) };
  if (!admin.usuario) Object.assign(patch, { usuario: ADMIN_USER, versao: '1', precisa_trocar: '1', falhas: '0' });
  await deps.store.saveAdmin(patch);

  const origin = new URL(request.url).origin;
  const link = `${origin}/admin`;
  await deps.store.sendAdminEmail({
    subject: 'Senha temporária do admin do site ZisTeam',
    text: [
      'Recebemos um pedido de acesso ao admin do site ZisTeam.',
      '',
      `Usuário: ${ADMIN_USER}`,
      `Senha temporária: ${temp}`,
      '',
      `Ela vale por ${TEMP_MINUTES} minutos. Ao entrar em ${link} você vai criar uma senha nova.`,
      'Se não foi você, ignore este e-mail: a senha atual continua valendo.',
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="margin:0 0 12px">Acesso ao admin do site ZisTeam</h2>
<p>Usuário: <strong>${ADMIN_USER}</strong><br>Senha temporária: <strong style="font-family:Consolas,monospace;font-size:18px;letter-spacing:1px">${escapeHtml(temp)}</strong></p>
<p>Ela vale por ${TEMP_MINUTES} minutos. Ao entrar em <a href="${escapeHtml(link)}">${escapeHtml(link)}</a> você vai criar uma senha nova.</p>
<p style="color:#666;font-size:13px">Se não foi você, ignore este e-mail: a senha atual continua valendo.</p>
</div>`,
  });
  return json({ ok: true, email: maskEmail(email), message: `Enviamos uma senha temporária para ${maskEmail(email)}. Ela vale por ${TEMP_MINUTES} minutos.` });
}

async function changePassword(request: Request, secret: string, deps: AdminDeps): Promise<Response> {
  const cur = await currentSession(request, secret, deps);
  if (!cur) return json({ message: 'Entre novamente.' }, 401);
  const b = await body(request);
  const atual = str(b.atual);
  const nova = str(b.nova);

  // No primeiro acesso (entrou com a senha temporária) não pede a senha atual de novo.
  if (!cur.session.mc && !(await verifyPassword(atual, cur.admin.hash))) return json({ message: 'A senha atual está incorreta.' }, 400);
  const problem = passwordProblem(nova);
  if (problem) return json({ message: problem }, 400);
  if (await verifyPassword(nova, cur.admin.temp_hash)) return json({ message: 'Escolha uma senha diferente da temporária.' }, 400);

  const versao = String(num(cur.admin.versao || '1') + 1);
  await deps.store.saveAdmin({ hash: await hashPassword(nova), temp_hash: '', temp_expira: '0', precisa_trocar: '0', versao, falhas: '0', bloqueado_ate: '0' });
  await deps.store.sendAdminEmail({
    subject: 'A senha do admin do site ZisTeam foi alterada',
    text: 'A senha do usuário zisteam_admin foi alterada agora. Se não foi você, use "Primeiro acesso / esqueci a senha" na página /admin.',
    html: '<p style="font-family:Arial,sans-serif">A senha do usuário <strong>zisteam_admin</strong> foi alterada agora.</p><p style="font-family:Arial,sans-serif;color:#666">Se não foi você, use "Primeiro acesso / esqueci a senha" na página /admin.</p>',
  }).catch((e) => console.error('Aviso de troca de senha não enviado:', e));

  const token = signSession({ u: ADMIN_USER, v: versao, mc: false, exp: deps.now() + SESSION_HOURS * 3600000 }, secret);
  return json({ ok: true, message: 'Senha alterada.' }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_HOURS * 3600) });
}
