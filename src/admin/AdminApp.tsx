import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import './admin.css';

type Session = { usuario: string; precisaTrocar: boolean; email: string };
type Config = Partial<Record<'youtube_modo' | 'youtube_canal' | 'youtube_video' | 'instagram_modo' | 'instagram_behold' | 'instagram_post', string>>;
type Msg = { kind: 'ok' | 'erro'; text: string } | null;

async function api<T = Record<string, unknown>>(acao: string, init?: { method?: string; body?: unknown }) {
  const r = await fetch(`/api/admin?acao=${acao}`, {
    method: init?.method ?? (init?.body ? 'POST' : 'GET'),
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    credentials: 'same-origin',
  });
  const data = (await r.json().catch(() => ({}))) as T & { message?: string; code?: string };
  return { status: r.status, ok: r.ok, data };
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const refresh = async () => {
    const r = await api<Session>('sessao');
    setSession(r.ok ? r.data : null);
  };
  useEffect(() => {
    document.title = 'Admin — ZisTeam';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    refresh().catch(() => setSession(null));
  }, []);

  const sair = async () => {
    await api('sair', { method: 'POST' });
    setSession(null);
  };

  return (
    <div className="adm">
      <header className="adm__top">
        <a href="/" className="adm__logo"><img src="/assets/logo-zisteam.webp" alt="ZisTeam" width={117} height={48} /></a>
        <span className="adm__tag">Admin</span>
        {session && <button type="button" className="adm__link" onClick={sair}>Sair</button>}
      </header>
      <main className="adm__main">
        {session === undefined && <p className="adm__muted">Carregando…</p>}
        {session === null && <Login onLogged={refresh} />}
        {session && session.precisaTrocar && <ChangePassword first onDone={refresh} />}
        {session && !session.precisaTrocar && <Settings session={session} onPasswordChanged={refresh} />}
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="adm__card">
      <h1 className="adm__title"><span className="adm__slashes">//</span>{title}</h1>
      {children}
    </section>
  );
}

function Feedback({ msg }: { msg: Msg }) {
  return <p className={`adm__msg${msg ? ` adm__msg--${msg.kind}` : ''}`} role="status" aria-live="polite">{msg?.text ?? ''}</p>;
}

function Login({ onLogged }: { onLogged: () => void }) {
  const [usuario, setUsuario] = useState('zisteam_admin');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await api('login', { body: { usuario, senha } });
    setBusy(false);
    if (r.ok) onLogged();
    else setMsg({ kind: 'erro', text: r.data.message ?? 'Não foi possível entrar.' });
  };

  const primeiroAcesso = async () => {
    setBusy(true);
    setMsg(null);
    const r = await api('reset', { method: 'POST', body: {} });
    setBusy(false);
    setMsg({ kind: r.ok ? 'ok' : 'erro', text: r.data.message ?? 'Não foi possível enviar agora.' });
  };

  return (
    <Card title="ENTRAR">
      <form className="adm__form" onSubmit={entrar}>
        <label>Usuário<input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required /></label>
        <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></label>
        <button className="adm__btn" disabled={busy}>{busy ? 'Aguarde…' : 'Entrar'}</button>
      </form>
      <Feedback msg={msg} />
      <div className="adm__divider" />
      <p className="adm__muted">É o primeiro acesso ou esqueceu a senha? Enviamos uma senha temporária para o e-mail que recebe os contatos do site.</p>
      <button type="button" className="adm__btn adm__btn--ghost" onClick={primeiroAcesso} disabled={busy}>Primeiro acesso / esqueci a senha</button>
    </Card>
  );
}

function ChangePassword({ first, onDone, onCancel }: { first?: boolean; onDone: () => void; onCancel?: () => void }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (nova !== confirma) return setMsg({ kind: 'erro', text: 'A confirmação não é igual à nova senha.' });
    setBusy(true);
    setMsg(null);
    const r = await api('senha', { body: { atual, nova } });
    setBusy(false);
    if (r.ok) onDone();
    else setMsg({ kind: 'erro', text: r.data.message ?? 'Não foi possível trocar a senha.' });
  };

  return (
    <Card title={first ? 'CRIE SUA SENHA' : 'TROCAR SENHA'}>
      {first && <p className="adm__muted">Você entrou com uma senha temporária. Para continuar, crie uma senha nova (mínimo 10 caracteres, com letras e números).</p>}
      <form className="adm__form" onSubmit={salvar}>
        {!first && <label>Senha atual<input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" required /></label>}
        <label>Nova senha<input type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" minLength={10} required /></label>
        <label>Confirme a nova senha<input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" minLength={10} required /></label>
        <div className="adm__row">
          <button className="adm__btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button>
          {onCancel && <button type="button" className="adm__btn adm__btn--ghost" onClick={onCancel}>Cancelar</button>}
        </div>
      </form>
      <Feedback msg={msg} />
    </Card>
  );
}

