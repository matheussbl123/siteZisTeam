import { useCallback, useEffect, useRef, useState } from 'react';
import { heroSlides } from '../content';

export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const many = heroSlides.length > 1;

  const go = useCallback((delta: number) => {
    setIndex((i) => (i + delta + heroSlides.length) % heroSlides.length);
  }, []);

  useEffect(() => {
    if (!many || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(t);
  }, [many, paused, go]);

  return (
    <section
      id="inicio"
      className="hero"
      aria-roledescription={many ? 'carrossel' : undefined}
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null || !many) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <h1 className="sr-only">ZisTeam — uma equipe pra todo mundo</h1>
      {heroSlides.map((slide, i) => (
        <img
          key={slide.src}
          className={`hero__slide${i === index ? ' hero__slide--active' : ''}`}
          src={slide.src}
          alt={slide.alt}
          aria-hidden={i !== index}
          loading={i === 0 ? 'eager' : 'lazy'}
          width={1920}
          height={1080}
        />
      ))}
      {many && (
        <>
          <button type="button" className="hero__arrow hero__arrow--prev" aria-label="Imagem anterior" onClick={() => go(-1)}>
            <Chevron dir="left" />
          </button>
          <button type="button" className="hero__arrow hero__arrow--next" aria-label="Próxima imagem" onClick={() => go(1)}>
            <Chevron dir="right" />
          </button>
        </>
      )}
    </section>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 40" width="24" height="40" aria-hidden="true">
      <path d={dir === 'left' ? 'M19 4 5 20l14 16' : 'M5 4l14 16L5 36'} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" />
    </svg>
  );
}
