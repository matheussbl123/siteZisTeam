import { useEffect, useState } from 'react';
import { navAlias, type SectionId } from './content';

const SECTIONS: SectionId[] = ['inicio', 'sobre', 'midia', 'racing', 'sports', 'gaming', 'contato'];

/** Qual seção está no meio da tela (para destacar o item do menu). */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>('inicio');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId;
            setActive(navAlias[id] ?? id);
          }
        }
      },
      { rootMargin: '-45% 0px -54% 0px' },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

export function useScrolled(threshold = 40): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function scrollToSection(id: SectionId) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', id === 'inicio' ? location.pathname : `#${id}`);
}
