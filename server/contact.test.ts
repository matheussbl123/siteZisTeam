import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildEmail, formatBrasilia, handleContact, parseContact, sendToAppsScript, validateContact, type ContactDeps } from './contact';

const ENV = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/ABC/exec',
  APPS_SCRIPT_SECRET: 'segredo-teste',
};

const VALID = { name: 'Ana', contact: 'ana@exemplo.com', subject: 'Parceria', message: 'Olá!\nVamos conversar?' };

function post(body: unknown) {
  return new Request('http://localhost/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

function deps(result: unknown = { ok: true, notification: true }) {
  const send = typeof result === 'function' ? vi.fn(result as never) : vi.fn().mockResolvedValue(result);
  return { sendToAppsScript: send, now: () => new Date('2026-11-15T13:05:09Z') } as unknown as ContactDeps & { sendToAppsScript: ReturnType<typeof vi.fn> };
}

describe('parseContact', () => {
  it('aceita e-mail', () => expect(parseContact(' Ana@Exemplo.com ')).toEqual({ type: 'email', value: 'ana@exemplo.com' }));
  it('aceita celular com DDD', () => expect(parseContact('(32) 98474-1460')).toMatchObject({ type: 'phone', digits: '5532984741460' }));
  it('aceita +55 e fixo', () => expect(parseContact('+55 32 3333-4444')).toMatchObject({ type: 'phone', digits: '553233334444' }));
  it.each(['ana@', '1234', 'abc', '(32) 9847', '0 32 98474-1460'])('rejeita %s', (v) => expect(parseContact(v)).toBeNull());
});

describe('validateContact', () => {
  it('valida dados completos', () => expect(validateContact(VALID)).toMatchObject({ ok: true, spam: false }));
  it('aponta campos vazios', () => {
    const r = validateContact({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['contact', 'message', 'name', 'subject']);
  });
  it('detecta honeypot', () => expect(validateContact({ ...VALID, website: 'http://spam' })).toEqual({ ok: true, spam: true }));
  it('limita tamanho da mensagem', () => expect(validateContact({ ...VALID, message: 'x'.repeat(3001) }).ok).toBe(false));
});

describe('formatBrasilia', () => {
  it('converte para o horário de Brasília', () => expect(formatBrasilia(new Date('2026-11-15T13:05:09Z'))).toBe('15/11/2026 10:05:09'));
});

describe('buildEmail', () => {
  it('escapa HTML do visitante e responde direto ao e-mail dele', () => {
    const r = validateContact({ ...VALID, name: '<script>x</script>' });
    if (!r.ok || r.spam) throw new Error('inválido');
    const email = buildEmail(r.data, 'agora');
    expect(email.html).not.toContain('<script>');
    expect(email.replyTo).toBe('ana@exemplo.com');
  });
  it('inclui link de WhatsApp para telefone', () => {
    const r = validateContact({ ...VALID, contact: '32 98474-1460' });
    if (!r.ok || r.spam) throw new Error('inválido');
    const email = buildEmail(r.data, 'agora');
    expect(email.html).toContain('https://wa.me/5532984741460');
    expect(email.replyTo).toBeUndefined();
  });
});

describe('handleContact', () => {
  it('envia a linha e o e-mail para o Apps Script', async () => {
    const d = deps();
    const res = await handleContact(post(VALID), ENV, d);
    expect(res.status).toBe(200);
    const [env, payload] = d.sendToAppsScript.mock.calls[0];
    expect(env).toEqual({ url: ENV.APPS_SCRIPT_URL, secret: 'segredo-teste' });
    expect(payload.row).toEqual(['15/11/2026 10:05:09', 'Ana', 'ana@exemplo.com', 'Parceria', 'Olá!\nVamos conversar?']);
    expect(payload.email.subject).toBe('Novo contato ZisTeam: Parceria');
  });

  it('responde 503 sem configuração', async () => {
    const res = await handleContact(post(VALID), { ...ENV, APPS_SCRIPT_URL: '' }, deps());
    expect(res.status).toBe(503);
  });

  it('responde 400 com erros por campo', async () => {
    const res = await handleContact(post({ ...VALID, contact: 'nada' }), ENV, deps());
    expect(res.status).toBe(400);
    expect((await res.json()).errors.contact).toBeTruthy();
  });

  it('descarta spam sem chamar o Apps Script', async () => {
    const d = deps();
    const res = await handleContact(post({ ...VALID, website: 'x' }), ENV, d);
    expect(res.status).toBe(200);
    expect(d.sendToAppsScript).not.toHaveBeenCalled();
  });

  it('responde 502 se o Apps Script estiver fora do ar', async () => {
    const res = await handleContact(post(VALID), ENV, deps(async () => { throw new Error('timeout'); }));
    expect(res.status).toBe(502);
  });

  it('responde 502 se a planilha falhar no Apps Script', async () => {
    const res = await handleContact(post(VALID), ENV, deps({ ok: false, error: 'planilha' }));
    expect(res.status).toBe(502);
  });

  it('responde 202 se só o e-mail falhar (contato já salvo)', async () => {
    const res = await handleContact(post(VALID), ENV, deps({ ok: true, notification: false }));
    expect(res.status).toBe(202);
    expect((await res.json()).ok).toBe(true);
  });

  it('recusa métodos diferentes de POST', async () => {
    const res = await handleContact(new Request('http://localhost/api/contact'), ENV, deps());
    expect(res.status).toBe(405);
  });
});

describe('sendToAppsScript', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  it('manda o segredo, a linha e o e-mail como texto JSON', async () => {
    let call: { url: string; init: RequestInit } | undefined;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      call = { url, init };
      return new Response(JSON.stringify({ ok: true, notification: true }));
    }) as typeof fetch;
    const email = { subject: 's', html: '<p>h</p>', text: 't', replyTo: undefined };
    const r = await sendToAppsScript({ url: 'https://x/exec', secret: 'abc' }, { row: ['a', 'b', 'c', 'd', 'e'], email });
    expect(r).toEqual({ ok: true, notification: true });
    expect(call!.url).toBe('https://x/exec');
    expect(JSON.parse(String(call!.init.body))).toEqual({ secret: 'abc', row: ['a', 'b', 'c', 'd', 'e'], email: { subject: 's', html: '<p>h</p>', text: 't' } });
  });

  it('explica quando recebe HTML em vez de JSON (implantação sem acesso público)', async () => {
    globalThis.fetch = (async () => new Response('<html>Fazer login</html>')) as unknown as typeof fetch;
    const email = { subject: 's', html: '', text: '', replyTo: undefined };
    await expect(sendToAppsScript({ url: 'https://x/exec', secret: 'abc' }, { row: [], email })).rejects.toThrow('Qualquer pessoa');
  });
});
