import { describe, expect, it } from 'vitest';
import { handleAdmin, hashPassword, maskEmail, passwordProblem, readSession, signSession, verifyPassword, type AdminRecord, type AdminStore } from './admin';
import type { SiteConfig } from './siteConfig';

const ENV = { APPS_SCRIPT_URL: 'https://script.google.com/macros/s/X/exec', APPS_SCRIPT_SECRET: 'segredo-de-teste' };

function memoryStore(initial: AdminRecord = {}) {
  const state = { admin: { ...initial } as AdminRecord, config: {} as SiteConfig, emails: [] as Array<{ subject: string; text: string }> };
  const store: AdminStore = {
    async readAdmin() { return { admin: { ...state.admin }, email: 'zisteambr@gmail.com' }; },
    async saveAdmin(patch) { Object.assign(state.admin, patch); },
    async sendAdminEmail(e) { state.emails.push(e); },
    async readConfig() { return { ...state.config }; },
    async saveConfig(c) { state.config = { ...c }; },
  };
  return { state, store };
}

function req(acao: string, body?: unknown, cookie?: string) {
  return new Request(`https://zisteambr.vercel.app/api/admin?acao=${acao}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const cookieOf = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0];

describe('senhas e sessão', () => {
  it('gera e confere hash scrypt', async () => {
    const h = await hashPassword('SenhaForte123');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('SenhaForte123', h)).toBe(true);
    expect(await verifyPassword('outra', h)).toBe(false);
  });
  it('rejeita senhas fracas', () => {
    expect(passwordProblem('curta1')).toBeTruthy();
    expect(passwordProblem('somenteletras')).toBeTruthy();
    expect(passwordProblem('zisteam12345')).toBeTruthy();
    expect(passwordProblem('BoaSenha2026')).toBeNull();
  });
  it('mascara o e-mail', () => expect(maskEmail('zisteambr@gmail.com')).toBe('z*******r@gmail.com'));
  it('sessão assinada não aceita alteração', () => {
    const t = signSession({ u: 'zisteam_admin', v: '1', mc: false, exp: 2e12 }, 'k');
    expect(readSession(t, 'k', 1e12)?.u).toBe('zisteam_admin');
    expect(readSession(t, 'outra-chave', 1e12)).toBeNull();
    expect(readSession(t.replace(/^./, 'x'), 'k', 1e12)).toBeNull();
    expect(readSession(t, 'k', 3e12)).toBeNull(); // expirada
  });
});

describe('fluxo do admin', () => {
  const now = 1_800_000_000_000;

  it('primeiro acesso: envia senha temporária, exige troca e libera as configurações', async () => {
    const { state, store } = memoryStore();
    const deps = { store, now: () => now, newPassword: () => 'TempSenha23456789' };

    expect((await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'x' }), ENV, deps)).status).toBe(409);

    const reset = await handleAdmin(req('reset', {}), ENV, deps);
    expect(reset.status).toBe(200);
    expect(state.emails[0].text).toContain('TempSenha23456789');
    expect(state.admin.usuario).toBe('zisteam_admin');
    expect(state.admin.temp_hash).not.toContain('TempSenha'); // só hash na planilha

    const login = await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'TempSenha23456789' }), ENV, deps);
    expect(login.status).toBe(200);
    expect((await login.json()).precisaTrocar).toBe(true);
    const c1 = cookieOf(login);

    expect((await handleAdmin(req('config', undefined, c1), ENV, deps)).status).toBe(403);
    expect((await handleAdmin(req('senha', { nova: 'fraca' }, c1), ENV, deps)).status).toBe(400);

    const troca = await handleAdmin(req('senha', { nova: 'NovaSenha2026x' }, c1), ENV, deps);
    expect(troca.status).toBe(200);
    expect(state.admin.versao).toBe('2');
    expect(state.admin.temp_hash).toBe('');
    const c2 = cookieOf(troca);

    // a sessão antiga (versão 1) deixa de valer
    expect((await handleAdmin(req('sessao', undefined, c1), ENV, deps)).status).toBe(401);
    const sessao = await handleAdmin(req('sessao', undefined, c2), ENV, deps);
    expect(await sessao.json()).toMatchObject({ ok: true, precisaTrocar: false, email: 'z*******r@gmail.com' });

    const salvar = await handleAdmin(req('config', { youtube_modo: 'fixo', youtube_video: 'https://youtu.be/dQw4w9WgXcQ', instagram_modo: 'padrao' }, c2), ENV, deps);
    expect(salvar.status).toBe(200);
    expect(state.config.youtube_video).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // login normal com a senha nova
    const login2 = await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'NovaSenha2026x' }), ENV, deps);
    expect((await login2.json()).precisaTrocar).toBe(false);
  });

  it('bloqueia após 5 senhas erradas', async () => {
    const { state, store } = memoryStore({ usuario: 'zisteam_admin', hash: await hashPassword('Correta2026x'), versao: '1' });
    const deps = { store, now: () => now, newPassword: () => 'x' };
    for (let i = 0; i < 4; i++) expect((await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'errada' }), ENV, deps)).status).toBe(401);
    const quinta = await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'errada' }), ENV, deps);
    expect((await quinta.json()).message).toContain('bloqueado');
    expect(Number(state.admin.bloqueado_ate)).toBeGreaterThan(now);
    expect((await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'Correta2026x' }), ENV, deps)).status).toBe(429);
  });

  it('"esqueci a senha" não derruba a senha atual e não reenvia em sequência', async () => {
    const { state, store } = memoryStore({ usuario: 'zisteam_admin', hash: await hashPassword('Correta2026x'), versao: '3', precisa_trocar: '0' });
    const deps = { store, now: () => now, newPassword: () => 'TempSenha98765432' };
    await handleAdmin(req('reset', {}), ENV, deps);
    await handleAdmin(req('reset', {}), ENV, deps);
    expect(state.emails).toHaveLength(1);
    expect((await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'Correta2026x' }), ENV, deps)).status).toBe(200);
  });

  it('troca de senha comum exige a senha atual', async () => {
    const { store } = memoryStore({ usuario: 'zisteam_admin', hash: await hashPassword('Correta2026x'), versao: '1', precisa_trocar: '0' });
    const deps = { store, now: () => now, newPassword: () => 'x' };
    const c = cookieOf(await handleAdmin(req('login', { usuario: 'zisteam_admin', senha: 'Correta2026x' }), ENV, deps));
    expect((await handleAdmin(req('senha', { atual: 'errada', nova: 'OutraSenha2026' }, c), ENV, deps)).status).toBe(400);
    expect((await handleAdmin(req('senha', { atual: 'Correta2026x', nova: 'OutraSenha2026' }, c), ENV, deps)).status).toBe(200);
  });

  it('usuário errado recebe a mesma mensagem genérica', async () => {
    const { store } = memoryStore({ usuario: 'zisteam_admin', hash: await hashPassword('Correta2026x'), versao: '1' });
    const r = await handleAdmin(req('login', { usuario: 'admin', senha: 'Correta2026x' }), ENV, { store, now: () => now, newPassword: () => 'x' });
    expect(r.status).toBe(401);
    expect((await r.json()).message).toBe('Usuário ou senha inválidos.');
  });
});