function Settings({ session, onPasswordChanged }: { session: Session; onPasswordChanged: () => void }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    api<{ config: Config }>('config').then((r) => {
      if (r.ok) setCfg({ youtube_modo: 'padrao', instagram_modo: 'padrao', ...r.data.config });
      else setMsg({ kind: 'erro', text: r.data.message ?? 'Não foi possível carregar.' });
    });
  }, []);

  if (changing) return <ChangePassword onDone={() => { setChanging(false); setMsg({ kind: 'ok', text: 'Senha alterada.' }); onPasswordChanged(); }} onCancel={() => setChanging(false)} />;
  if (!cfg) return <Card title="CONFIGURAÇÕES"><p className="adm__muted">Carregando…</p><Feedback msg={msg} /></Card>;

  const set = (k: keyof Config) => (e: { target: { value: string } }) => setCfg((c) => ({ ...c, [k]: e.target.value }));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await api<{ config: Config }>('config', { body: cfg });
    setBusy(false);
    if (r.ok) { setCfg({ ...cfg, ...r.data.config }); setMsg({ kind: 'ok', text: r.data.message ?? 'Salvo.' }); }
    else setMsg({ kind: 'erro', text: r.data.message ?? 'Não foi possível salvar.' });
  };

  const ytId = videoIdOf(cfg.youtube_video ?? '');

  return (
    <Card title="CONFIGURAÇÕES">
      <p className="adm__muted">Conectado como <strong>{session.usuario}</strong> · e-mail da conta {session.email} · <button type="button" className="adm__link" onClick={() => setChanging(true)}>Trocar senha</button></p>
      <form className="adm__form" onSubmit={salvar}>
        <fieldset className="adm__group">
          <legend>Vídeo do YouTube (seção "Assista!")</legend>
          <Radio name="yt" value="ultimo" current={cfg.youtube_modo} onChange={set('youtube_modo')}>Mostrar sempre o último vídeo do canal</Radio>
          {cfg.youtube_modo === 'ultimo' && (
            <label>Canal do YouTube<input placeholder="https://www.youtube.com/@zisteambr" value={cfg.youtube_canal ?? ''} onChange={set('youtube_canal')} /></label>
          )}
          <Radio name="yt" value="fixo" current={cfg.youtube_modo} onChange={set('youtube_modo')}>Vídeo fixo</Radio>
          {cfg.youtube_modo === 'fixo' && (
            <>
              <label>Link do vídeo<input placeholder="https://youtu.be/..." value={cfg.youtube_video ?? ''} onChange={set('youtube_video')} /></label>
              {ytId && <img className="adm__preview" src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt="Prévia do vídeo" />}
            </>
          )}
          <Radio name="yt" value="padrao" current={cfg.youtube_modo} onChange={set('youtube_modo')}>Nenhum (mostra o botão "Assista no nosso canal")</Radio>
        </fieldset>

        <fieldset className="adm__group">
          <legend>Post do Instagram (seção "Acompanhe!")</legend>
          <Radio name="ig" value="automatico" current={cfg.instagram_modo} onChange={set('instagram_modo')}>Último post automático (feed do Behold)</Radio>
          {cfg.instagram_modo === 'automatico' && (
            <label>Endereço do feed do Behold<input placeholder="https://feeds.behold.so/..." value={cfg.instagram_behold ?? ''} onChange={set('instagram_behold')} />
              <small>Crie em behold.so conectando o Instagram @zisteambr (conta profissional) e copie o "JSON feed URL".</small></label>
          )}
          <Radio name="ig" value="fixo" current={cfg.instagram_modo} onChange={set('instagram_modo')}>Post fixo</Radio>
          {cfg.instagram_modo === 'fixo' && (
            <label>Link do post<input placeholder="https://www.instagram.com/p/..." value={cfg.instagram_post ?? ''} onChange={set('instagram_post')} /></label>
          )}
          <Radio name="ig" value="padrao" current={cfg.instagram_modo} onChange={set('instagram_modo')}>Imagem padrão do layout</Radio>
        </fieldset>

        <button className="adm__btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar configurações'}</button>
      </form>
      <Feedback msg={msg} />
    </Card>
  );
}

function Radio({ name, value, current, onChange, children }: { name: string; value: string; current?: string; onChange: (e: { target: { value: string } }) => void; children: ReactNode }) {
  return (
    <label className="adm__radio">
      <input type="radio" name={name} value={value} checked={current === value} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

function videoIdOf(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}
