import { callAppsScript, json, type ContactEnv, type ScriptEnv } from './appsScript.js';

export type { ContactEnv };

export type ContactData = {
  name: string;
  contact: string;
  contactType: 'email' | 'phone';
  /** Somente dígitos com DDI 55, quando contactType === 'phone'. */
  phoneDigits?: string;
  subject: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; data: ContactData; spam: false }
  | { ok: true; spam: true }
  | { ok: false; errors: Partial<Record<'name' | 'contact' | 'subject' | 'message', string>> };

export const LIMITS = { name: 120, contact: 160, subject: 160, message: 3000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Aceita e-mail ou telefone brasileiro (10–11 dígitos, +55 opcional). */
export function parseContact(raw: string): { type: 'email'; value: string } | { type: 'phone'; value: string; digits: string } | null {
  const value = raw.trim();
  if (EMAIL_RE.test(value)) return { type: 'email', value: value.toLowerCase() };
  if (!/^[\d\s()+.-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  if (digits.startsWith('0')) return null;
  return { type: 'phone', value, digits: `55${digits}` };
}

export function validateContact(payload: unknown): ValidationResult {
  const body = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  // Honeypot: campo invisível para pessoas. Se vier preenchido, é robô.
  if (field(body.website)) return { ok: true, spam: true };

  const name = field(body.name);
  const contactRaw = field(body.contact);
  const subject = field(body.subject);
  const message = field(body.message);
  const errors: Extract<ValidationResult, { ok: false }>['errors'] = {};

  if (!name) errors.name = 'Informe seu nome.';
  else if (name.length > LIMITS.name) errors.name = `Use no máximo ${LIMITS.name} caracteres.`;

  const contact = contactRaw.length > LIMITS.contact ? null : parseContact(contactRaw);
  if (!contactRaw) errors.contact = 'Informe um e-mail ou WhatsApp para podermos responder.';
  else if (!contact) errors.contact = 'Informe um e-mail ou WhatsApp válido para podermos responder.';

  if (!subject) errors.subject = 'Informe o assunto.';
  else if (subject.length > LIMITS.subject) errors.subject = `Use no máximo ${LIMITS.subject} caracteres.`;

  if (!message) errors.message = 'Escreva sua mensagem.';
  else if (message.length > LIMITS.message) errors.message = `Use no máximo ${LIMITS.message} caracteres.`;

  if (Object.keys(errors).length > 0 || !contact) return { ok: false, errors };
  return {
    ok: true,
    spam: false,
    data: {
      name,
      subject,
      message,
      contact: contact.value,
      contactType: contact.type,
      phoneDigits: contact.type === 'phone' ? contact.digits : undefined,
    },
  };
}

export function formatBrasilia(date: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);
}

export function buildEmail(data: ContactData, receivedAt: string) {
  const contactHtml = data.contactType === 'email'
    ? `<a href="mailto:${escapeHtml(data.contact)}">${escapeHtml(data.contact)}</a>`
    : `${escapeHtml(data.contact)} — <a href="https://wa.me/${data.phoneDigits}">abrir no WhatsApp</a>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="margin:0 0 16px">Novo contato pelo site ZisTeam</h2>
<p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>
<p><strong>Contato:</strong> ${contactHtml}</p>
<p><strong>Assunto:</strong> ${escapeHtml(data.subject)}</p>
<p><strong>Mensagem:</strong><br>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
<p style="color:#666;font-size:13px">Recebido em ${receivedAt} (horário de Brasília). Registro salvo na planilha de contatos.</p>
</div>`;
  const text = [
    'Novo contato pelo site ZisTeam',
    `Nome: ${data.name}`,
    `Contato: ${data.contact}${data.phoneDigits ? ` (WhatsApp: https://wa.me/${data.phoneDigits})` : ''}`,
    `Assunto: ${data.subject}`,
    'Mensagem:',
    data.message,
    '',
    `Recebido em ${receivedAt} (horário de Brasília).`,
  ].join('\n');
  return {
    subject: `Novo contato ZisTeam: ${data.subject}`.slice(0, 200),
    html,
    text,
    replyTo: data.contactType === 'email' ? data.contact : undefined,
  };
}

export type AppsScriptResult = { ok: boolean; notification?: boolean; error?: string };

/**
 * Envia o contato para o Google Apps Script publicado na conta pessoal (apps-script/Code.gs),
 * que grava a linha na planilha e manda o e-mail pelo Gmail do dono.
 */
export async function sendToAppsScript(
  env: ScriptEnv,
  payload: { row: string[]; email: ReturnType<typeof buildEmail> },
): Promise<AppsScriptResult> {
  return callAppsScript<AppsScriptResult>(env, { action: 'contato', ...payload });
}

export type ContactDeps = {
  sendToAppsScript: typeof sendToAppsScript;
  now: () => Date;
};

const defaultDeps: ContactDeps = { sendToAppsScript, now: () => new Date() };

const SUCCESS = 'Mensagem enviada com sucesso. Obrigado pelo contato!';

export async function handleContact(request: Request, env: ContactEnv, deps: ContactDeps = defaultDeps): Promise<Response> {
  if (request.method !== 'POST') return json({ message: 'Método não permitido.' }, 405);

  const url = env.APPS_SCRIPT_URL?.trim();
  const secret = env.APPS_SCRIPT_SECRET?.trim();
  if (!url || !secret) {
    const missing = Object.entries({ APPS_SCRIPT_URL: url, APPS_SCRIPT_SECRET: secret }).filter(([, v]) => !v).map(([k]) => k);
    console.error('Formulário de contato sem configuração:', missing.join(', '));
    return json({ message: 'O formulário ainda não está configurado para receber mensagens. Fale conosco por contato@zisteam.com.' }, 503);
  }

  let payload: unknown;
  try { payload = await request.json(); } catch { return json({ message: 'Dados de envio inválidos.' }, 400); }

  const result = validateContact(payload);
  if (!result.ok) return json({ message: 'Confira os campos destacados.', errors: result.errors }, 400);
  if (result.spam) return json({ ok: true, message: SUCCESS });

  const { data } = result;
  const receivedAt = formatBrasilia(deps.now());

  let outcome: AppsScriptResult;
  try {
    outcome = await deps.sendToAppsScript({ url, secret }, {
      row: [receivedAt, data.name, data.contact, data.subject, data.message],
      email: buildEmail(data, receivedAt),
    });
  } catch (error) {
    console.error('Falha ao falar com o Apps Script:', error);
    return json({ message: 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.' }, 502);
  }

  if (!outcome.ok) {
    console.error('Apps Script recusou o contato:', outcome.error);
    return json({ message: 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.' }, 502);
  }
  if (outcome.notification === false) {
    console.error('Contato gravado na planilha, mas o e-mail de aviso falhou.');
    return json({ ok: true, notification: false, message: SUCCESS }, 202);
  }
  return json({ ok: true, message: SUCCESS });
}
