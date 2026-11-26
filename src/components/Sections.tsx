import { useEffect, useState } from 'react';
import { about, gaming, media, racing, social, sports } from '../content';

type Img = { src: string; w: number; h: number; name?: string; alt?: string };

function Logo({ img, className }: { img: Img; className?: string }) {
  return <img className={className} src={img.src} alt={img.alt ?? img.name ?? ''} width={img.w} height={img.h} loading="lazy" decoding="async" />;
}

export function Slashes() {
  return <span className="slashes" aria-hidden="true">//</span>;
}

/** Barras duplas grandes dos títulos de seção (desenhadas, como na arte). */
function BigSlashes() {
  return (
    <svg className="big-title__slashes" viewBox="0 0 66 118" aria-hidden="true">
      <path d="M26 0h16L16 118H0zM50 0h16L40 118H24z" fill="currentColor" />
    </svg>
  );
}

export function BigTitle({ children, id }: { children: string; id: string }) {
  return (
    <h2 className="big-title" id={id}>
      <BigSlashes />
      <span>{children}</span>
    </h2>
  );
}

export function About() {
  return (
    <section id="sobre" className="section about" aria-labelledby="sobre-titulo">
      <h2 className="about__headline" id="sobre-titulo">
        {about.headline.map((line, i) => (
          <span key={i} className="about__line">
            {line.map((part) => (
              <span key={part.text} className={part.yellow ? 'is-yellow' : undefined}>{part.text}</span>
            ))}
          </span>
        ))}
      </h2>
      <div className="about__body">
        <h3 className="kicker"><Slashes />{about.subtitle}</h3>
        <p className="body-text about__text">{about.text}</p>
        <p className="label about__label">Apoio:</p>
        <ul className="about__supporters" aria-label="Apoio">
          {about.supporters.map((s) => <li key={s.name}><Logo img={s} /></li>)}
        </ul>
      </div>
      <div className="about__brands">
        <div className="about__group">
          <p className="label">Marcas<br />oficiais</p>
          <ul aria-label="Marcas oficiais">{about.brands.map((b) => <li key={b.name}><Logo img={b} /></li>)}</ul>
        </div>
        <div className="about__group about__group--mascot">
          <p className="label">Zangas,<br />o mascote</p>
          <ul aria-label="Zangas, o mascote">{about.mascot.map((b) => <li key={b.name}><Logo img={b} /></li>)}</ul>
        </div>
      </div>
    </section>
  );
}

type PublicConfig = {
  youtube: { videoId: string } | null;
  instagram: { kind: 'image'; image: string; permalink: string; alt: string } | { kind: 'embed'; shortcode: string; permalink: string } | null;
};

/** Vídeo e post escolhidos na página /admin (com o conteúdo do layout como reserva). */
function usePublicConfig(): PublicConfig | null {
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  useEffect(() => {
    fetch('/api/site-config').then((r) => (r.ok ? r.json() : null)).then(setCfg).catch(() => setCfg(null));
  }, []);
  return cfg;
}

export function Media() {
  const [playing, setPlaying] = useState(false);
  const cfg = usePublicConfig();
  const videoId = cfg?.youtube?.videoId || media.youtubeVideoId;
  const ig = cfg?.instagram;
  return (
    <section id="midia" className="section media" aria-label="Acompanhe e assista">
      <div className="media__post">
        <h2 className="kicker kicker--lg"><Slashes />ACOMPANHE!</h2>
        {ig?.kind === 'embed' ? (
          <div className="media__post-link media__post-embed">
            <iframe src={`https://www.instagram.com/p/${ig.shortcode}/embed`} title="Post da ZisTeam no Instagram" loading="lazy" scrolling="no" />
          </div>
        ) : (
          <a href={ig?.permalink ?? media.instagramPost.href} target="_blank" rel="noreferrer" className="media__post-link" aria-label="Ver post no Instagram da ZisTeam">
            {ig?.kind === 'image'
              ? <img className="media__post-photo" src={ig.image} alt={ig.alt} width={464} height={619} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              : <img src={media.instagramPost.image} alt={media.instagramPost.alt} width={464} height={619} loading="lazy" decoding="async" />}
          </a>
        )}
      </div>
      <div className="media__video">
        <h2 className="kicker kicker--lg"><Slashes />ASSISTA!</h2>
        <div className="media__player">
          {videoId && playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title="Vídeo da ZisTeam no YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoId ? (
            <button type="button" className="media__facade" onClick={() => setPlaying(true)} aria-label="Reproduzir vídeo da ZisTeam">
              <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" />
              <PlayIcon />
            </button>
          ) : (
            <a className="media__facade media__facade--empty" href={social.links[1].href} target="_blank" rel="noreferrer" aria-label="Assistir à ZisTeam no YouTube">
              <PlayIcon />
              <span>Assista no nosso canal</span>
            </a>
          )}
        </div>
        <div className="media__social">
          <p className="media__follow">
            SIGA <img src="/assets/handle-zisteambr.webp" alt={social.handle} width={231} height={54} loading="lazy" /> NAS REDES SOCIAIS.
          </p>
          <ul className="media__icons">
            {social.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noreferrer" aria-label={`ZisTeam no ${l.label}`}>
                  <img src={l.icon} alt="" width={l.w} height={l.h} loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg className="media__play" viewBox="0 0 68 48" aria-hidden="true">
      <path d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.6 8.6 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.6 8.6 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.6 8.6 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#000" fillOpacity=".8" />
      <path d="M45 24 27 14v20z" fill="#FDC017" />
    </svg>
  );
}

export function Racing() {
  return (
    <section id="racing" className="section division division--racing" aria-labelledby="racing-titulo">
      <div className="division__intro">
        <BigTitle id="racing-titulo">RACING.</BigTitle>
        <p className="body-text division__text">{racing.text}</p>
      </div>
      <img className="division__image racing__car" src={racing.image.src} alt={racing.image.alt} width={racing.image.w} height={racing.image.h} loading="lazy" decoding="async" />
      <ul className="racing__teams">
        {racing.teams.map((t) => (
          <li key={t.name}>
            <img src={t.badge} alt={t.name} width={161} height={109} loading="lazy" />
            <p className="body-text body-text--sm">{t.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Sports() {
  return (
    <section id="sports" className="section division division--sports" aria-labelledby="sports-titulo">
      <div className="division__intro">
        <BigTitle id="sports-titulo">SPORTS.</BigTitle>
        <p className="body-text division__text">{sports.text}</p>
        <ul className="division__icons division__icons--sports" aria-label="Modalidades">
          {sports.modalities.map((m) => <li key={m.name}><Logo img={m} /></li>)}
        </ul>
      </div>
      <img className="division__image sports__athlete" src={sports.image.src} alt={sports.image.alt} width={sports.image.w} height={sports.image.h} loading="lazy" decoding="async" />
    </section>
  );
}

export function Gaming() {
  return (
    <section id="gaming" className="section division division--gaming" aria-labelledby="gaming-titulo">
      <div className="division__intro">
        <BigTitle id="gaming-titulo">GAMING.</BigTitle>
        <p className="body-text division__text">{gaming.text}</p>
        <ul className="division__icons division__icons--games" aria-label="Jogos">
          {gaming.games.map((g) => <li key={g.name}><Logo img={g} /></li>)}
        </ul>
      </div>
      <img className="division__image gaming__chars" src={gaming.image.src} alt={gaming.image.alt} width={gaming.image.w} height={gaming.image.h} loading="lazy" decoding="async" />
    </section>
  );
}
