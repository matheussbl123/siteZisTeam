import { useState, type FormEvent, type ReactNode } from 'react';
import { contact } from '../content';
import { BigTitle } from './Sections';

type Field = 'name' | 'contact' | 'subject' | 'message';
type Errors = Partial<Record<Field, string>>;
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

const LIMITS: Record<Field, number> = { name: 120, contact: 160, subject: 160, message: 3000 };
const EMPTY = { name: '', contact: '', subject: '', message: '', website: '' };

function isValidContact(value: string): boolean {
  const v = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
  if (!/^[\d\s()+.-]+$/.test(v)) return false;
  let d = v.replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return (d.length === 10 || d.length === 11) && !d.startsWith('0');
}

function validate(values: typeof EMPTY): Errors {
  const e: Errors = {};
  if (!values.name.trim()) e.name = 'Informe seu nome.';
  if (!values.contact.trim()) e.contact = 'Informe um e-mail ou WhatsApp para podermos responder.';
  else if (!isValidContact(values.contact)) e.contact = 'Informe um e-mail ou WhatsApp válido para podermos responder.';
  if (!values.subject.trim()) e.subject = 'Informe o assunto.';
  if (!values.message.trim()) e.message = 'Escreva sua mensagem.';
  return e;
}

export function Contact() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (field in errors) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === 'sending') return;
    const found = validate(values);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      document.getElementById(`campo-${first}`)?.focus();
      setStatus({ kind: 'idle' });
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Errors };
      if (response.ok) {
        setValues(EMPTY);
        setStatus({ kind: 'success', message: body.message ?? 'Mensagem enviada com sucesso. Obrigado pelo contato!' });
      } else {
        if (body.errors) setErrors(body.errors);
        setStatus({ kind: 'error', message: body.message ?? 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.' });
      }
    } catch {
      setStatus({ kind: 'error', message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' });
    }
  }

  const sending = status.kind === 'sending';

  const row = (field: Field, label: ReactNode, opts: { textarea?: boolean; type?: string; autoComplete?: string; placeholder?: string } = {}) => {
    const id = `campo-${field}`;
    const errId = `${id}-erro`;
    const common = {
      id,
      name: field,
      value: values[field],
      onChange: set(field),
      maxLength: LIMITS[field],
      required: true,
      'aria-invalid': errors[field] ? true : undefined,
      'aria-describedby': errors[field] ? errId : undefined,
      autoComplete: opts.autoComplete,
      placeholder: opts.placeholder,
    };
    return (
      <div className={`form__row${opts.textarea ? ' form__row--textarea' : ''}`}>
        <div className="form__label">
          <label htmlFor={id}>{label}</label>
          {opts.textarea && (
            <button type="submit" className="form__submit" disabled={sending} aria-busy={sending}>
              {sending ? 'ENVIANDO…' : 'ENVIAR'}
            </button>
          )}
        </div>
        <div className="form__control">
          {opts.textarea ? <textarea {...common} rows={5} /> : <input {...common} type={opts.type ?? 'text'} />}
          {errors[field] && <p className="form__error" id={errId}>{errors[field]}</p>}
        </div>
      </div>
    );
  };

  return (
    <section id="contato" className="section contact" aria-labelledby="contato-titulo">
      <div className="contact__left">
        <BigTitle id="contato-titulo">CONTATO.</BigTitle>
        <p className="body-text contact__text">{contact.text}</p>

        <form className="form" onSubmit={onSubmit} noValidate>
          {row('name', 'Nome:', { autoComplete: 'name' })}
          {row('contact', <>Contato:<span className="sr-only"> e-mail ou WhatsApp</span></>, { autoComplete: 'email', placeholder: 'Seu e-mail ou WhatsApp' })}
          {row('subject', 'Assunto:')}
          {row('message', 'Mensagem', { textarea: true })}
          <div className="form__hp" aria-hidden="true">
            <label htmlFor="campo-website">Não preencha este campo</label>
            <input id="campo-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
          </div>
          <p className={`form__status form__status--${status.kind}`} role="status" aria-live="polite">
            {status.kind === 'success' || status.kind === 'error' ? status.message : ''}
          </p>
          <p className="form__privacy">Usaremos seus dados apenas para responder ao seu contato.</p>
        </form>
      </div>

      <div className="contact__right">
        <img className="contact__mascot" src={contact.mascot.src} alt={contact.mascot.alt} width={contact.mascot.w} height={contact.mascot.h} loading="lazy" decoding="async" />
        <div className="contact__info">
          <div>
            <p className="contact__label">Contatos:</p>
            <p className="contact__lines">
              <a href={contact.phone.href} target="_blank" rel="noreferrer">{contact.phone.label}</a>
              <a href={contact.email.href}>{contact.email.label}</a>
            </p>
          </div>
          <img className="contact__hashtag" src={contact.hashtag.src} alt={contact.hashtag.alt} width={contact.hashtag.w} height={contact.hashtag.h} loading="lazy" />
        </div>
        <ul className="contact__credits">
          {contact.credits.map((c) => (
            <li key={c.label}>
              <p>{c.label}</p>
              <img src={c.src} alt={c.name} width={c.w} height={c.h} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
